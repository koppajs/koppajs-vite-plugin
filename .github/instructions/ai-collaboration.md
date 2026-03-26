# AI Collaboration Instructions

## Read before editing

For any non-trivial change, read:

1. `DECISION_HIERARCHY.md`
2. `ARCHITECTURE.md`
3. The relevant spec in `docs/specs/`
4. `DEVELOPMENT_RULES.md`
5. `TESTING_STRATEGY.md`

## Working rules

- Prefer spec -> tests -> implementation -> docs.
- Do not silently change public exports, the emitted `KoppaModule` contract, or
  dependency resolution semantics.
- Prefer existing helpers and patterns over introducing parallel abstractions.
- Update the meta layer when architecture, workflow, tests, or public behavior
  changes.
- Add an ADR for major design or policy decisions.
- If intent is unclear, surface the ambiguity rather than encoding a guess.
