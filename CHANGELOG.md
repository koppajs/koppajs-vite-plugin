# Change Log

All notable changes to **@koppajs/koppajs-vite-plugin** are documented in this file.

This project uses a **manual, tag-driven release process**.
Only tagged versions represent official releases.

This changelog documents **intentional milestones and guarantees**,
not every internal refactor.

---

## [Unreleased]

This section is intentionally empty.

Changes will only appear here when they:

- are user-visible,
- change transformation semantics,
- or affect documented guarantees.

---

## [1.0.2] — Documentation Contract and Release Workflow Refresh

**2026-03-27**

Patch release to formalize the governed repository-document contract, wire it
into local quality gates, and refresh hosted release automation. No intentional
public API or emitted-module contract changes.

### Added

- Added a dedicated repository-documentation contract spec and local
  `check:docs` validator

### Changed

- Wired documentation-contract validation into `check`, `validate`, and the
  local `pre-commit` hook
- Refined README, CONTRIBUTING, and spec guidance around governed root-document
  structure and contributor expectations
- Updated GitHub Actions runtime steps and made GitHub Release creation
  idempotent in the release workflow

---

## [1.0.1] — Module Contract Hardening

**2026-03-26**

Patch release to harden the emitted module contract, align package metadata,
and refresh repository quality workflow. No intentional breaking API changes.

### Added

- Added explicit emitted-module `contractVersion` and normalized `path`
  metadata
- Added repository meta-layer documents and stronger package-contract coverage

### Changed

- Hardened `validateKoppaModule(...)` and dependency import-code generation
- Aligned package entrypoint metadata and package-validation expectations
- Simplified lint, format, test, and CI workflow scripts around the current
  baseline
- Updated README ecosystem links to point at the released starter/tooling
  surface

---

## [1.0.0] — Baseline Plugin Release

**2026-03-01**

This release establishes the **stable baseline** of the `koppajs-vite-plugin`.

From this version onward, the public API, transformation contract,
and build behavior are considered **intentionally defined and frozen**
unless a clear reason for change exists.

---

### Purpose

- Build-time transformation only
- No runtime behavior
- No framework-side effects
- No hidden coupling to KoppaJS core internals

---

### Public API

- Stable exports:
  - default export: `koppajsVitePlugin`
  - named export: `transformKpaToModule`
- Minimal, explicit API surface
- No hidden or implicit exports

---

### Transformation Behavior

- Deterministic transformation of `.kpa` files into ES modules
- Explicit, versioned module output contract
- Stable handling of:
  - template extraction
  - style compilation
  - script transpilation
  - dependency resolution
- No environment-dependent branching

---

### Tooling & Quality

- Comprehensive test suite for transformation logic
- CI workflow enforcing:
  - type checking
  - linting
  - formatting checks
  - test execution
  - build integrity
- Tag-driven release workflow prepared for npm publication
- Deterministic project analysis and snapshot tooling
  (internal, non-runtime)

---

### Guarantees

Starting with `0.1.0`, the following guarantees apply:

- **Minimal public API**
- **No runtime side effects**
- **Deterministic transformation**
- **CI as gatekeeper**
- **Stability over feature velocity**

---

### Non-Goals

- No runtime execution
- No dev-server magic beyond file transformation
- No auto-registration or injection
- No opinionated project structure enforcement
- No implicit coupling to future KoppaJS features

---

## Versioning Policy

- Semantic Versioning (SemVer) is followed pragmatically
- **Breaking changes** include:
  - public API changes
  - transformation semantic changes
- Internal refactors without observable behavior change
  do **not** require a major version bump

---

_This changelog documents intent.  
If something is not written here, it is not guaranteed._
