# ADR 0002: Meta Layer as a Living System

- Status: Accepted
- Date: 2026-03-12

## Context

The repository had source code, tests, and a README, but it lacked a structured
place to store architecture memory, decision history, testing philosophy, and
AI-assisted development rules. That makes the project vulnerable to undocumented
contract drift and inconsistent contributor behavior.

## Decision

The repository will maintain a first-class meta layer composed of:

- root governance documents
- ADRs in `docs/adr/`
- specs in `docs/specs/`
- architecture details in `docs/architecture/`
- quality guidance in `docs/quality/`
- AI execution guidance in `.github/instructions/`

Every architectural, contractual, workflow, or testing change must update the
relevant meta-layer documents in the same change.

## Consequences

- Design intent becomes reviewable instead of remaining tribal knowledge.
- AI and human contributors get the same decision framework.
- Documentation work becomes part of the definition of done for architectural
  changes.

## Alternatives considered

- Keeping all governance in `README.md`. Rejected because user-facing docs are
  not a durable place for architectural policy.
- Relying on code and tests alone. Rejected because intent, tradeoffs, and
  decision history remain implicit.
