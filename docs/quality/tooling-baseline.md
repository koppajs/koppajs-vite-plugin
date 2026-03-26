# Tooling Baseline

## Repository type

This repository is a TypeScript Vite plugin library. It has no end-user UI,
Storybook, or interactive demo surface inside the repo.

## Active quality stack

- ESLint checks source, tests, scripts, and config files for correctness.
- Prettier owns formatting and is kept separate from linting.
- Vitest covers unit, contract, integration, and packaging metadata behavior.
- Husky and lint-staged run fast staged-file checks before commit.
- Commitlint enforces conventional commit messages.
- GitHub Actions runs the repository validation and release gates.

## Script contract

- `pnpm format`: apply Prettier to tracked project files.
- `pnpm format:check`: verify formatting without changes.
- `pnpm lint`: run ESLint as a failing quality gate.
- `pnpm lint:fix`: apply safe ESLint fixes, then fail on remaining warnings.
- `pnpm typecheck`: type-check the library source.
- `pnpm test`: run the test suite once.
- `pnpm test:watch`: run Vitest in watch mode.
- `pnpm test:coverage`: run tests with coverage reporting.
- `pnpm check`: local quality gate for formatting, linting, type-checking, and tests.
- `pnpm validate`: CI/release gate for formatting, linting, coverage, and build output.
- `pnpm build`: type-check, bundle, and emit public declarations.

## Hook policy

- `pre-commit`: run staged ESLint and Prettier only. Keep it fast.
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
