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

## Mocking policy

- Prefer real TypeScript, Sass, PostCSS, and Acorn behavior over mocks for
  transformation tests.
- Mock Vite only at the boundary where hook behavior is being isolated.
- Do not mock `transformKpaToModule` when validating plugin output semantics.
- Avoid tests that merely restate implementation details without checking
  observable output.

## Quality gates

- Minimum gate for code changes: `pnpm check`.
- Additional gate for contract, build, dependency, or publish metadata changes:
  `pnpm validate`.
- Every bug fix requires a regression test unless the behavior is impossible to
  exercise with the current architecture; if so, document the gap in the change.

## Coverage expectations

The repository currently uses coverage reports as a diagnostic tool rather than a
hard numeric merge gate. The practical expectation is:

- cover every new branch in contract-sensitive code
- keep helper modules easy to exhaustively test
- use coverage output to identify blind spots in `src/index.ts`

## Current gaps to close over time

- The repo lacks fixture-based Vite integration tests for `load`, `resolveId`,
  and dev-server behavior.
- If build output file names or package exports change, keep the packaging
  metadata tests aligned in the same change.
