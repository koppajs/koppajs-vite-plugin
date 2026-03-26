# Workflow Expectations

This repository defines hosted GitHub Actions workflows for CI and releases.
They should enforce the same quality gates described in
`TESTING_STRATEGY.md` and `docs/quality/tooling-baseline.md`.

## Current baseline jobs

- CI runs on pull requests to `develop` and `main`, and on pushes to `main`
- CI validates the repo with `pnpm validate`
- release tags rerun `pnpm validate`, verify the tag version, then publish

## Governance rule

If hosted workflow behavior changes, update:

- `TESTING_STRATEGY.md`
- `docs/quality/tooling-baseline.md`
- `CONTRIBUTING.md`
- `ROADMAP.md`
