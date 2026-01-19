import { describe, it, expect } from 'vitest'
import { transformKpaToModule } from '../src/index'
import { STRUCT_ATTR } from '../src/utils/identityConstants'

// Minimal mock for PluginOptions and ResolvedImportInfo
const options = {}
const resolvedDeps = new Map()

describe('transformKpaToModule structId injection', () => {
  it('injects data-k-struct attributes into template elements', () => {
    const code = '[template]<div><span></span><b></b></div>[/template]'
    const id = '/foo/bar.kpa'
    const output = transformKpaToModule(code, id, options, resolvedDeps)
    // The output is a JS object literal string; extract the template JSON payload
    // Use a regex that properly handles JSON-escaped strings (with \")
    const match = output.match(/template:\s*"((?:[^"\\]|\\.)*)"/s)
    expect(match).toBeTruthy()
    const templateStr = match ? match[1] : ''
    // Should contain struct attribute
    expect(templateStr).toMatch(new RegExp(`${STRUCT_ATTR}=`))
    // Should have as many as elements (div, span, b)
    const count = (templateStr.match(new RegExp(`${STRUCT_ATTR}=`, 'g')) || []).length
    expect(count).toBe(3)
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
    const code = '[template]<div></div>[/template]'
    const id = '/foo/bar.kpa'
    const output = transformKpaToModule(code, id, options, resolvedDeps)
    // Check if structAttr exists and equals the constant
    expect(output).toMatch(/structAttr:\s*['"]data-k-struct['"]/)
  })
})
