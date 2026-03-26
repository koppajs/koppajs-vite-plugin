# Decision Hierarchy

When repository documents conflict, use this order of precedence.

1. Accepted feature or behavior specs in `docs/specs/`
2. Accepted ADRs in `docs/adr/`
3. [ARCHITECTURE.md](ARCHITECTURE.md) and `docs/architecture/`
4. [TESTING_STRATEGY.md](TESTING_STRATEGY.md) for verification obligations
5. [DEVELOPMENT_RULES.md](DEVELOPMENT_RULES.md)
6. [AI_CONSTITUTION.md](AI_CONSTITUTION.md) and `.github/instructions/`
7. [CONTRIBUTING.md](CONTRIBUTING.md) and `docs/quality/`
8. [README.md](README.md), [CHANGELOG.md](CHANGELOG.md), and inline examples

## How to apply the hierarchy

- Higher-ranked documents define intent.
- Lower-ranked documents may explain or exemplify intent, but they may not
  silently override it.
- If code behavior conflicts with a higher-ranked document, treat it as drift or
  a bug until the higher-ranked document is explicitly updated.
- If two documents at the same level conflict, update both in one change and add
  an ADR if the disagreement reflects a real design decision.

## Special rule for public contracts

The emitted `KoppaModule` contract and anything exported from `src/index.ts`
must never be changed based only on examples or local convenience. Contract
changes require a spec review, test updates, and usually an ADR.
