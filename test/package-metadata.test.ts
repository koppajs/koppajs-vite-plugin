import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import packageJson from '../package.json' with { type: 'json' }
import viteConfig from '../vite.config'

type ExportMap = {
  '.': {
    types: string
    import: string
    require: string
  }
}

describe('package metadata contract', () => {
  it('keeps package entry fields aligned with Vite output names', () => {
    const exports = packageJson.exports as ExportMap
    const fileName = viteConfig.build?.lib?.fileName

    expect(typeof fileName).toBe('function')

    const resolveFileName = fileName as (format: 'es' | 'cjs') => string
    const esFile = `./dist/${resolveFileName('es')}`
    const cjsFile = `./dist/${resolveFileName('cjs')}`

    expect(packageJson.module).toBe(esFile)
    expect(packageJson.main).toBe(cjsFile)
    expect(packageJson.types).toBe('./dist/index.d.ts')
    expect(exports['.'].import).toBe(esFile)
    expect(exports['.'].require).toBe(cjsFile)
    expect(exports['.'].types).toBe(packageJson.types)
  })

  it('exposes the baseline quality scripts contributors rely on', () => {
    for (const scriptName of [
      'prepare',
      'format',
      'format:check',
      'lint',
      'lint:fix',
      'typecheck',
      'test',
      'test:watch',
      'test:coverage',
      'check',
      'validate',
      'build',
    ]) {
      expect(packageJson.scripts?.[scriptName]).toBeTruthy()
    }
  })

  it('keeps clean focused on generated artifacts instead of dependency state', () => {
    expect(packageJson.scripts?.clean).not.toContain('node_modules')
    expect(packageJson.scripts?.clean).not.toContain('pnpm-lock.yaml')
  })

  it('declares Node.js >=22 while keeping Node 22 as the maintainer default', () => {
    const nvmrc = readFileSync(new URL('../.nvmrc', import.meta.url), 'utf8').trim()

    expect(packageJson.engines?.node).toBe('>=22')
    expect(nvmrc).toBe('22')
  })
})
