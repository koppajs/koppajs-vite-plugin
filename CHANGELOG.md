# Change Log

All notable changes to **koppajs-vite-plugin** are documented in this file.

This project follows a **deliberately minimal, stability-first approach**.
The changelog records **intentional milestones and guarantees**,
not internal refactors.

---

## [Unreleased]

This section is intentionally empty.

Changes will only appear here when they:

- are user-visible,
- change transformation semantics,
- or affect documented guarantees.

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
