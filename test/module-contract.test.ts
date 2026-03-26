import { describe, it, expect } from 'vitest'
import { transformKpaToModule } from '../src/index'
import { MODULE_CONTRACT_VERSION, validateKoppaModule } from '../src/module-contract'
import { STRUCT_ATTR } from '../src/utils/identityConstants'

const options = {}
const resolvedDeps = new Map()

function parseOutputObject(output: string) {
  // Evaluate the output string as an object literal
  // (the plugin emits a JS object, not a module)
  // This is safe here because the test controls the input

  return new Function(`return ${output}`)()
}

describe('KoppaModule contract enforcement', () => {
  it('emits valid module and passes validation', () => {
    const code = '[template]<div></div>[/template][js]{}[/js][css].a{}[/css]'
    const id = '/test/file.kpa'
    const output = transformKpaToModule(code, id, options, resolvedDeps)
    const obj = parseOutputObject(output)
    expect(validateKoppaModule(obj)).toBe(true)
  })

  it('fails validation if shape changes', () => {
    // Remove a required field
    const broken = {
      contractVersion: MODULE_CONTRACT_VERSION,
      path: '/test/file.kpa',
      template: '<div></div>',
      style: '.a{}',
      // script missing
      scriptMap: null,
      deps: {},
      structAttr: STRUCT_ATTR,
    }
    expect(validateKoppaModule(broken)).toBe(false)
  })

  it('fails validation if contract metadata drifts', () => {
    const broken = {
      contractVersion: MODULE_CONTRACT_VERSION + 1,
      path: '/test/file.kpa',
      template: '<div></div>',
      style: '.a{}',
      script: '(() => { return { state: {} } })()',
      scriptMap: null,
      deps: null,
      structAttr: STRUCT_ATTR,
    }

    expect(validateKoppaModule(broken)).toBe(false)
  })
})

describe('KoppaModule deps field validation', () => {
  const baseModule = {
    contractVersion: MODULE_CONTRACT_VERSION,
    path: '/test/file.kpa',
    template: '<div></div>',
    style: '.a{}',
    script: '(() => { return { state: {} } })()',
    scriptMap: null,
    structAttr: STRUCT_ATTR,
  }

  it('accepts deps = null', () => {
    const module = { ...baseModule, deps: null }
    expect(validateKoppaModule(module)).toBe(true)
  })

  it('accepts deps with function values', () => {
    const module = {
      ...baseModule,
      deps: {
        foo: () => Promise.resolve({ default: 'foo' }),
        bar: () => import('vitest').then((m) => m.describe),
      },
    }
    expect(validateKoppaModule(module)).toBe(true)
  })

  it('accepts deps as empty object', () => {
    const module = { ...baseModule, deps: {} }
    expect(validateKoppaModule(module)).toBe(true)
  })

  it('rejects deps with non-function values', () => {
    const module = {
      ...baseModule,
      deps: {
        foo: 'not a function',
      },
    }
    expect(validateKoppaModule(module)).toBe(false)
  })

  it('rejects deps with mixed function and non-function values', () => {
    const module = {
      ...baseModule,
      deps: {
        foo: () => Promise.resolve({ default: 'foo' }),
        bar: 123,
      },
    }
    expect(validateKoppaModule(module)).toBe(false)
  })

  it('rejects deps as an array', () => {
    const module = {
      ...baseModule,
      deps: [() => Promise.resolve('item')],
    }
    expect(validateKoppaModule(module)).toBe(false)
  })

  it('rejects deps as undefined', () => {
    const module = { ...baseModule, deps: undefined }
    expect(validateKoppaModule(module)).toBe(false)
  })

  it('rejects deps as a primitive', () => {
    const module = { ...baseModule, deps: 'string-deps' }
    expect(validateKoppaModule(module)).toBe(false)
  })
})
