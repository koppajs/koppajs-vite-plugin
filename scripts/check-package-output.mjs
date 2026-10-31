import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const temporaryRoot = mkdtempSync(path.join(tmpdir(), 'koppa-package-output-'))

try {
  execFileSync('pnpm', ['pack', '--pack-destination', temporaryRoot], {
    cwd: root,
    stdio: 'pipe',
  })
  const archive = readdirSync(temporaryRoot).find((file) => file.endsWith('.tgz'))
  assert.ok(archive, 'pnpm pack must produce a package archive')
  execFileSync('tar', ['-xzf', path.join(temporaryRoot, archive), '-C', temporaryRoot])

  const packageRoot = path.join(temporaryRoot, 'package')
  const metadata = JSON.parse(
    readFileSync(path.join(packageRoot, 'package.json'), 'utf8'),
  )
  assert.equal(metadata.peerDependencies.typescript, undefined)
  const declarations = readFileSync(path.join(packageRoot, metadata.types), 'utf8')
  assert.doesNotMatch(declarations, /from ['"]typescript/)

  // Expose only declared production dependencies, never the repository's dev tools.
  for (const dependency of Object.keys(metadata.dependencies)) {
    const destination = path.join(packageRoot, 'node_modules', dependency)
    mkdirSync(path.dirname(destination), { recursive: true })
    symlinkSync(
      realpathSync(path.join(root, 'node_modules', dependency)),
      destination,
      'dir',
    )
  }

  const require = createRequire(path.join(packageRoot, 'package.json'))
  const entry = metadata.exports['.']
  const esm = await import(pathToFileURL(path.join(packageRoot, entry.import)).href)
  const cjs = require(metadata.name)

  for (const [format, plugin] of [
    ['ESM', esm],
    ['CJS', cjs],
  ]) {
    assert.equal(typeof plugin.default, 'function', `${format}: plugin factory`)
    const output = plugin.transformKpaToModule(
      '[ts]enum Count { Initial = 7 }; const value: number = Count.Initial; return { state: { value } };[/ts]',
      '/package-check.kpa',
      {},
      new Map(),
    )
    const component = new Function(`return (${output})`)()
    assert.deepEqual(new Function(`return ${component.script}`)(), {
      state: { value: 7 },
    })
    assert.equal(component.scriptMap.version, 3)
    assert.doesNotMatch(component.script, /sourceMappingURL|sourceURL/)

    const componentPath = path.join(temporaryRoot, 'imports.kpa')
    writeFileSync(
      componentPath,
      '[ts]import { value } from "./dependency.js"; return { state: { value } };[/ts]',
    )
    const instance = plugin.default({ tsconfigFile: undefined })
    const loaded = await instance.load.call({ resolve: async () => null }, componentPath)
    const withImports = new Function(
      `return (${loaded.replace(/^export default /, '')})`,
    )()
    assert.equal(
      typeof withImports.deps.value,
      'function',
      `${format}: import extraction`,
    )
    assert.match(withImports.script, /value/)
    assert.deepEqual(new Function('value', `return ${withImports.script}`)(11), {
      state: { value: 11 },
    })
    console.log(
      `${format} packed package: TypeScript controller, imports and sourcemap passed`,
    )
  }
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true })
}
