import { describe, it, expect } from 'vitest'
import { transformKpaToModule } from '../src/index'

const options = {}
const resolvedDeps = new Map()

/**
 * Extract the style value from the transformed module output.
 */
function extractStyle(output: string): string {
  const match = output.match(/style:\s*"((?:[^"\\]|\\.)*)"/s)
  if (!match) return ''
  // JSON-unescape the matched string
  return JSON.parse(`"${match[1]}"`)
}

describe('transformKpaToModule empty style block handling', () => {
  it('handles empty [css] block without throwing', () => {
    const code = `[template]<div>Hello</div>[/template]\n[css][/css]`
    const id = '/test/empty-css.kpa'

    expect(() => transformKpaToModule(code, id, options, resolvedDeps)).not.toThrow()
    const output = transformKpaToModule(code, id, options, resolvedDeps)
    const style = extractStyle(output)
    expect(style).toBe('')
  })

  it('handles whitespace-only [css] block without throwing', () => {
    const code = `[template]<div>Hello</div>[/template]\n[css]   \n\t  [/css]`
    const id = '/test/whitespace-css.kpa'

    expect(() => transformKpaToModule(code, id, options, resolvedDeps)).not.toThrow()
    const output = transformKpaToModule(code, id, options, resolvedDeps)
    const style = extractStyle(output)
    expect(style).toBe('')
  })

  it('handles empty [scss] block without throwing', () => {
    const code = `[template]<div>Hello</div>[/template]\n[scss][/scss]`
    const id = '/test/empty-scss.kpa'

    expect(() => transformKpaToModule(code, id, options, resolvedDeps)).not.toThrow()
    const output = transformKpaToModule(code, id, options, resolvedDeps)
    const style = extractStyle(output)
    expect(style).toBe('')
  })

  it('handles whitespace-only [scss] block without throwing', () => {
    const code = `[template]<div>Hello</div>[/template]\n[scss]   \n\t  [/scss]`
    const id = '/test/whitespace-scss.kpa'

    expect(() => transformKpaToModule(code, id, options, resolvedDeps)).not.toThrow()
    const output = transformKpaToModule(code, id, options, resolvedDeps)
    const style = extractStyle(output)
    expect(style).toBe('')
  })

  it('handles empty [sass] block without throwing', () => {
    const code = `[template]<div>Hello</div>[/template]\n[sass][/sass]`
    const id = '/test/empty-sass.kpa'

    expect(() => transformKpaToModule(code, id, options, resolvedDeps)).not.toThrow()
    const output = transformKpaToModule(code, id, options, resolvedDeps)
    const style = extractStyle(output)
    expect(style).toBe('')
  })

  it('compiles non-empty [scss] block correctly', () => {
    const code = `[template]<div>Hello</div>[/template]\n[scss].test { color: red; }[/scss]`
    const id = '/test/valid-scss.kpa'

    const output = transformKpaToModule(code, id, options, resolvedDeps)
    const style = extractStyle(output)
    expect(style).toContain('.test')
    expect(style).toContain('color: red')
  })

  it('compiles non-empty [sass] block correctly', () => {
    const code = `[template]<div>Hello</div>[/template]\n[sass].test\n  color: red[/sass]`
    const id = '/test/valid-sass.kpa'

    const output = transformKpaToModule(code, id, options, resolvedDeps)
    const style = extractStyle(output)
    expect(style).toContain('.test')
    expect(style).toContain('color: red')
  })

  it('handles multiple style blocks with one empty', () => {
    const code = `[template]<div>Hello</div>[/template]\n[scss][/scss]\n[css].other { font-size: 16px; }[/css]`
    const id = '/test/mixed-styles.kpa'

    expect(() => transformKpaToModule(code, id, options, resolvedDeps)).not.toThrow()
    const output = transformKpaToModule(code, id, options, resolvedDeps)
    const style = extractStyle(output)
    expect(style).toContain('.other')
    expect(style).toContain('font-size: 16px')
  })

  it('handles no style blocks at all', () => {
    const code = `[template]<div>Hello</div>[/template]`
    const id = '/test/no-style.kpa'

    expect(() => transformKpaToModule(code, id, options, resolvedDeps)).not.toThrow()
    const output = transformKpaToModule(code, id, options, resolvedDeps)
    const style = extractStyle(output)
    expect(style).toBe('')
  })
})
