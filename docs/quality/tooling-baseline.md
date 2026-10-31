# Tooling Baseline

## Repository type

This repository is a TypeScript Vite plugin library. It has no end-user UI,
Storybook, or interactive demo surface inside the repo.

## Active quality stack

- ESLint checks JavaScript scripts and configuration files.
- Oxlint 1.90.0 checks TypeScript/TSX source, tests, and configuration files.
- TypeScript 7.0.2 native `tsc` performs real type-checking and declarations.
- Prettier owns formatting and is kept separate from linting.
- Vitest covers unit, contract, integration, and packaging metadata behavior.
- A local documentation-contract validator keeps governed root docs in sync.
- Husky and lint-staged run fast pre-commit checks before commit.
- Commitlint enforces conventional commit messages.
- GitHub Actions runs `pnpm validate` in CI on Node.js 22 and 24, then reruns
  the release gate on the maintainer default from `.nvmrc`.

## Dependency Compatibility

Use Node 22.22.1+ on the Node 22 line or a current Node 24 patch for the
updated Vite 8, Vitest 5, ESLint 10 and lint-staged 17 development tools.
Version 2.0.0 requires Node.js >=22.12.0 for native Oxc. Node typings stay on
the supported Node 24 line rather than exposing Node 26-only APIs.

TypeScript is pinned exactly to 7.0.2 as a dev dependency, not a peer or runtime
compiler API. Native `tsc` owns repository type-checking and declaration
emission. Component import analysis uses `oxc-parser` 0.156.0; synchronous
transpilation uses esbuild 0.28.2; JSONC and tsconfig `extends` resolution use
get-tsconfig 4.14.3. TypeScript 7 has no stable standalone JavaScript compiler
API for this pipeline. Do not add an unstable API, TypeScript 5 alias/fallback,
or TypeScript peer ignore/override to bypass that boundary.

The unused vite-tsconfig-paths dependency is removed, along with
typescript-eslint. ESLint owns JavaScript and Oxlint owns TypeScript/TSX;
Prettier remains the formatting authority. See
[ADR 0003](../adr/0003-native-typescript-and-component-compilers.md).

The TypeScript 7.0.2 migration passed `pnpm validate` on Node 22.23.3 and
24.14.1 with pnpm 10.24.0: 214 tests, native type-checking/declarations, lint,
coverage, library build, and packed ESM/CJS smoke tests. Real Vite 7.3.7 and
8.3.5 dev-server/build integrations also passed on both Node lines. A frozen
strict-peer installation passed without TypeScript 5/6 or typescript-eslint
remaining in the lockfile. Coverage uses explicit include patterns, not the
removed `coverage.all`.

Packed ESM/CJS checks also pass on the package minimum Node 22.12.0. That
older Node patch emits an experimental `require(ESM)` warning when the CJS
entry loads Oxc; current validated Node 22/24 patches do not emit it.
TypeScript declaration output sets `rootDir: "src"` explicitly in
`tsconfig.types.json` so native tsc preserves the existing dist entry layout.

## Script contract

- `pnpm check:docs`: validate governed root docs and the local documentation contract.
- `pnpm format`: apply Prettier to tracked project files.
- `pnpm format:check`: verify formatting without changes.
- `pnpm lint`: run ESLint (JavaScript) and Oxlint (TypeScript/TSX) as failing gates.
- `pnpm lint:fix`: apply ESLint and Oxlint fixes, then fail on remaining warnings.
- `pnpm typecheck`: type-check the library source with native TypeScript 7 `tsc`.
- `pnpm test`: run the test suite once.
- `pnpm test:watch`: run Vitest in watch mode.
- `pnpm test:coverage`: run tests with coverage reporting.
- `pnpm check`: local quality gate for docs, formatting, linting, type-checking, and tests.
- `pnpm test:package`: pack the built package and verify ESM/CJS controllers, imports, and sourcemaps with only production dependencies. Requires `tar` on PATH.
- `pnpm validate`: CI/release gate for docs, formatting, linting, coverage, build output, and packed-package smoke tests.
- `pnpm build`: type-check, bundle, and emit public declarations.

## Hook policy

- `pre-commit`: run `pnpm run check:docs`, then staged ESLint/Oxlint and Prettier via `lint-staged`.
- `commit-msg`: validate conventional commits.
- No `pre-push` hook by default. Full-repo checks belong in `pnpm check`,
  `pnpm validate`, or CI.

## Deliberate omissions

- No Playwright: the package has no real UI surface to drive.
- No Stylelint: the repo does not maintain standalone CSS/SCSS source files as a
  first-class artifact; style behavior is verified through transform tests.
- No `.npmignore`: `package.json.files` is the publish allowlist and is easier
  to audit.

## Extension rules

- If a new build artifact, cache, or local automation output is introduced,
  update ignore files in the same change.
- If output filenames change, update `vite.config.ts`, `package.json`, and the
  packaging metadata tests together.
- If a real UI fixture is added, reconsider Playwright and possibly Stylelint at
  that time, not before.
- If the emitted contract changes, update the spec, tests, and ADRs together.
