# Testing Strategy

## Philosophy

This plugin exists to preserve a contract between `.kpa` source files, Vite, and
the KoppaJS core runtime. Testing therefore focuses on transformation behavior,
output safety, and contract compatibility rather than UI rendering.

## Test layers

### Unit tests

Use unit tests for focused helpers and deterministic transforms:

- import extraction and dependency code generation
- struct-id generation and template injection
- module contract validation
- language transpilation helpers when behavior changes

### Contract tests

Use contract tests for `transformKpaToModule` and any exported API whose output
must remain stable across releases. These tests should verify field presence,
types, fallback behavior, path normalization, serialization safety, and contract
versioning.

### Plugin integration tests

Use plugin-level tests when a change touches Vite hooks, module resolution, file
loading, or dev-server behavior. Prefer fixture-driven tests over mocks once the
integration surface grows.

### End-to-end tests

This repository does not currently contain end-to-end application fixtures. Add
them only when changes require proof that Vite and a consuming KoppaJS project
behave correctly together, such as HMR semantics or full runtime sourcemap
attachment.

Do not add Playwright to this package itself unless the repository grows a real
previewable UI surface such as a demo app, Storybook, or interactive docs.

## Required test behavior by change type

- Utility change: add or update focused unit tests.
- Contract change: update contract tests, spec, and ADR together.
- Fallback behavior change: add success-path and failure-path tests.
- Import resolution change: test duplicate handling, stripping, and generated
  dependency loaders.
- Build configuration change: run at least `pnpm build` and `pnpm test`.

## Compiler migration acceptance

- Run real native TypeScript 7.0.2 `tsc` for type-checking and declaration
  emission; linting and transpilation do not substitute for those checks.
- Exercise Oxc import extraction with TypeScript syntax, duplicate imports,
  stripping, and dependency loader generation.
- Exercise esbuild synchronous controller bodies, composition and legacy
  returns, inline helpers, and invalid-input minimal fallback.
- Verify JSONC tsconfig and `extends` resolution with get-tsconfig; cover
  `es2015` and newer targets, `esnext`, the `es6` alias, and rejection of
  unsupported `es3`/`es5` targets. Module settings must not wrap controller
  function bodies as standalone modules.
- Preserve separate `scriptMap` data (or `null`) and removal of inline
  `sourceMappingURL`/`sourceURL` directives. Verify executable semantics and
  mapping structure rather than pinning compiler whitespace or helper layout.
- Run `pnpm test:package` after the build. It uses `pnpm pack` and `tar` to
  smoke-test the actual ESM and CJS payload with only declared production
  dependencies, including executable typed controllers, import extraction,
  and separate sourcemaps. `pnpm validate` includes this check.
- Rerun real Vite 7 and 8 dev-server/build integrations after migration.
  Earlier TypeScript 5 results are not evidence for TypeScript 7 correctness.

## Mocking policy

- Prefer real Oxc, esbuild, get-tsconfig, Sass, PostCSS, and Acorn behavior over mocks for
  transformation tests.
- Mock Vite only at the boundary where hook behavior is being isolated.
- Do not mock `transformKpaToModule` when validating plugin output semantics.
- Avoid tests that merely restate implementation details without checking
  observable output.

## Quality gates

- Minimum gate for code changes: `pnpm check`.
- Additional gate for contract, build, dependency, or publish metadata changes:
  `pnpm validate`.
- Hosted CI runs `pnpm validate` on Node.js 22 and 24; release automation
  reruns the same gate on the maintainer default from `.nvmrc` before publish.
- Every bug fix requires a regression test unless the behavior is impossible to
  exercise with the current architecture; if so, document the gap in the change.

## Coverage expectations

The repository currently uses coverage reports as a diagnostic tool rather than a
hard numeric merge gate. The practical expectation is:

- cover every new branch in contract-sensitive code
- keep helper modules easy to exhaustively test
- use coverage output to identify blind spots in `src/index.ts`

## Current gaps to close over time

- `test/vite-integration.test.ts` covers real dev-server and production-build
  transforms, including relative imports, TypeScript and SCSS. Run this suite
  on Vite 7 and 8 when changing the host compatibility range.
- If build output file names or package exports change, keep the packaging
  metadata tests aligned in the same change.
