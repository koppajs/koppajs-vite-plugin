# Architecture Decision Records

ADRs capture durable design decisions that shape this repository.

## When to write an ADR

Write an ADR when a change affects:

- the emitted `KoppaModule` contract
- public exports from `src/index.ts`
- the build or packaging boundary
- how `.kpa` files are parsed or transformed
- the governance model itself

## Format

Each ADR must contain these sections:

1. Context
2. Decision
3. Consequences
4. Alternatives considered

## Naming

- Use zero-padded numbers: `0001-...`, `0002-...`
- Keep titles short and concrete
- Do not rewrite history; add a new ADR when direction changes

## Current ADRs

- `0001-versioned-koppa-module-contract.md`
- `0002-meta-layer-as-a-living-system.md`
