import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { builtinModules } from 'node:module'
import { defineConfig } from 'vite'
import pkg from './package.json' with { type: 'json' }

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Minimal shape of package.json we actually rely on.
 * Optional fields keep the config future-proof.
 */
type PkgJson = {
  name: string
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

const pkgJson = pkg as unknown as PkgJson

/**
 * Converts the package name into a valid global library name
 * (only relevant for certain bundler consumers).
 */
const getLibraryName = () =>
  pkgJson.name
    .replace(/^@.*\//, '')
    .replace(/[-_/](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, (c) => c.toUpperCase())

/**
 * Node built-ins must never be bundled in a Vite plugin.
 */
const nodeExternals = new Set([
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
])

/**
 * Runtime dependencies should stay external.
 * The plugin expects them to be provided by the environment.
 */
const pkgExternals = new Set([
  ...Object.keys(pkgJson.dependencies ?? {}),
  ...Object.keys(pkgJson.peerDependencies ?? {}),
])

/**
 * Explicit allowlist for deps that should be bundled on purpose.
 * Keep empty unless you have a strong reason.
 */
const bundleAllowlist = new Set<string>([])

/**
 * Central external resolution logic.
 * Keeps the bundle small and prevents double Vite instances.
 */
const isExternal = (id: string) => {
  if (nodeExternals.has(id)) return true
  if (id === 'vite') return true

  const base = id.startsWith('@') ? id.split('/').slice(0, 2).join('/') : id.split('/')[0]

  if (bundleAllowlist.has(base)) return false
  if (pkgExternals.has(base)) return true

  return false
}

export default defineConfig({
  build: {
    // Hidden sourcemaps avoid massive memory usage during build
    sourcemap: 'hidden',
    minify: true,

    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: getLibraryName(),
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'cjs' ? 'index.cjs' : 'index.es.js'),
    },

    rollupOptions: {
      external: isExternal,
      output: {
        exports: 'named',
      },
    },
  },
})
