<a id="readme-top"></a>

<div align="center">
	<img src="https://public-assets-1b57ca06-687a-4142-a525-0635f7649a5c.s3.eu-central-1.amazonaws.com/koppajs/koppajs-logo-text-900x226.png" width="500" alt="KoppaJS Logo">
</div>

<br>

<div align="center">
	<a href="https://www.npmjs.com/package/@koppajs/koppajs-vite-plugin"><img src="https://img.shields.io/npm/v/@koppajs/koppajs-vite-plugin?style=flat-square" alt="npm version"></a>
	<a href="https://github.com/koppajs/koppajs-vite-plugin/actions"><img src="https://img.shields.io/github/actions/workflow/status/koppajs/koppajs-vite-plugin/ci.yml?branch=main&style=flat-square" alt="CI Status"></a>
	<a href="./LICENSE"><img src="https://img.shields.io/github/license/koppajs/koppajs-vite-plugin?style=flat-square" alt="License"></a>
</div>

<br>

<div align="center">
	<h1 align="center">@koppajs/koppajs-vite-plugin</h1>
	<h3 align="center">Official Vite plugin for KoppaJS Single File Components</h3>
	<p align="center">
		<i>The intentional bridge between Vite and the .kpa format — explicit, minimal, predictable.</i>
	</p>
</div>

<br>

<div align="center">
	<p align="center">
		<a href="https://github.com/koppajs/koppajs-documentation">Documentation</a>
		&middot;
		<a href="https://github.com/koppajs/koppajs-core">KoppaJS Core</a>
		&middot;
		<a href="https://github.com/koppajs/koppajs-example">Example Project</a>
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
		<li><a href="#usage--behavior">Usage & Behavior</a></li>
		<li><a href="#how-it-works">How it works</a></li>
		<li><a href="#debugging--sourcemaps-dynamic-code">Debugging & Sourcemaps (Dynamic Code)</a></li>
		<li><a href="#community--contribution">Community & Contribution</a></li>
		<li><a href="#license">License</a></li>
	</ol>
	<br>
</details>

## What is this plugin?

This is the **official Vite integration for KoppaJS**.

Its responsibility is deliberately narrow:
to transform `.kpa` Single File Components into **standard ES modules**
that can participate in Vite’s normal module graph — nothing more, nothing less.

Vite is fast. KoppaJS is minimal.  
This plugin connects the two **without hidden behavior, runtime magic, or implicit coupling**.

Specifically, it:

- parses `.kpa` files,
- extracts template, style, and script blocks,
- compiles and normalizes their contents,
- and emits deterministic ES module output understood by the KoppaJS core.

It is a **build-time transformation layer**, not a framework extension.

## Features

- **Native `.kpa` file support**
- **TypeScript inside component scripts**
- **SCSS / SASS compilation**
- **Explicit template, style, and script extraction**
- **Zero runtime behavior**
- **Fast HMR through Vite’s native mechanisms**
- **Pure ESM output**
- **Minimal footprint and surface area**

## Installation

```bash
pnpm add @koppajs/koppajs-core @koppajs/koppajs-vite-plugin -D
```

Add the plugin to your `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import koppajsVitePlugin from '@koppajs/koppajs-vite-plugin'

export default defineConfig({
  plugins: [koppajsVitePlugin()],
})
```

No additional configuration is required for basic usage.

## Usage & Behavior

Once configured:

- `.kpa` files are resolved by Vite like any other module
- transformations occur during dev and build
- Hot Module Replacement works without custom handling
- output modules are statically analyzable and deterministic

The plugin performs **no runtime work** and injects **no global state**.
All behavior is confined to Vite’s build pipeline.

## How it works

Each `.kpa` file is transformed into a plain ES module.

The following example shows a **simplified representation** of the generated output,
focusing on the core transformation result.
The complete and binding runtime contract consumed by the KoppaJS core
is defined in the **Plugin → Core Contract** section below.

```ts
export default {
  path: '.../component.kpa',
  template: '<escaped-template>',
  style: '<compiled-css>',
  script: '(()=>{ /* controller */ })()',
}
```

Supported transformations include:

- TypeScript → JavaScript
- SCSS / SASS → CSS
- composition-style controllers
- legacy `return {}` controllers

The output format is intentionally explicit to allow the KoppaJS core
to remain small, predictable, and framework-agnostic.

## Debugging & Sourcemaps (Dynamic Code)

KoppaJS component scripts are executed **dynamically at runtime** by the core.
Because of this, inline `//# sourceMappingURL` comments **must not be embedded**
directly into executable script strings.

### How sourcemaps are handled

- All `sourceMappingURL` and `sourceURL` comments are stripped during transformation
- Sourcemaps are preserved as structured data and exposed as `scriptMap`
- The KoppaJS core is responsible for attaching sourcemaps at runtime
  (for example via `Blob` or `data:` URLs)

> ⚠️ If the runtime does not explicitly reattach sourcemaps,
> component scripts will execute correctly,
> but browser DevTools will not display original source mappings.

This behavior is intentional and prevents syntax errors in dynamically evaluated code.

## Plugin → Core Contract

This plugin produces `ComponentSource` objects with the following structure:

```ts
interface ComponentSource {
  contractVersion: string
  path: string
  template: string
  style: string
  script: string
  scriptMap: object | null
  deps: Record<string, () => Promise<unknown>>
  structAttr: string
}
```

**Guarantees:**

- All string fields are JSON-serialized
- TypeScript blocks are transpiled before emission
- Style blocks are compiled to plain CSS
- Templates include structural identity attributes for reconciliation
- Script functions always return valid controller objects

For detailed integration semantics, see the
[Integration Contracts Documentation](https://github.com/koppajs/koppajs-example/blob/main/INTEGRATION_CONTRACTS.md).

## Community & Contribution

Issues and pull requests are welcome:

https://github.com/koppajs/koppajs-vite-plugin/issues

Please keep contributions focused on:
- correctness,
- determinism,
- and maintaining a minimal public surface.

## License

Apache License 2.0 — © 2025 KoppaJS, Bastian Bensch
