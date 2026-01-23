# Changelog

All notable changes to **koppajs-vite-plugin** are documented in this file.

This project follows a **deliberately minimal and stability-first approach**.
The changelog is not a commit log — it records **intentional milestones**,
not every internal refactor.

---

## [Unreleased]

This section is intentionally empty.

Changes will only be added here when they are:
- user-visible,
- semantically meaningful,
- or affect guarantees documented below.

---

## [0.1.0] — Baseline Release

This release establishes the **stable baseline** of the `koppajs-vite-plugin`.

It marks the point where the public API, build behavior, and development
workflows are considered **intentionally defined and frozen** unless a
clear reason for change exists.

### Added

- Stable Vite plugin export:
  - default export: `koppajsVitePlugin`
  - named export: `transformKpaToModule`
- Deterministic transformation of `.kpa` files into ES modules
- Explicit module contract for transformed output
- Test suite covering core transformation logic
- CI workflow validating:
  - linting
  - type checking
  - test execution
  - build integrity
- Release workflow prepared for automated publishing
- Deterministic AI dump & snapshot tooling for project introspection
  (internal, non-runtime)

### Guarantees

The following guarantees are established starting with `0.1.0`:

- **Minimal public API**
  - No hidden exports
  - No implicit side effects
- **No framework lock-in**
  - The plugin performs transformation only
  - No runtime dependencies on KoppaJS itself
- **Deterministic behavior**
  - Same input yields the same output
  - No environment-dependent branching in transformation logic
- **CI as gatekeeper**
  - All changes must pass tests and type checks
- **Stability over feature velocity**
  - Breaking changes require a clear, explicit justification

### Non-Goals

The following are explicitly *not* goals of this plugin:

- No runtime behavior
- No dev-server magic beyond file transformation
- No auto-registration, injection, or side effects
- No opinionated project structure enforcement
- No implicit coupling to future KoppaJS features

### Internal

- Project structure cleaned and aligned to minimal responsibility
- Import graph verified to be cycle-free
- Lint and technical debt reduced to a known, minimal set
- Secrets scanning integrated into CI
- Snapshot-based analysis tooling used for validation and auditing

---

## Versioning Policy

- Semantic Versioning (SemVer) is followed pragmatically
- **Breaking changes**:
  - changes to the public API
  - or changes that alter transformation semantics
- Internal refactors without observable behavior change do **not**
  require a major version bump

---

_This changelog documents intent.  
If something is not written here, it is not guaranteed._
