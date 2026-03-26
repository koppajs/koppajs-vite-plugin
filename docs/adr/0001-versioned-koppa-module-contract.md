# ADR 0001: Versioned Koppa Module Contract

- Status: Accepted
- Date: 2026-03-12

## Context

This package emits data that is consumed by the KoppaJS core runtime. The plugin
is useful only if the emitted object shape remains predictable across releases
and across different kinds of `.kpa` source input.

The repository already exposes a `KoppaModule` type and
`MODULE_CONTRACT_VERSION`, and tests validate that transform output matches this
shape.

## Decision

The plugin will continue to emit a versioned object literal with these fields:

- `contractVersion`
- `path`
- `template`
- `style`
- `script`
- `scriptMap`
- `deps`
- `structAttr`

Supporting decisions:

- All emitted string fields are serialized with `JSON.stringify`.
- `script` remains a wrapped string, not executable code exported directly by the
  plugin.
- Sourcemaps are exported separately as `scriptMap`; inline sourcemap comments
  are stripped from executable script content.
- Contract changes require test updates, spec updates, and a new ADR if the
  semantics change.

## Consequences

- KoppaJS core can validate or reason about plugin output with a stable contract.
- Public API and emitted field changes become explicit architectural events.
- The transform pipeline must preserve backward compatibility or version the
  contract intentionally.

## Alternatives considered

- Unversioned ad hoc object shape. Rejected because compatibility drift would be
  hard to detect.
- Emitting fully executable modules instead of a serialized contract. Rejected
  because the runtime expects data and handles dynamic execution itself.
- Keeping inline sourcemap comments in `script`. Rejected because dynamic code
  evaluation can break on embedded sourcemap directives.
