import { describe, it, expect } from 'vitest'
import { injectStructIdsIntoTemplate } from '../../src/utils/injectStructIds'
import { STRUCT_ATTR } from '../../src/utils/identityConstants'

describe('injectStructIdsIntoTemplate', () => {
  it('only injects struct attribute into custom elements (tags with hyphen)', () => {
    const html = '<div></div><my-component></my-component><span></span>'
    const out = injectStructIdsIntoTemplate(html, 'seed')
    const attr = STRUCT_ATTR
    // Regular elements should NOT have struct attribute
    expect(out).not.toMatch(new RegExp(`<div[^>]*${attr}=`))
    expect(out).not.toMatch(new RegExp(`<span[^>]*${attr}=`))
    // Custom element should have struct attribute
    expect(out).toMatch(new RegExp(`<my-component[^>]*${attr}="s[a-z0-9]+-1"`))
  })

  it('preserves pre-existing struct attribute on custom elements', () => {
    const html = `<my-el ${STRUCT_ATTR}="foo"></my-el><other-el></other-el>`
    const out = injectStructIdsIntoTemplate(html, 'seed')
    // The first custom element should keep its original struct attribute
    const myElMatch = out.match(new RegExp(`<my-el[^>]*${STRUCT_ATTR}="foo"[^>]*>`))
    expect(myElMatch).toBeTruthy()
    // Should not have a generated struct id on the first element
    expect(myElMatch![0]).not.toMatch(new RegExp(`${STRUCT_ATTR}="s[a-z0-9]+-1"`))
    // The second custom element should get the generated struct attribute
    expect(out).toMatch(new RegExp(`<other-el[^>]*${STRUCT_ATTR}="s[a-z0-9]+-1"`))
  })

  it('injects into custom elements, ignores regular and void elements', () => {
    const html = '<img><input/><my-el></my-el><x-y/><div></div>'
    const out = injectStructIdsIntoTemplate(html, 'seed')
    const attr = STRUCT_ATTR
    // Regular/void elements should NOT have struct attribute
    expect(out).not.toMatch(new RegExp(`<img[^>]*${attr}=`))
    expect(out).not.toMatch(new RegExp(`<input[^>]*${attr}=`))
    expect(out).not.toMatch(new RegExp(`<div[^>]*${attr}=`))
    // Custom elements should have struct attribute
    expect(out).toMatch(new RegExp(`<my-el[^>]*${attr}="s[a-z0-9]+-1"`))
    expect(out).toMatch(new RegExp(`<x-y[^>]*${attr}="s[a-z0-9]+-2"`))
  })

  it('preserves comments and doctypes unchanged', () => {
    const html = '<!DOCTYPE html><!-- comment --><my-app></my-app>'
    const out = injectStructIdsIntoTemplate(html, 'seed')
    // Doctype and comment should be unchanged
    expect(out).toContain('<!DOCTYPE html>')
    expect(out).toContain('<!-- comment -->')
    // Only the custom element should get an injected struct attribute
    expect(out).toMatch(new RegExp(`<my-app[^>]*${STRUCT_ATTR}="s[a-z0-9]+-1"`))
  })

  it('does not inject into regular HTML elements', () => {
    const html = '<div><span><p>text</p></span></div>'
    const out = injectStructIdsIntoTemplate(html, 'seed')
    // Output should be unchanged - no struct attributes added
    expect(out).toBe(html)
  })
})
