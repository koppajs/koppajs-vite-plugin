# Development Rules

## Scope

These rules govern source code, tests, documentation, and AI-assisted edits in
this repository.

## Repository structure rules

- `src/index.ts` is the orchestration layer for Vite hooks and the end-to-end
  transform pipeline.
- `src/transpileToJs.ts` and `src/transpileToCss.ts` own language-specific
  compilation details.
- `src/utils/` holds focused helpers with narrow responsibilities and explicit
  tests.
- `test/` holds behavior, contract, and regression tests.
- `docs/` holds the meta layer and architecture memory.
- `.ai/` may contain local diagnostic dumps, but it is not a source of truth and
  must not be treated as canonical documentation.

## Coding rules

- Keep transformations deterministic and side-effect light. Reading files and
  Vite resolver calls belong in the plugin wrapper, not in utility modules.
- Normalize paths before they leave the transform pipeline or enter emitted
  output.
- Serialize emitted string fields with `JSON.stringify`; do not hand-roll
  escaping for templates, CSS, or controller code.
- Use shared constants for emitted contract field semantics when possible. Do
  not duplicate `data-k-struct` or contract version strings across new modules
  without a reason.
- Add a dedicated helper module when logic develops its own invariants or needs
  standalone tests. Do not keep growing `src/index.ts` with unrelated leaf logic.
- Silent fallbacks are only allowed when the behavior is part of the product
  contract and is covered by tests.
- Prefer native TypeScript types and narrow structural guards over `any`.

## Naming and export rules

- `transpile*` names are reserved for source-to-source compilation helpers.
- `inject*` names are reserved for structural mutation helpers.
- Versioned public contract constants should use `MODULE_*` naming.
- Test files must end in `.test.ts`.
- Public exports require explicit documentation in `ARCHITECTURE.md` and tests
  that pin their behavior.

## Dependency rules

- Default stance: externalize dependencies in `vite.config.ts`.
- Adding a bundled dependency requires a written reason in the change and a
  review of `bundleAllowlist`.
- Utility modules under `src/utils/` should not depend on Vite or file-system
  APIs unless the boundary is explicitly redefined in architecture docs.
- New parser or compiler dependencies must justify why existing `typescript`,
  `sass`, `postcss`, `autoprefixer`, and `acorn` primitives are insufficient.

## Forbidden patterns

- Silent public API changes.
- Inline `sourceMappingURL` or `sourceURL` comments inside emitted `script`
  strings.
- Platform-specific path output.
- New generated fields in the emitted contract without contract review, tests,
  and documentation.
- Placeholder tests that assert only that local constants are defined when the
  change affects actual behavior.

## Documentation and decision rules

- Public behavior change: update a spec in `docs/specs/`.
- Architectural decision: add an ADR in `docs/adr/`.
- New contributor workflow or tool: update `CONTRIBUTING.md`.
- New or changed test expectations: update `TESTING_STRATEGY.md`.
- When documents conflict, follow [DECISION_HIERARCHY.md](DECISION_HIERARCHY.md).

## Style rules

- Follow the configured toolchain: strict TypeScript, Prettier formatting,
  ESLint, and commitlint.
- Prefer small functions, explicit names, and comments only where the code would
  otherwise hide an important invariant.

## Documentation Contract Rules

- `README.md`, `CHANGELOG.md`, `CODE_OF_CONDUCT.md`, and `CONTRIBUTING.md` are governed by [docs/specs/repository-documentation-contract.md](./docs/specs/repository-documentation-contract.md).
- If one of those files changes shape, update the spec and `scripts/check-doc-contract.mjs` in the same change.
- Keep official KoppaJS branding, logo usage, and closing governance sections consistent across the governed root documents.
