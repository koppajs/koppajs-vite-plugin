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
	<h1 align="center">@koppajs/plugin-vite</h1>
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
		<li><a href="#usage">Usage</a></li>
		<li><a href="#how-it-works">How it works</a></li>
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

```ts
import { defineConfig } from 'vite'
import koppa from '@koppajs/plugin-vite'

export default defineConfig({
  plugins: [koppa()],
})
```

## Usage

### Component example

```html
[template]
<button onClick="inc">Count: {{ count }}</button>
[/template] [js] let count = 0; function inc() { count++ } [/js] [css] button { padding:
.5rem 1rem; background: #007acc; color: white; } [/css]
```

### Register in your app:

```ts
import { koppajs } from '@koppajs/koppajs-core'
import BtnCounter from './components/button-counter.kpa'

koppajs.take(BtnCounter, 'btn-counter')
koppajs()
```

## How it works

The plugin transforms `.kpa` into ES modules:

```ts
export default {
  path: '.../component.kpa',
  template: '<escaped-template>',
  style: '<compiled-css>',
  script: '(()=>{ /* controller */ })()',
}
```

Supports:

- TS → JS
- SCSS/SASS → CSS
- Composition API
- Legacy `return {}` controllers

## Community & Contribution

Issues and PRs welcome:
<https://github.com/koppajs/koppajs-vite-plugin/issues>

## License

Apache License 2.0 — © 2025 KoppaJS, Bastian Bensch
