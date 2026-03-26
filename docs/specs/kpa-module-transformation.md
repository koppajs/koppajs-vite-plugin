# KPA Module Transformation

- Status: Accepted
- Owners: Plugin maintainers
- Last updated: 2026-03-12

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
