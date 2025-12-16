import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import pkg from './package.json' with { type: 'json' }

// __dirname in ESM simulieren
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Package-Name in CamelCase umwandeln
const getPackageNameCamelCase = () => {
  if (!pkg.name) {
    throw new Error("Missing 'name' in package.json")
  }

  return pkg.name
    .replace(/[@/]/g, '') // @scope/ entfernen
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase()) // kebab/case → camelCase
}

export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: getPackageNameCamelCase(),
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format}.js`,
    },
  },
})
