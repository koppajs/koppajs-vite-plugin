import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  TraceMap,
  originalPositionFor,
  type EncodedSourceMap,
} from '@jridgewell/trace-mapping'
import transpileToJs from '../src/transpileToJs'

describe('transpileToJs', () => {
  const temporaryDirectories: string[] = []

  afterEach(() => {
    vi.restoreAllMocks()
    for (const directory of temporaryDirectories.splice(0)) {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  function createConfig(content: string): string {
    const directory = mkdtempSync(path.join(os.tmpdir(), 'koppa-tsconfig-'))
    temporaryDirectories.push(directory)
    const file = path.join(directory, 'tsconfig.json')
    writeFileSync(file, content)
    return file
  }

  it('preserves executable legacy returns without adding a module wrapper', () => {
    const result = transpileToJs('const count: number = 7; return { state: { count } };')
    expect(new Function(result.code)()).toEqual({ state: { count: 7 } })
    expect(result.code).not.toContain('module.exports')
    expect(result.code).not.toContain('export ')
  })

  it('resolves JSONC, trailing commas and inherited compiler options', () => {
    const config = createConfig(`{
      // This config inherits the compilation target.
      "extends": "./base.json",
      "compilerOptions": { "sourceMap": false, "inlineSourceMap": true, },
    }`)
    writeFileSync(
      path.join(path.dirname(config), 'base.json'),
      JSON.stringify({ compilerOptions: { target: 'ES2015' } }),
    )
    const source = 'const value: number = ({ nested: 4 })?.nested ?? 0;'
    const result = transpileToJs(source, config)
    expect(result.code).not.toContain('?.')
    expect(result.code).not.toContain('??')
    expect(new Function(`${result.code}; return value`)()).toBe(4)
    expect(result.map).toMatchObject({
      version: 3,
      sources: ['module.ts'],
      sourcesContent: [source],
      mappings: expect.any(String),
    })
    expect(result.code).not.toContain('sourceMappingURL')
  })

  it('keeps sourcemaps tied to the component body without a synthetic wrapper', () => {
    const source = 'const value: number = 4;\nreturn value;'
    const result = transpileToJs(source)
    expect(result.map).toMatchObject({ sourcesContent: [source] })
    const line =
      result.code.split('\n').findIndex((value) => value.startsWith('return')) + 1
    expect(
      originalPositionFor(new TraceMap(result.map as EncodedSourceMap), {
        line,
        column: 0,
      }),
    ).toMatchObject({ source: 'module.ts', line: 2, column: 0 })
    expect(new Function(result.code)()).toBe(4)
  })

  it('emits self-contained class lowering without runtime helper imports', () => {
    const config = createConfig('{ "compilerOptions": { "target": "ES2015" } }')
    const result = transpileToJs(
      'class Counter { #count = 3; get value(): number { return this.#count } }; return new Counter().value;',
      config,
    )
    expect(result.code).not.toContain('import ')
    expect(new Function(result.code)()).toBe(3)
  })

  it.each(['ES2015', 'es6', 'esnext'])(
    'supports target %s without obeying a standalone CommonJS module wrapper',
    (target) => {
      const config = createConfig(
        JSON.stringify({ compilerOptions: { target, module: 'CommonJS' } }),
      )
      const result = transpileToJs(
        'const count: number = 2; return { state: { count } };',
        config,
      )
      expect(new Function(result.code)()).toEqual({ state: { count: 2 } })
      expect(result.code).not.toContain('exports')
    },
  )

  it('fails explicitly for missing configuration and unsupported legacy targets', () => {
    const config = createConfig('{ "compilerOptions": { "target": "ES5" } }')
    expect(() => transpileToJs('let count: number = 1;', config)).toThrow()
    expect(() => transpileToJs('const count = 1;', `${config}.missing`)).toThrow()
  })

  it('reports compiler warnings without replacing valid controllers', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = transpileToJs('return ({ value: 1, value: 2 });')
    expect(new Function(result.code)()).toEqual({ value: 2 })
    expect(warning).toHaveBeenCalledWith(
      expect.stringContaining('[koppajs-vite-plugin] module.ts:'),
    )
  })

  it('rejects decorator metadata rather than silently dropping it', () => {
    const config = createConfig(
      JSON.stringify({
        compilerOptions: { experimentalDecorators: true, emitDecoratorMetadata: true },
      }),
    )
    expect(() => transpileToJs('class Example {}', config)).toThrow(
      'emitDecoratorMetadata',
    )
  })

  it('strips sourceURL comments supplied in the input', () => {
    const result = transpileToJs('const count: number = 1;\n//# sourceURL=secret.ts')
    expect(result.code).not.toContain('sourceURL')
  })

  describe('positive cases', () => {
    it('transpiles TypeScript to JavaScript', () => {
      const ts = `const x: number = 1; const y: string = 'hello';`
      const result = transpileToJs(ts)
      expect(result.code).toContain('const x = 1')
      expect(new Function(`${result.code}; return y`)()).toBe('hello')
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
      expect(new Function(`${result.code}; return u`)()).toEqual({ name: 'test' })
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
    it('rejects invalid TypeScript before emitting executable code', () => {
      expect(() => transpileToJs('const x: = 1;')).toThrow('module.ts')
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
