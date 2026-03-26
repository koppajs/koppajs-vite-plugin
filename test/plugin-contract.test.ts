import { describe, it, expect } from 'vitest'
import { transformKpaToModule } from '../src/index'
import { MODULE_CONTRACT_VERSION } from '../src/module-contract'

const options = {}
const resolvedDeps = new Map()

function parseOutputObject(output: string) {
  // Evaluate the output string as an object literal
  // (the plugin emits a JS object, not a module)
  // This is safe here because the test controls the input

  return new Function(`return ${output}`)()
}

describe('Vite plugin output contract with KoppaJS core', () => {
  it('produces all required fields for ComponentSource', () => {
    const code = '[template]<div></div>[/template][js]{}[/js][css].a{}[/css]'
    const id = '/test/file.kpa'
    const output = transformKpaToModule(code, id, options, resolvedDeps)
    const obj = parseOutputObject(output)
    expect(obj.contractVersion).toBe(MODULE_CONTRACT_VERSION)
    expect(obj.path).toBe(id)
    expect(typeof obj.template).toBe('string')
    expect(typeof obj.script).toBe('string')
    expect(typeof obj.style).toBe('string')
  })

  it('keeps optional fields nullable while preserving required metadata', () => {
    const code = '[template]<div></div>[/template][js]{}[/js][css].a{}[/css]'
    const id = '/test/file.kpa'
    const output = transformKpaToModule(code, id, options, resolvedDeps)
    const obj = parseOutputObject(output)
    expect(obj.contractVersion).toBe(MODULE_CONTRACT_VERSION)
    expect(obj.path).toBe(id)
    expect(obj.scriptMap === undefined || obj.scriptMap === null).toBe(true)
    // deps should be null (no imports) or an object of functions (with imports)
    expect(
      obj.deps === null ||
        (typeof obj.deps === 'object' &&
          !Array.isArray(obj.deps) &&
          Object.values(obj.deps).every((v) => typeof v === 'function')),
    ).toBe(true)
    expect(obj.type === undefined || typeof obj.type === 'string').toBe(true)
    expect(obj.structAttr === undefined || typeof obj.structAttr === 'string').toBe(true)
  })

  it('fails gracefully if required fields are missing', () => {
    // Simulate a broken plugin output (missing script and contract metadata)
    const brokenOutput = '{ template: "<div></div>", style: ".a{}" }'
    // Should not pass the isComponentSource type guard
    const isComponentSource = (ext: any) =>
      typeof ext?.template === 'string' &&
      typeof ext?.script === 'string' &&
      typeof ext?.style === 'string'
    const obj = parseOutputObject(brokenOutput)
    expect(isComponentSource(obj)).toBe(false)
  })

  it('enforces invariants: script and style are strings', () => {
    const code = '[template]<div></div>[/template][js]{}[/js][css].a{}[/css]'
    const id = '/test/file.kpa'
    const output = transformKpaToModule(code, id, options, resolvedDeps)
    const obj = parseOutputObject(output)
    expect(typeof obj.script).toBe('string')
    expect(typeof obj.style).toBe('string')
  })

  it('handles failure modes: invalid JS in script block', () => {
    // Invalid JS should fallback to minimal controller
    const code =
      '[template]<div></div>[/template][js]{ this is not valid JS! }[/js][css].a{}[/css]'
    const id = '/test/invalid.kpa'
    const output = transformKpaToModule(code, id, options, resolvedDeps)
    const obj = parseOutputObject(output)
    expect(typeof obj.script).toBe('string')
    // Should still produce a script string, even if fallback
    expect(obj.script).toContain('return { state: {} }')
  })
})
