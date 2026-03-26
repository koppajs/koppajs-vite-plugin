# Architecture

## System overview

`@koppajs/koppajs-vite-plugin` is a build-time adapter between Vite and KoppaJS
Single File Components (`.kpa`). Its job is to read a `.kpa` file, extract its
template, style, and script blocks, transform them into a normalized
`KoppaModule` object literal, and return that object through Vite's plugin
hooks.

The package is intentionally small and centered on one pipeline:

1. Resolve `.kpa` imports through Vite.
2. Read the source file from disk.
3. Parse logical blocks from the file contents.
4. Extract script imports and resolve them into runtime dependency loaders.
5. Transpile script and style blocks as needed.
6. Inject deterministic structural identifiers into the template.
7. Serialize the result into a versioned module contract consumed by KoppaJS
   core.

## Public surface

- `default` export from `src/index.ts`: the Vite plugin factory.
- `transformKpaToModule(...)`: exported transform function used by tests and any
  external tooling that needs the same serialization behavior.

Anything exported from `src/index.ts` is treated as public API because
`tsconfig.types.json` emits declarations from that entrypoint.

`src/module-contract.ts` remains the canonical internal contract definition used
by tests and source-level validation, but it is not currently published as its
own package subpath.

## Runtime and build boundaries

- The plugin is build-time only. It emits data for the KoppaJS core runtime but
  does not execute component logic itself.
- Node built-ins, `vite`, and declared dependencies are externalized in
  `vite.config.ts` unless they are explicitly allowlisted.
- The emitted `script` field is a string containing wrapped controller code. The
  runtime is responsible for evaluating it.
- Sourcemaps are preserved as `scriptMap` data, not as inline comments embedded
  in the executable `script` string.

## Core pipeline and responsibilities

### 1. Plugin wrapper

`src/index.ts` owns the Vite hooks:

- `configResolved` detects dev mode for debug logging.
- `configureServer` forces `.kpa` responses to `application/javascript`.
- `resolveId` normalizes relative `.kpa` imports to POSIX-style absolute paths.
- `load` reads the file, resolves import dependencies, and delegates final
  serialization to `transformKpaToModule`.

### 2. Source parsing

`parseKpaSource` extracts:

- the first `[template]...[/template]` block
- all `[css]`, `[scss]`, and `[sass]` blocks
- the first `[js]...[/js]` or `[ts]...[/ts]` block

Missing blocks are allowed. The transform layer converts missing template and
style blocks to empty strings and missing or invalid scripts to a minimal
controller.

### 3. Script analysis and transpilation

- `src/utils/extractImports.ts` removes static import declarations from the
  component script, rejects duplicate identifiers, and builds dependency loader
  metadata.
- `src/transpileToJs.ts` transpiles TypeScript with sourcemaps enabled, strips
  `sourceMappingURL` and `sourceURL` comments, and returns the map as data.
- `analyzeScriptForComposition` in `src/index.ts` detects composition-style
  scripts by looking for top-level variables and functions without a top-level
  `return`.
- `transpileScriptBlock` converts composition-style scripts into an explicit
  controller object with `state` and `methods`. Legacy scripts retain control
  over their own `return`.
- Invalid script content falls back to `return { state: {} };`.

### 4. Style compilation

`src/transpileToCss.ts` compiles `scss` and `sass` via `sass`, then runs
`autoprefixer` through `postcss`. Plain CSS is concatenated unchanged.

### 5. Template structural identity

- `src/utils/structId.ts` derives deterministic struct-id prefixes from the
  source path and template content.
- `src/utils/injectStructIds.ts` injects `data-k-struct` into custom element
  opening tags that do not already carry the attribute.
- The attribute name is centralized in `src/utils/identityConstants.ts`.

### 6. Module contract serialization

`transformKpaToModule` returns a JavaScript object literal string with these
fields:

- `contractVersion`
- `path`
- `template`
- `style`
- `script`
- `scriptMap`
- `deps`
- `structAttr`

All string fields are JSON-serialized before insertion into the object literal.
This is required to avoid breaking output when templates, styles, or scripts
contain backticks, quotes, or `${...}` sequences.

## Architectural invariants

- Output paths must be normalized to POSIX separators.
- The emitted contract must remain compatible with
  `src/module-contract.ts`.
- `script` must always be a string and must never contain inline sourcemap
  comments.
- `scriptMap` may be `null`, but if present it must describe the emitted script
  body, not the raw `.kpa` file.
- Dependency loader code must be generated from pre-resolved import metadata,
  never from raw string concatenation alone.
- Struct-id injection must be deterministic for the same `(path, template)`
  input pair.

## Module map

Detailed file-level boundaries live in
[docs/architecture/module-boundaries.md](docs/architecture/module-boundaries.md).

## Change triggers

Update this document when:

- a new transformation phase is added
- block parsing rules change
- module boundaries change
- new plugin options alter control flow
- the emitted contract or dependency resolution semantics change
