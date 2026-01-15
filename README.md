<a id="readme-top"></a>

<div align="center">
	<img src="https://public-assets-1b57ca06-687a-4142-a525-0635f7649a5c.s3.eu-central-1.amazonaws.com/koppajs/koppajs-logo-text-900x226.png" width="500" alt="KoppaJS Logo">
</div>

<br>

<div align="center">
	<a href="https://www.npmjs.com/package/@koppajs/plugin-vite"><img src="https://img.shields.io/npm/v/@koppajs/plugin-vite?style=flat-square" alt="npm version"></a>
	<a href="https://github.com/koppajs/koppajs-vite-plugin/actions"><img src="https://img.shields.io/github/actions/workflow/status/koppajs/koppajs-vite-plugin/ci.yml?branch=main&style=flat-square" alt="CI Status"></a>
	<a href="./LICENSE"><img src="https://img.shields.io/github/license/koppajs/koppajs-vite-plugin?style=flat-square" alt="License"></a>
</div>

<br>

<div align="center">
	<h1 align="center">@koppajs/koppajs-vite-plugin</h1>
	<h3 align="center">Official Vite plugin for KoppaJS Single File Components</h3>
	<p align="center">
		<i>The missing bridge between Vite and the .kpa format — fast, clean, seamless.</i>
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

The official Vite integration for **KoppaJS**, designed to bring `.kpa` Single File Components to life.

Vite is fast. KoppaJS is minimal.
This plugin makes them work together — **without magic, without overhead, without surprises**.

It handles:

- Parsing `.kpa` files
- Extracting template, style, and script blocks
- Transforming them into ES modules
- Compiling TypeScript inside `.kpa` blocks
- Injecting them as fully ready KoppaJS component definitions

It is the glue that makes the KoppaJS development workflow seamless.

## Features

- **Native `.kpa` support**
- **TypeScript inside `.kpa`**
- **SCSS/SASS support**
- **Template + Style + Script extraction**
- **Zero-runtime magic**
- **Fast HMR**
- **Fully ESM-based**
- **Tiny footprint**

## Installation

```bash
pnpm add @koppajs/koppajs-core @koppajs/plugin-vite -D
```

No explicit configuration is required beyond having the plugin installed.
The KoppaJS Vite plugin is automatically detected and activated as part of the KoppaJS toolchain.

## Usage & Behavior

This plugin does **not** introduce a new runtime API and does **not** need to be
manually invoked in application code.

Once installed:

- Vite automatically recognizes `.kpa` files
- `.kpa` files participate in the normal Vite module graph
- Hot Module Replacement works out of the box
- Components are transformed transparently during build and dev

There is no explicit “usage” step.
The plugin operates purely as a **build-time transformation layer**.

## How it works

The plugin transforms `.kpa` files into standard ES modules:

```ts
export default {
  path: '.../component.kpa',
  template: '<escaped-template>',
  style: '<compiled-css>',
  script: '(()=>{ /* controller */ })()',
}
```

Supported transformations:

- TS → JS
- SCSS / SASS → CSS
- Composition-style controllers
- Legacy `return {}` controllers

## Debugging & Sourcemaps (Dynamic Code)

KoppaJS component scripts are executed **dynamically at runtime** by the core.
Because of this, inline `//# sourceMappingURL` comments **must not** be part of the
executable script code — they can break evaluation when scripts are wrapped or minified.

### How sourcemaps are handled

- The Vite plugin strips all `sourceMappingURL` and `sourceURL` comments
  from generated component scripts.
- Sourcemaps are preserved **as data** and exported separately as `scriptMap`
  on the component definition.
- The KoppaJS core runtime is responsible for re-attaching sourcemaps when executing
  dynamic code (for example via `Blob` or `data:` URLs).

> ⚠️ If the core does not explicitly attach the sourcemap at runtime,
> dynamic component scripts will execute correctly,
> but browser DevTools will not show original source mappings.

This behavior is intentional and prevents syntax errors caused by inline sourcemap
comments in dynamically evaluated code.

## Community & Contribution

Issues and PRs welcome:
https://github.com/koppajs/koppajs-vite-plugin/issues

## License

Apache License 2.0 — © 2025 KoppaJS, Bastian Bensch
