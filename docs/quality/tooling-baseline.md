# Tooling Baseline

## Repository type

This repository is a TypeScript Vite plugin library. It has no end-user UI,
Storybook, or interactive demo surface inside the repo.

## Active quality stack

- ESLint checks source, tests, scripts, and config files for correctness.
- Prettier owns formatting and is kept separate from linting.
- Vitest covers unit, contract, integration, and packaging metadata behavior.
- A local documentation-contract validator keeps governed root docs in sync.
- Husky and lint-staged run fast pre-commit checks before commit.
- Commitlint enforces conventional commit messages.
- GitHub Actions runs `pnpm validate` in CI on Node.js 22 and 24, then reruns
  the release gate on the maintainer default from `.nvmrc`.

## Script contract

- `pnpm check:docs`: validate governed root docs and the local documentation contract.
- `pnpm format`: apply Prettier to tracked project files.
- `pnpm format:check`: verify formatting without changes.
- `pnpm lint`: run ESLint as a failing quality gate.
- `pnpm lint:fix`: apply safe ESLint fixes, then fail on remaining warnings.
- `pnpm typecheck`: type-check the library source.
- `pnpm test`: run the test suite once.
- `pnpm test:watch`: run Vitest in watch mode.
- `pnpm test:coverage`: run tests with coverage reporting.
- `pnpm check`: local quality gate for docs, formatting, linting, type-checking, and tests.
- `pnpm validate`: CI/release gate for docs, formatting, linting, coverage, and build output.
- `pnpm build`: type-check, bundle, and emit public declarations.

## Hook policy

- `pre-commit`: run `pnpm run check:docs`, then staged ESLint and Prettier via `lint-staged`.
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
