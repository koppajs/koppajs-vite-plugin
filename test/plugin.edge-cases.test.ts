import { describe, expect, it } from 'vitest'
import { transformKpaToModule } from '../src/index'
import { MODULE_CONTRACT_VERSION } from '../src/module-contract'
import { STRUCT_ATTR } from '../src/utils/identityConstants'

const options = {}
const resolvedDeps = new Map()

function extractModuleObject(code: string, id: string): Record<string, unknown> {
  const output = transformKpaToModule(code, id, options, resolvedDeps)
  return new Function(`return ${output}`)() as Record<string, unknown>
}

describe('transformKpaToModule edge cases', () => {
  it('keeps the contract valid when the template block is missing', () => {
    const obj = extractModuleObject(
      '[ts]return { state: { count: 0 } }[/ts][scss].test { color: red; }[/scss]',
      '/test/missing-template.kpa',
    )

    expect(obj.contractVersion).toBe(MODULE_CONTRACT_VERSION)
    expect(obj.path).toBe('/test/missing-template.kpa')
    expect(obj.template).toBe('')
    expect(obj.style).toContain('.test')
    expect(obj.script).toContain('count: 0')
  })

  it('falls back to a minimal controller when the script block is missing', () => {
    const obj = extractModuleObject(
      '[template]<div>Hello World</div>[/template][css].test { color: red; }[/css]',
      '/test/missing-script.kpa',
    )

    expect(obj.template).toContain('Hello World')
    expect(obj.style).toContain('.test')
    expect(obj.script).toContain('return { state: {} };')
  })

  it('emits an empty style string when no style block exists', () => {
    const obj = extractModuleObject(
      '[template]<div>Hello World</div>[/template][ts]return { state: { count: 0 } }[/ts]',
      '/test/missing-style.kpa',
    )

    expect(obj.style).toBe('')
    expect(obj.script).toContain('count: 0')
  })

  it('keeps malformed tags from breaking the transform', () => {
    const obj = extractModuleObject(
      `
[template]
  <div>Hello</div>
[/template]
[ts]
  const marker = "[template] should stay a string"
  return { state: { marker } }
[/ts]
[/css]
      `,
      '/test/malformed-tags.kpa',
    )

    expect(obj.template).toContain('Hello')
    expect(obj.script).toContain('[template] should stay a string')
    expect(obj.style).toBe('')
  })

  it('handles completely empty files with the minimal contract shape', () => {
    const obj = extractModuleObject('', '/test/empty.kpa')

    expect(obj.contractVersion).toBe(MODULE_CONTRACT_VERSION)
    expect(obj.path).toBe('/test/empty.kpa')
    expect(obj.template).toBe('')
    expect(obj.style).toBe('')
    expect(obj.script).toContain('return { state: {} };')
    expect(obj.structAttr).toBe(STRUCT_ATTR)
  })

  it('falls back to the minimal controller when script parsing fails', () => {
    const obj = extractModuleObject(
      '[template]<div></div>[/template][js]{ invalid javascript }}}[/js]',
      '/test/invalid-script.kpa',
    )

    expect(obj.script).toContain('return { state: {} };')
  })

  it('preserves unicode content in templates', () => {
    const obj = extractModuleObject(
      '[template]<koppa-card>日本語 🎉 föö</koppa-card>[/template]',
      '/test/unicode.kpa',
    )

    expect(obj.template).toContain('日本語 🎉 föö')
    expect(obj.template).toContain(STRUCT_ATTR)
  })

  it('normalizes windows-style file paths in the emitted contract', () => {
    const obj = extractModuleObject(
      '[template]<div>Path</div>[/template]',
      'C:\\repo\\components\\PathTest.kpa',
    )

    expect(obj.path).toBe('C:/repo/components/PathTest.kpa')
  })

  it('keeps template literals intact inside emitted controller code', () => {
    const obj = extractModuleObject(
      '[template]<div></div>[/template][js]const msg = `Outer ${`Inner ${value}`}`; return { state: { msg } }[/js]',
      '/test/template-literals.kpa',
    )

    expect(obj.script).toContain('`Outer ${`Inner ${value}`}`')
  })
})
