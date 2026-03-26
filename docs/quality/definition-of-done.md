# Definition Of Done

A change is done only when all applicable items below are satisfied.

## Code and tests

- `pnpm check` passes.
- Behavior changes are covered by tests.
- Contract-sensitive changes update contract tests.
- Build or packaging changes are validated with `pnpm validate`.
- Failure-path behavior is tested when fallback behavior is part of the contract.

## Documentation

- Architecture docs reflect the current module boundaries.
- Specs reflect the intended public behavior.
- Development rules and testing strategy match the change.
- README examples are updated if user-facing behavior changed.

## Decisions and governance

- An ADR is added for major architectural or policy changes.
- `DECISION_HIERARCHY.md` is still correct after the change.
- AI workflow guidance is updated if the collaboration process changed.

## Release readiness

- Public exports from `src/index.ts` are intentional and documented.
- `MODULE_CONTRACT_VERSION` and `validateKoppaModule` still reflect reality.
- `package.json` entry fields still match the generated build filenames.
- New dependencies or bundling policy changes are justified in code review.
