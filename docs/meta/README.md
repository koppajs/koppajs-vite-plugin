# Meta Layer

This directory index explains where project intent lives and when it must be
updated.

## Canonical documents

- Root governance: `AI_CONSTITUTION.md`, `ARCHITECTURE.md`,
  `DEVELOPMENT_RULES.md`, `TESTING_STRATEGY.md`, `DECISION_HIERARCHY.md`,
  `CONTRIBUTING.md`, `RELEASE.md`, `ROADMAP.md`
- Decision records: `docs/adr/`
- Detailed architecture boundaries: `docs/architecture/` and
  `docs/architecture/README.md`
- Specifications: `docs/specs/`
- Quality process: `docs/quality/` and `docs/quality/README.md`
- Tooling baseline: `docs/quality/tooling-baseline.md`
- AI execution guidance: `.github/instructions/`

## Update matrix

| Change type                                             | Required meta-layer updates                                                               |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Public behavior or emitted contract change              | Update a spec, update tests, and add an ADR if semantics changed                          |
| New subsystem or major module boundary                  | Update `ARCHITECTURE.md` and `docs/architecture/`                                         |
| New coding convention or dependency rule                | Update `DEVELOPMENT_RULES.md`                                                             |
| New quality gate, script contract, or tooling decision  | Update `TESTING_STRATEGY.md` and `docs/quality/`                                          |
| New package rule, release workflow, or publish contract | Update `RELEASE.md`, `.github/workflows/README.md`, and the affected quality or root docs |
| New contributor or AI workflow                          | Update `CONTRIBUTING.md`, `AI_CONSTITUTION.md`, or `.github/instructions/`                |

## Maintenance rule

If a change would surprise a future maintainer who read only the existing meta
layer, the meta layer is incomplete and must be updated in the same change.
