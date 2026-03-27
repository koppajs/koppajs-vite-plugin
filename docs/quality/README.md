# Quality Guide

This directory captures the repository's practical quality gates and the tool
choices that support them.

## Documents In This Area

- [tooling-baseline.md](./tooling-baseline.md): active quality stack, CI
  baseline, and deliberate exclusions
- [definition-of-done.md](./definition-of-done.md): expectations for when a
  change is complete

## Verification Matrix

- Documentation contract:
  `pnpm run check:docs`
- Formatting:
  `pnpm run format:check`
- Static analysis:
  `pnpm run lint`
- Type safety:
  `pnpm run typecheck`
- Vitest coverage gate:
  `pnpm run test:ci`
- Publishable build output:
  `pnpm run build`
- Main local gate:
  `pnpm run check`
- Full repository validation:
  `pnpm run validate`
- Hosted CI mirror:
  `.github/workflows/ci.yml` runs `pnpm run validate` on Node.js 22 and 24
- Hosted release mirror:
  `.github/workflows/release.yml` reruns `pnpm run validate` on the maintainer
  default from `.nvmrc`, verifies the tag version, then publishes to npm

## Tooling Priorities

- keep the emitted module contract deterministic and reviewable
- keep contributor gates local-first and easy to reproduce
- keep package metadata, built artifacts, and release automation aligned
- keep documentation updates coupled to workflow or contract changes

## Maintenance Rule

Update this directory whenever quality gates, CI expectations, release
validation, or tooling choices change.
