import { describe, it, expect } from 'vitest'
import { injectStructIdsIntoTemplate } from '../../src/utils/injectStructIds'
import { STRUCT_ATTR } from '../../src/utils/identityConstants'

describe('injectStructIdsIntoTemplate', () => {
  it('injects struct attribute into sibling elements in order', () => {
    const html = '<div></div><span></span>'
    const out = injectStructIdsIntoTemplate(html, 'seed')
    const attr = STRUCT_ATTR
    expect(out).toMatch(new RegExp(`<div[^>]*${attr}="s[a-z0-9]+-1"`))
    expect(out).toMatch(new RegExp(`<span[^>]*${attr}="s[a-z0-9]+-2"`))
  })

  it('preserves pre-existing struct attribute', () => {
    const html = `<div ${STRUCT_ATTR}="foo"></div><span></span>`
    const out = injectStructIdsIntoTemplate(html, 'seed')
    // The div should have only the original struct attribute, not a generated one
    const divMatch = out.match(new RegExp(`<div[^>]*${STRUCT_ATTR}="foo"[^>]*>`))
    expect(divMatch).toBeTruthy()
    // Should not have a generated struct id on the div
    expect(divMatch[0]).not.toMatch(new RegExp(`${STRUCT_ATTR}="s[a-z0-9]+-1"`))
    // The span should get the generated struct attribute
    expect(out).toMatch(new RegExp(`<span[^>]*${STRUCT_ATTR}="s[a-z0-9]+-1"`))
  })

  it('handles void/self-closing and custom elements', () => {
    const html = '<img><input/><my-el></my-el><x-y/>'
    const out = injectStructIdsIntoTemplate(html, 'seed')
    const attr = STRUCT_ATTR
    expect(out).toMatch(new RegExp(`<img[^>]*${attr}="s[a-z0-9]+-1"`))
    expect(out).toMatch(new RegExp(`<input[^>]*${attr}="s[a-z0-9]+-2"`))
    expect(out).toMatch(new RegExp(`<my-el[^>]*${attr}="s[a-z0-9]+-3"`))
    expect(out).toMatch(new RegExp(`<x-y[^>]*${attr}="s[a-z0-9]+-4"`))
  })

  it('preserves comments and doctypes unchanged', () => {
    const html = '<!DOCTYPE html><!-- comment --><div></div>'
    const out = injectStructIdsIntoTemplate(html, 'seed')
    // Doctype and comment should be unchanged (not matched by element regex)
    expect(out).toContain('<!DOCTYPE html>')
    expect(out).toContain('<!-- comment -->')
    // Only the div should get an injected struct attribute
    expect(out).toMatch(new RegExp(`<div[^>]*${STRUCT_ATTR}="s[a-z0-9]+-1"`))
  })
})
