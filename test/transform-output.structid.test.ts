import { describe, it, expect } from 'vitest'
import { transformKpaToModule } from '../src/index'
import { STRUCT_ATTR } from '../src/utils/identityConstants'

// Minimal mock for PluginOptions and ResolvedImportInfo
const options = {}
const resolvedDeps = new Map()

describe('transformKpaToModule structId injection', () => {
  it('injects data-k-struct attributes only into custom elements', () => {
    const code =
      '[template]<div><my-component></my-component><other-el></other-el></div>[/template]'
    const id = '/foo/bar.kpa'
    const output = transformKpaToModule(code, id, options, resolvedDeps)
    // The output is a JS object literal string; extract the template JSON payload
    const match = output.match(/template:\s*"((?:[^"\\]|\\.)*)"/s)
    expect(match).toBeTruthy()
    const templateStr = match ? match[1] : ''
    // Should contain struct attribute only for custom elements
    expect(templateStr).toMatch(new RegExp(`${STRUCT_ATTR}=`))
    // Should have 2 struct attributes (my-component, other-el) - not div
    const count = (templateStr.match(new RegExp(`${STRUCT_ATTR}=`, 'g')) || []).length
    expect(count).toBe(2)
  })

  it('does not inject struct attributes into regular HTML elements', () => {
    const code = '[template]<div><span></span><b></b></div>[/template]'
    const id = '/foo/bar.kpa'
    const output = transformKpaToModule(code, id, options, resolvedDeps)
    const match = output.match(/template:\s*"((?:[^"\\]|\\.)*)"/s)
    expect(match).toBeTruthy()
    const templateStr = match ? match[1] : ''
    // Should NOT contain struct attribute for regular elements
    expect(templateStr).not.toMatch(new RegExp(`${STRUCT_ATTR}=`))
  })

  it('does not inject when template is empty', () => {
    const code = '[template][/template]'
    const id = '/foo/empty.kpa'
    const output = transformKpaToModule(code, id, options, resolvedDeps)
    const match = output.match(/template:\s*([`'"])(.*?)\1/s)
    expect(match).toBeTruthy()
    const templateStr = match ? match[2] : ''
    expect(templateStr).toBe('')
  })

  it('includes structAttr in the output object', () => {
    const code = '[template]<my-app></my-app>[/template]'
    const id = '/foo/bar.kpa'
    const output = transformKpaToModule(code, id, options, resolvedDeps)
    // Check if structAttr exists and equals the constant
    expect(output).toMatch(new RegExp(`structAttr:\\s*['"']${STRUCT_ATTR}['"']`))
  })
})
