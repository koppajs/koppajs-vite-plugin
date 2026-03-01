import { describe, it, expect } from 'vitest'
import { normalizeStructSeed } from '../../src/utils/structId'
import { injectStructIdsIntoTemplate } from '../../src/utils/injectStructIds'

describe('structId injection determinism', () => {
  // Use custom elements (tags with hyphen) since only they get structIds
  const templateA = `<div><my-component>Hello</my-component><other-el/></div>`
  const templateB = `<div><my-component>World</my-component><other-el/></div>`
  const id1 = '/path/to/fileA'
  const id2 = '/path/to/fileB'

  it('identical input yields identical output', () => {
    const seed1 = normalizeStructSeed(id1, templateA)
    const out1 = injectStructIdsIntoTemplate(templateA, seed1)
    const seed2 = normalizeStructSeed(id1, templateA)
    const out2 = injectStructIdsIntoTemplate(templateA, seed2)
    expect(out1).toBe(out2)
  })

  it('different template yields different output', () => {
    const seedA = normalizeStructSeed(id1, templateA)
    const outA = injectStructIdsIntoTemplate(templateA, seedA)
    const seedB = normalizeStructSeed(id1, templateB)
    const outB = injectStructIdsIntoTemplate(templateB, seedB)
    expect(outA).not.toBe(outB)
  })

  it('same template, different id yields different output', () => {
    const seed1 = normalizeStructSeed(id1, templateA)
    const out1 = injectStructIdsIntoTemplate(templateA, seed1)
    const seed2 = normalizeStructSeed(id2, templateA)
    const out2 = injectStructIdsIntoTemplate(templateA, seed2)
    expect(out1).not.toBe(out2)
  })
})
