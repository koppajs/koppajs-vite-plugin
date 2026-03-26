# Roadmap

## Near term

- Replace exploratory edge-case tests with assertions against real
  `transformKpaToModule` behavior.
- Keep the new meta layer current as the plugin and contract evolve.
- Add explicit contributor-facing guidance whenever plugin options or public
  exports expand beyond the current surface.

## Mid term

- Add fixture-based integration tests that exercise Vite `resolveId`, `load`,
  and dev-server behavior with real `.kpa` files.
- Re-evaluate whether `src/index.ts` should shed more parsing or orchestration
  logic into dedicated modules as complexity grows.
- Introduce hosted CI workflows under `.github/workflows/` that enforce the
  quality gates described in [TESTING_STRATEGY.md](TESTING_STRATEGY.md).

## Ongoing

- Treat specs, ADRs, and architecture docs as part of the deliverable.
- Record major contract or workflow changes before they become tribal
  knowledge.
- Keep the package focused on build-time transformation and avoid accidental
  runtime creep.
