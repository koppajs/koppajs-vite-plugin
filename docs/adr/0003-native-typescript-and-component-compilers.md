# ADR 0003: Native TypeScript and Component Compilers

- Status: Accepted
- Date: 2026-10-31

## Context

TypeScript 7 provides native type-checking and declaration emission but no
stable standalone JavaScript compiler API equivalent to the TypeScript 5
transpilation, AST, and configuration APIs previously used by this plugin.
Component scripts are synchronous controller function bodies, including legacy
top-level returns, rather than standalone modules. The Vite 7/8 compatibility
work must survive the compiler migration without changing the KoppaModule
contract or its separate sourcemap representation.

## Decision

- Pin TypeScript exactly to 7.0.2 as a development dependency. Native `tsc`
  performs real type-checking and public declaration emission.
- Remove the TypeScript peer. Do not use a TypeScript 5 fallback/alias or a
  TypeScript peer ignore/override to hide incompatibility.
- Use the stable public interfaces of `oxc-parser` 0.156.0 for component import
  ASTs, esbuild 0.28.2 `transformSync` for transpilation, and get-tsconfig
  4.14.3 for JSONC configuration and `extends` inheritance.
- Emit esbuild helpers inline and external sourcemaps as separate `scriptMap`
  data. Strip inline source directives and retain the existing mapping contract.
- Preserve synchronous controllers and invalid-input minimal fallback. Do not
  apply standalone module wrappers according to tsconfig `module` settings.
- Support targets `es2015` and newer, or `esnext`, including the `es6` alias;
  do not support `es3` or `es5`. Other emit options follow esbuild support;
  explicitly reject `emitDecoratorMetadata` rather than silently dropping
  metadata. Non-fatal transpiler warnings are logged, not treated as invalid
  controllers. Exact output formatting is internal.
- Raise the package Node.js minimum to 22.12.0 for native Oxc. Development
  tooling continues to require Node 22.22.1+ or a current Node 24 patch.
- Use ESLint only for JavaScript and Oxlint 1.90.0 for TypeScript/TSX, replacing
  typescript-eslint. Remove the unused vite-tsconfig-paths dependency.

## Consequences

Component compilation no longer depends on a consumer TypeScript installation
or the repository compiler's JavaScript API. Separate maintained primitives
add dependencies and native platform requirements but keep their responsibilities
explicit. The higher Node minimum is a breaking host-support change introduced
in version 2.0.0.

Contract, sourcemap, fallback, tsconfig, native type-check/declaration, and both
Vite-major integration checks must be rerun. Earlier TypeScript 5 validation
cannot establish the correctness of this migration.

## Alternatives considered

- Use unstable TypeScript 7 APIs. Rejected because the component pipeline needs
  maintained standalone JavaScript interfaces with explicit responsibilities.
- Keep TypeScript 5 under an alias or fallback alongside TypeScript 7. Rejected
  because two compiler implementations retain the old runtime coupling and
  obscure the actual migration boundary.
- Keep TypeScript 5-only lint/config dependencies with peer overrides or ignored
  peers. Rejected because hiding incompatibility is not a supported contract;
  Oxlint and removal of unused vite-tsconfig-paths remove the blockers instead.
