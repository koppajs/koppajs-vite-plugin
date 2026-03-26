# AI Constitution

## Purpose

This repository ships a build-time Vite plugin that turns `.kpa` files into a
versioned module contract for the KoppaJS core runtime. The meta layer exists to
protect that contract, document the system, and keep humans and AI working from
the same rules.

## Non-negotiable principles

1. Contract stability beats convenience. Any change to the emitted module shape,
   exported API, or dependency resolution semantics must be treated as an
   architectural change.
2. Deterministic output is a feature. Generated paths, struct identifiers,
   serialized strings, and dependency maps must be reproducible from the same
   inputs.
3. Build-time work stays build-time. This package transforms source files; it
   must not grow hidden runtime behavior.
4. Graceful fallback is intentional, not accidental. When invalid input falls
   back to a minimal controller, that behavior must be documented and tested.
5. Existing patterns win by default. Prefer extending the current parse ->
   transform -> serialize pipeline over introducing alternate pipelines.
6. Documentation is part of the change. Code, tests, specs, ADRs, and governance
   documents must evolve together.

## Collaboration rules for humans and AI

- Read [DECISION_HIERARCHY.md](DECISION_HIERARCHY.md),
  [ARCHITECTURE.md](ARCHITECTURE.md), and the relevant spec before making
  non-trivial changes.
- Follow this order whenever possible: spec or ADR review -> tests ->
  implementation -> documentation updates.
- Never silently change the public API exported from `src/index.ts`, the
  `KoppaModule` contract, or the meaning of emitted fields.
- Prefer the existing helper modules under `src/` and `src/utils/` over adding
  ad hoc logic to the plugin wrapper.
- When uncertainty remains, record the assumption in the change or create an ADR
  instead of encoding a guess into the codebase.
- Update README examples and contributor guidance when user-visible behavior
  changes.

## Required meta-layer maintenance

Update the meta layer whenever any of the following happens:

- New subsystem or major module boundary: update
  [ARCHITECTURE.md](ARCHITECTURE.md) and
  [docs/architecture/module-boundaries.md](docs/architecture/module-boundaries.md).
- New coding pattern, dependency rule, or folder responsibility: update
  [DEVELOPMENT_RULES.md](DEVELOPMENT_RULES.md).
- New verification rule or test level: update
  [TESTING_STRATEGY.md](TESTING_STRATEGY.md) and, if needed,
  [docs/quality/definition-of-done.md](docs/quality/definition-of-done.md).
- New public behavior or changed feature semantics: add or update a spec under
  `docs/specs/`.
- Major design or policy decision: add an ADR under `docs/adr/`.
- New AI workflow expectation: update this file and
  `.github/instructions/ai-collaboration.md`.

## Review standard

A change is incomplete if it updates code without updating the governing
documents that explain the change.
