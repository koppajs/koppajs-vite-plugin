<a id="readme-top"></a>

<div align="center">
  <img src="https://public-assets-1b57ca06-687a-4142-a525-0635f7649a5c.s3.eu-central-1.amazonaws.com/koppajs/koppajs-logo-text-900x226.png" width="500" alt="KoppaJS Logo">
</div>

<br>

<div align="center">
  <a href="https://www.npmjs.com/package/@koppajs/koppajs-vite-plugin"><img src="https://img.shields.io/npm/v/@koppajs/koppajs-vite-plugin?style=flat-square" alt="npm version"></a>
  <a href="https://github.com/koppajs/koppajs-vite-plugin/actions"><img src="https://img.shields.io/github/actions/workflow/status/koppajs/koppajs-vite-plugin/ci.yml?branch=main&style=flat-square" alt="CI Status"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue?style=flat-square" alt="License"></a>
</div>

<br>

<div align="center">
  <h1 align="center">@koppajs/koppajs-vite-plugin</h1>
  <h3 align="center">Official Vite plugin for KoppaJS Single File Components</h3>
  <p align="center">
    <i>The intentional bridge between Vite and the .kpa format: explicit, minimal, and predictable.</i>
  </p>
</div>

<br>

<div align="center">
  <p align="center">
    <a href="https://github.com/koppajs/koppajs-documentation">Documentation</a>
    &middot;
    <a href="https://github.com/koppajs/create-koppajs">create-koppajs</a>
    &middot;
    <a href="https://github.com/koppajs/koppajs-core">KoppaJS Core</a>
    &middot;
    <a href="https://github.com/koppajs/koppajs-router">Router</a>
    &middot;
    <a href="https://github.com/koppajs/koppajs-vite-plugin/issues">Issues</a>
  </p>
</div>

<br>

<details>
<summary>Table of Contents</summary>
  <ol>
    <li><a href="#what-is-this-plugin">What is this plugin?</a></li>
    <li><a href="#features">Features</a></li>
    <li><a href="#installation">Installation</a></li>
    <li><a href="#requirements">Requirements</a></li>
    <li><a href="#usage-behavior">Usage & Behavior</a></li>
    <li><a href="#how-it-works">How it works</a></li>
    <li><a href="#debugging-sourcemaps-dynamic-code">Debugging & Sourcemaps (Dynamic Code)</a></li>
    <li><a href="#plugin---core-contract">Plugin -> Core Contract</a></li>
    <li><a href="#architecture-governance">Architecture & Governance</a></li>
    <li><a href="#community-contribution">Community & Contribution</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

---

## What is this plugin?

`@koppajs/koppajs-vite-plugin` is the official build-time integration between
Vite and KoppaJS Single File Components.

Its responsibility is deliberately narrow:

- parse `.kpa` files
- extract template, style, and script blocks
- normalize and compile those blocks into deterministic ES modules
- emit the contract consumed by `@koppajs/koppajs-core`

It is a transformation layer, not a runtime extension.

---

## Features

- native `.kpa` file support
- TypeScript inside component scripts
- SCSS and SASS compilation
- explicit template, style, and script extraction
- zero runtime behavior
- fast HMR through Vite’s native mechanisms
- ESM-first package output with CJS compatibility
- minimal footprint and surface area

---

## Installation

```bash
pnpm add @koppajs/koppajs-core
pnpm add -D @koppajs/koppajs-vite-plugin vite typescript
```

```bash
npm install @koppajs/koppajs-core
npm install -D @koppajs/koppajs-vite-plugin vite typescript
```

Add the plugin to `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import koppajsVitePlugin from '@koppajs/koppajs-vite-plugin'

export default defineConfig({
  plugins: [koppajsVitePlugin()],
})
```

No additional configuration is required for basic usage.

For most users, the fastest way to start from a working KoppaJS + Vite setup is
still the official scaffolder:

```bash
pnpm create koppajs my-app
```

---

## Requirements

For package consumers:

- Vite `^7.0.0`
- TypeScript `>=5.5 <6`
- `@koppajs/koppajs-core` in the consuming project

For local repository work:

- Node.js >= 20
- pnpm >= 10.24.0

---

## Usage & Behavior

Once configured:

- `.kpa` files are resolved by Vite like any other module
- transformations occur during both development and production builds
- Hot Module Replacement works through Vite’s normal module graph
- output modules remain statically analyzable and deterministic

The plugin performs no runtime work and injects no global state.
All behavior stays inside the build pipeline.

---

## How it works

Each `.kpa` file is transformed into a plain JavaScript module.

This is a simplified view of the generated output:

```ts
export default {
  template: '<escaped-template>',
  style: '<compiled-css>',
  script: '(()=>{ /* controller */ })()',
}
```

Supported transformations include:

- TypeScript to JavaScript
- SCSS and SASS to CSS
- composition-style controllers
- legacy `return {}` controllers

The output format stays intentionally explicit so the KoppaJS core can remain
small and predictable.

---

## Debugging & Sourcemaps (Dynamic Code)

KoppaJS component scripts are executed dynamically at runtime by the core.
Because of that, inline `//# sourceMappingURL` comments must not be embedded
directly into executable script strings.

### How sourcemaps are handled

- `sourceMappingURL` and `sourceURL` comments are stripped during transformation
- sourcemaps are preserved as structured data and exposed as `scriptMap`
- the core runtime is responsible for reattaching sourcemaps when needed

If the runtime does not explicitly reattach sourcemaps, component scripts still
execute correctly, but browser DevTools will not show the original source
mapping.

---

## Plugin -> Core Contract

This plugin emits `ComponentSource` objects with the following structure:

```ts
interface ComponentSource {
  contractVersion: number
  path: string
  template: string
  style: string
  script: string
  scriptMap: object | null
  deps: Record<string, () => Promise<unknown>>
  structAttr: string
}
```

Guarantees:

- all string fields are JSON-serialized
- emitted modules include `contractVersion` and normalized `path` metadata
- TypeScript blocks are transpiled before emission
- style blocks are compiled to plain CSS
- templates include structural identity attributes for reconciliation

For deeper semantics, use the package docs:

- [docs/specs/kpa-module-transformation.md](./docs/specs/kpa-module-transformation.md)

---

## Architecture & Governance

Project intent, contributor rules, and documentation contracts live in the local repo meta layer:

- [AI_CONSTITUTION.md](./AI_CONSTITUTION.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DECISION_HIERARCHY.md](./DECISION_HIERARCHY.md)
- [DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md)
- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md)
- [ROADMAP.md](./ROADMAP.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- [docs/specs/README.md](./docs/specs/README.md)
- [docs/specs/repository-documentation-contract.md](./docs/specs/repository-documentation-contract.md)
- [docs/meta/README.md](./docs/meta/README.md)

The file-shape contract for `README.md`, `CHANGELOG.md`, `CODE_OF_CONDUCT.md`, and `CONTRIBUTING.md` is defined in [docs/specs/repository-documentation-contract.md](./docs/specs/repository-documentation-contract.md).

Run the local document guard before committing:

```bash
pnpm run check:docs
```

---

## Community & Contribution

Issues and pull requests are welcome:

https://github.com/koppajs/koppajs-vite-plugin/issues

Contributor workflow details live in [CONTRIBUTING.md](./CONTRIBUTING.md).

Community expectations live in [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

---

## License

Apache License 2.0 — © 2026 KoppaJS, Bastian Bensch
