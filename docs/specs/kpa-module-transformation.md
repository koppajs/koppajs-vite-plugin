# KPA Module Transformation

- Status: Accepted
- Owners: Plugin maintainers
- Last updated: 2026-10-31

## Behavior

Transform a `.kpa` source file into a serialized `KoppaModule` object literal
that KoppaJS core can consume.

The transform must:

- parse template, style, and script blocks from the source
- compile script and style content where needed
- resolve script imports into runtime dependency loaders
- inject deterministic structural identity attributes into template markup
- emit a stable, versioned contract object

## Inputs

- raw `.kpa` source code
- source file id or path
- plugin options, currently `tsconfigFile?`
- pre-resolved dependency metadata gathered through Vite

Recognized blocks:

- first `[template]...[/template]`
- all `[css]...[/css]`, `[scss]...[/scss]`, `[sass]...[/sass]`
- first `[js]...[/js]` or `[ts]...[/ts]`

## Outputs

The transform returns a JavaScript object literal string with these fields:

- `contractVersion`: current module contract version
- `path`: normalized POSIX-style path for the `.kpa` file
- `template`: template HTML with injected `data-k-struct` attributes on custom
  elements when template content is non-empty
- `style`: compiled CSS string or an empty string
- `script`: wrapped controller string in the form `(() => { ... })()`
- `scriptMap`: sourcemap object for the script or `null`
- `deps`: dependency loader object or `null`
- `structAttr`: attribute name used for structural identity

## Host Compatibility

- Support Vite `^7.0.0 || ^8.0.0` on Node.js `>=22.12.0`.
- TypeScript is not a peer dependency. Component transpilation does not require
  a consumer-installed TypeScript compiler.
- Preserve the same emitted module contract across Vite majors.
- Verify real dev-server transforms and production builds, including TypeScript,
  SCSS and relative dependency imports, before extending the Vite peer range.
- This is a local, unreleased compatibility update; published 1.0.4 metadata
  still declares Vite 7 only until a maintainer publishes a new release.

## Script compilation

- Use `oxc-parser` 0.156.0 for the component import AST, independently of the
  repository TypeScript compiler.
- Use synchronous esbuild 0.28.2 `transformSync` for TypeScript-to-JavaScript
  transformation, with external sourcemaps and inline helpers.
- Resolve JSONC tsconfig files and their `extends` chain with `get-tsconfig`
  4.14.3. Supported targets are `es2015` and newer, or `esnext`; `es6` is an
  alias for `es2015`. `es3` and `es5` are unsupported. Other emit options
  follow esbuild support; `emitDecoratorMetadata` is explicitly rejected rather
  than silently dropped. Transpiler errors use the minimal-controller fallback;
  non-fatal warnings are reported without discarding valid code.
- Component scripts are controller function bodies, not standalone modules.
  The tsconfig `module` option must not add a module wrapper to these bodies.
- Preserve synchronous controller evaluation and legacy top-level returns.
  Invalid script input retains the minimal-controller fallback.
- Generated JavaScript whitespace and helper formatting are internal details,
  not a byte-for-byte public output guarantee.
- Preserve the existing sourcemap contract: maps are separate `scriptMap` data
  for the emitted script body, never inline `sourceMappingURL` or `sourceURL`
  directives. `scriptMap` may remain `null`.

## Constraints

- All emitted string fields must be JSON-serialized before insertion into the
  object literal.
- Duplicate imported identifiers in the script are rejected during import
  extraction.
- TypeScript source is transpiled with sourcemaps enabled and inline sourcemap
  comments removed from the executable script string.
- SCSS and SASS blocks are compiled through `sass` and post-processed with
  `autoprefixer`.
- The same `(path, template)` input pair must yield deterministic struct-id
  prefixes.
- Missing template or style blocks produce empty strings, not `undefined`.
- Missing or invalid script content produces a minimal controller equivalent to
  `return { state: {} };`.

## Edge cases

- Empty `.kpa` files still produce a valid contract object with empty strings and
  a minimal controller.
- Scripts containing backticks, quotes, or template literals must survive
  serialization without breaking the emitted object.
- Relative imports that cannot be resolved through Vite fall back to a root-based
  path derived from the importer location.
- Bare imports that cannot be resolved through Vite remain unchanged.
- Existing `data-k-struct` attributes in the template must not be duplicated.
- `scriptMap` may be `null` even when `script` is valid.

## Acceptance criteria

- `validateKoppaModule` accepts normal transform output.
- Contract tests pin the presence and type of all required fields.
- Regression tests cover duplicate imports, invalid script fallback, and
  serialization safety for complex script strings.
- Changes to this behavior are accompanied by updated tests and, if semantics
  change, an ADR.
