// test/plugin.test.ts
import { describe, expect, it } from 'vitest'
import koppajsVitePlugin from '../src/index'

describe('koppajsVitePlugin', () => {
  it('creates a Vite plugin object', () => {
    const plugin = koppajsVitePlugin()
    expect(plugin.name).toBe('koppajs-vite-plugin')
    expect(plugin.enforce).toBe('pre')
  })
})
