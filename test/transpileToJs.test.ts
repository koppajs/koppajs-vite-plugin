import { describe, it, expect } from 'vitest'
import transpileToJs from '../src/transpileToJs'

describe('transpileToJs', () => {
  describe('positive cases', () => {
    it('transpiles TypeScript to JavaScript', () => {
      const ts = `const x: number = 1; const y: string = 'hello';`
      const result = transpileToJs(ts)
      expect(result.code).toContain('const x = 1')
      expect(result.code).toContain("const y = 'hello'")
      expect(result.code).not.toContain(': number')
      expect(result.code).not.toContain(': string')
    })

    it('transpiles type annotations', () => {
      const ts = `function add(a: number, b: number): number { return a + b; }`
      const result = transpileToJs(ts)
      expect(result.code).toContain('function add(a, b)')
      expect(result.code).not.toContain(': number')
    })

    it('transpiles interfaces (removes them)', () => {
      const ts = `interface User { name: string; } const u: User = { name: 'test' };`
      const result = transpileToJs(ts)
      expect(result.code).not.toContain('interface')
      expect(result.code).toContain("name: 'test'")
    })

    it('transpiles type aliases (removes them)', () => {
      const ts = `type ID = string | number; const id: ID = 123;`
      const result = transpileToJs(ts)
      expect(result.code).not.toContain('type ID')
      expect(result.code).toContain('const id = 123')
    })

    it('transpiles enums', () => {
      const ts = `enum Status { Active, Inactive } const s = Status.Active;`
      const result = transpileToJs(ts)
      expect(result.code).toContain('Status')
      // Enums are converted to objects/IIFEs
    })

    it('transpiles generics', () => {
      const ts = `function identity<T>(arg: T): T { return arg; }`
      const result = transpileToJs(ts)
      expect(result.code).toContain('function identity(arg)')
      expect(result.code).not.toContain('<T>')
    })

    it('transpiles class with types', () => {
      const ts = `class Counter { private count: number = 0; increment(): void { this.count++; } }`
      const result = transpileToJs(ts)
      expect(result.code).toContain('class Counter')
      expect(result.code).not.toContain(': number')
      expect(result.code).not.toContain(': void')
    })

    it('preserves async/await', () => {
      const ts = `async function fetch(): Promise<string> { return await Promise.resolve('data'); }`
      const result = transpileToJs(ts)
      expect(result.code).toContain('async function')
      expect(result.code).toContain('await')
    })

    it('generates source map', () => {
      const ts = `const x: number = 1;`
      const result = transpileToJs(ts)
      expect(result.map).toBeDefined()
      expect(typeof result.map).toBe('object')
    })
  })

  describe('negative cases', () => {
    it('handles invalid TypeScript syntax gracefully', () => {
      // TypeScript transpiler doesn't throw on syntax errors - it emits them
      // The transpileToJs function produces output even with errors
      const invalidTs = `const x: = 1;`
      const result = transpileToJs(invalidTs)
      // Should still produce some code (possibly with compilation artifacts)
      expect(result.code).toBeDefined()
    })
  })

  describe('edge cases', () => {
    it('handles empty input', () => {
      const result = transpileToJs('')
      expect(result.code).toBeDefined()
    })

    it('handles plain JavaScript (no types)', () => {
      const js = `const x = 1; function add(a, b) { return a + b; }`
      const result = transpileToJs(js)
      expect(result.code).toContain('const x = 1')
      expect(result.code).toContain('function add')
    })

    it('strips sourceMappingURL comments', () => {
      const ts = `const x: number = 1;`
      const result = transpileToJs(ts)
      expect(result.code).not.toContain('sourceMappingURL')
      expect(result.code).not.toContain('sourceURL')
    })

    it('handles decorators-like syntax', () => {
      // Note: decorators support depends on tsconfig
      const ts = `function log() { return () => {}; } class Test { method() {} }`
      const result = transpileToJs(ts)
      expect(result.code).toContain('class Test')
    })

    it('handles template literals with types', () => {
      const ts = 'const greet = (name: string): string => `Hello ${name}!`;'
      const result = transpileToJs(ts)
      expect(result.code).toContain('`Hello ${name}!`')
      expect(result.code).not.toContain(': string')
    })

    it('handles optional parameters', () => {
      const ts = `function test(a: number, b?: string) { return a; }`
      const result = transpileToJs(ts)
      expect(result.code).toContain('function test(a, b)')
    })

    it('handles rest parameters with types', () => {
      const ts = `function sum(...nums: number[]): number { return nums.reduce((a, b) => a + b, 0); }`
      const result = transpileToJs(ts)
      expect(result.code).toContain('...nums')
      expect(result.code).not.toContain('number[]')
    })
  })
})
