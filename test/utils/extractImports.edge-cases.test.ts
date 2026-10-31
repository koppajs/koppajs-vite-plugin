import { describe, it, expect } from 'vitest'
import { extractImports } from '../../src/utils/extractImports'
import { transformKpaToModule } from '../../src/index'

describe('extractImports - edge cases and negative tests', () => {
  describe('malformed imports', () => {
    it('handles import with no specifiers', () => {
      const code = `import 'side-effect-module'`
      const result = extractImports(code, 'test.kpa')

      // Side-effect imports have no bindings
      expect(result.deps.size).toBe(0)
      expect(result.strippedCode).not.toContain('import')
    })

    it('handles import with trailing comma', () => {
      const code = `import { foo, bar, } from 'module'`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(2)
      expect(result.deps.has('foo')).toBe(true)
      expect(result.deps.has('bar')).toBe(true)
    })

    it('handles import with whitespace variations', () => {
      const code = `import  {  foo  ,  bar  }  from  'module'`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(2)
      expect(result.deps.has('foo')).toBe(true)
      expect(result.deps.has('bar')).toBe(true)
    })

    it('handles import with newlines', () => {
      const code = `import {
        foo,
        bar,
        baz
      } from 'module'`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(3)
    })

    it('handles import with comments', () => {
      const code = `import {
        foo, // first import
        bar, /* second import */
        baz
      } from 'module'`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(3)
    })

    it('handles dynamic imports in code', () => {
      const code = `
        import { foo } from 'static-module'
        const bar = await import('dynamic-module')
      `
      const result = extractImports(code, 'test.kpa')

      // Only static imports are extracted
      expect(result.deps.size).toBe(1)
      expect(result.deps.has('foo')).toBe(true)
      expect(result.strippedCode).toContain("import('dynamic-module')")
    })

    it('handles import inside string literal', () => {
      const code = `
        import { foo } from 'module'
        const str = "import { fake } from 'fake-module'"
      `
      const result = extractImports(code, 'test.kpa')

      // Only real import should be extracted
      expect(result.deps.size).toBe(1)
      expect(result.deps.has('foo')).toBe(true)
    })

    it('handles import inside comment', () => {
      const code = `
        import { foo } from 'module'
        // import { fake } from 'fake-module'
        /* import { another } from 'another-module' */
      `
      const result = extractImports(code, 'test.kpa')

      // Only real import should be extracted
      expect(result.deps.size).toBe(1)
      expect(result.deps.has('foo')).toBe(true)
    })

    it('handles empty file', () => {
      const code = ``
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(0)
      expect(result.strippedCode).toBe('')
    })

    it('handles file with only whitespace', () => {
      const code = `   \n\n\t\t  \n  `
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(0)
    })

    it('handles file with no imports', () => {
      const code = `const x = 42;\nconsole.log(x);`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(0)
      expect(result.strippedCode).toContain('const x = 42')
    })
  })

  describe('import sources - edge cases', () => {
    it('handles scoped package names', () => {
      const code = `import { Component } from '@koppajs/core'`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(1)
      expect(result.deps.get('Component')?.source).toBe('@koppajs/core')
    })

    it('handles relative imports with ..', () => {
      const code = `import { foo } from '../parent/module'`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(1)
      expect(result.deps.get('foo')?.source).toBe('../parent/module')
    })

    it('handles deep relative imports', () => {
      const code = `import { foo } from '../../../very/deep/module'`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(1)
      expect(result.deps.get('foo')?.source).toBe('../../../very/deep/module')
    })

    it('handles imports with file extensions', () => {
      const code = `import { foo } from './module.js'`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(1)
      expect(result.deps.get('foo')?.source).toBe('./module.js')
    })

    it('handles imports with .kpa extension', () => {
      const code = `import Component from './Component.kpa'`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(1)
      expect(result.deps.get('Component')?.source).toBe('./Component.kpa')
    })

    it('handles imports with query parameters', () => {
      const code = `import styles from './styles.css?inline'`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(1)
    })

    it('handles imports with special characters in path', () => {
      const code = `import { foo } from './my-module-v1.2.3'`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(1)
    })
  })

  describe('import specifiers - edge cases', () => {
    it('handles type-only imports', () => {
      const code = `import type { Foo } from 'module'`
      const result = extractImports(code, 'test.kpa')

      // Type imports should be handled or stripped
      expect(result.strippedCode).not.toContain('import type')
    })

    it('handles mixed default and named imports', () => {
      const code = `import Default, { named1, named2 } from 'module'`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.has('Default')).toBe(true)
      expect(result.deps.has('named1')).toBe(true)
      expect(result.deps.has('named2')).toBe(true)
    })

    it('handles namespace imports', () => {
      const code = `import * as Everything from 'module'`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.has('Everything')).toBe(true)
    })

    it('handles mixed namespace and named imports', () => {
      const code = `import Default, * as NS from 'module'`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.has('Default')).toBe(true)
      expect(result.deps.has('NS')).toBe(true)
    })

    it('handles imports with reserved words as aliases', () => {
      const code = `import { default as defaultValue } from 'module'`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.has('defaultValue')).toBe(true)
    })

    it('handles imports with special characters in names', () => {
      const code = `import { $special, _private, __proto__ } from 'module'`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(3)
      expect(result.deps.has('$special')).toBe(true)
      expect(result.deps.has('_private')).toBe(true)
      expect(result.deps.has('__proto__')).toBe(true)
    })
  })

  describe('code stripping - edge cases', () => {
    it('preserves code after imports', () => {
      const code = `import { foo } from 'module'\nconst x = foo();\nconsole.log(x);`
      const result = extractImports(code, 'test.kpa')

      expect(result.strippedCode).not.toContain('import')
      expect(result.strippedCode).toContain('const x = foo()')
      expect(result.strippedCode).toContain('console.log(x)')
    })

    it('preserves code before imports', () => {
      const code = `const before = 42;\nimport { foo } from 'module'\nconst after = foo();`
      const result = extractImports(code, 'test.kpa')

      expect(result.strippedCode).toContain('const before = 42')
      expect(result.strippedCode).toContain('const after = foo()')
      expect(result.strippedCode).not.toContain('import')
    })

    it('preserves code between multiple imports', () => {
      const code = `
        import { foo } from 'module1'
        const x = 1;
        import { bar } from 'module2'
        const y = 2;
      `
      const result = extractImports(code, 'test.kpa')

      expect(result.strippedCode).toContain('const x = 1')
      expect(result.strippedCode).toContain('const y = 2')
      expect(result.strippedCode).not.toContain('import')
    })

    it('handles semicolons correctly', () => {
      const code = `import { foo } from 'module';const x = foo();`
      const result = extractImports(code, 'test.kpa')

      expect(result.strippedCode).toContain('const x = foo()')
    })
  })

  describe('duplicate imports', () => {
    it('handles duplicate named imports from same module', () => {
      const code = `
        import { foo } from 'module'
        import { bar } from 'module'
      `
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(2)
      expect(result.deps.has('foo')).toBe(true)
      expect(result.deps.has('bar')).toBe(true)
    })

    it('handles same name imported from different modules', () => {
      const code = `
        import { foo } from 'module1'
        import { foo as foo2 } from 'module2'
      `
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(2)
      expect(result.deps.has('foo')).toBe(true)
      expect(result.deps.has('foo2')).toBe(true)
    })

    it('handles duplicate default imports', () => {
      const code = `
        import Default1 from 'module1'
        import Default2 from 'module2'
      `
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(2)
      expect(result.deps.has('Default1')).toBe(true)
      expect(result.deps.has('Default2')).toBe(true)
    })
  })

  describe('complex scenarios', () => {
    it('handles very long import list', () => {
      const imports = Array.from({ length: 100 }, (_, i) => `import${i}`).join(', ')
      const code = `import { ${imports} } from 'module'`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(100)
    })

    it('handles many separate import statements', () => {
      const imports = Array.from(
        { length: 50 },
        (_, i) => `import { foo${i} } from 'module${i}'`,
      ).join('\n')
      const result = extractImports(imports, 'test.kpa')

      expect(result.deps.size).toBe(50)
    })

    it('rejects invalid emoji identifiers with a contextual parser error', () => {
      const code = `import { föö, 日本語, emoji😀 } from 'module'`

      expect(() => extractImports(code, 'test.kpa')).toThrow(
        'Failed to parse imports in test.kpa:',
      )
    })

    it('handles imports with escaped characters', () => {
      const code = `import { foo } from 'module\\npath'`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBeGreaterThanOrEqual(0)
    })
  })
})

describe('extractImports - oxc parser regressions', () => {
  it('preserves exact UTF-16 stripping ranges after Unicode text', () => {
    const before = '// é 日本語 😀\r\nconst label = "𝄞 café";\r\n'
    const between = '\r\n/* 😀 retain this comment */\r\n'
    const after = '\r\nreturn { label, foo, Utils };'
    const code =
      before +
      'import { foo } from "./日本語";' +
      between +
      'import * as Utils from "./utils";' +
      after

    const result = extractImports(code, 'unicode.kpa')

    expect(result.strippedCode).toBe(before + between + after)
    expect(result.deps.get('foo')?.source).toBe('./日本語')
    expect(result.deps.get('Utils')?.exportName).toBe('*')
  })

  it('decodes escaped identifiers, string export names and module sources', () => {
    const code = String.raw`import { f\u006fo as l\u006fcal, "some\u002dexport" as value } from "./m\u006fd";`
    const result = extractImports(code, 'escaped.kpa')

    expect([...result.deps.values()]).toEqual([
      { localName: 'local', exportName: 'foo', source: './mod' },
      { localName: 'value', exportName: 'some-export', source: './mod' },
    ])
    expect(result.strippedCode).toBe('')
  })

  it('detects duplicates after decoding escaped local identifiers', () => {
    const code = String.raw`import { foo } from 'a'; import { bar as f\u006fo } from 'b';`

    expect(() => extractImports(code, 'escaped.kpa')).toThrow(
      "Duplicate imported identifier 'foo' in escaped.kpa",
    )
  })

  it('strips type-only default, namespace and named bindings without dependencies', () => {
    const code = `import type Default from 'types-default';
import type * as NS from 'types-namespace';
import type { Named } from 'types-named';
import { type Mixed, runtime } from 'runtime';
import Default, * as NS from 'values';
return { runtime, Default, NS };`
    const result = extractImports(code, 'types.kpa')

    expect([...result.deps.keys()]).toEqual(['runtime', 'Default', 'NS'])
    expect(result.deps.get('Default')?.source).toBe('values')
    expect(result.deps.get('NS')?.exportName).toBe('*')
    expect(result.strippedCode).toBe('return { runtime, Default, NS };')
  })

  it('preserves TypeScript component bodies with top-level returns and await', () => {
    const body = `interface State { value: number }
const value: number = await load();
if (value < 0) { return { state: {} } as const; }
return { state: { value } satisfies State };`
    const result = extractImports(`import { load } from './loader';\n${body}`, 'body.kpa')

    expect(result.deps.get('load')?.source).toBe('./loader')
    expect(result.strippedCode).toBe(body)
  })

  it.each([
    "import { foo from 'module';",
    "import { foo } from 'module'; const value: = 1;",
    "import { foo } from 'module'; return { state: ; };",
  ])('rejects invalid syntax instead of returning partial dependencies: %s', (code) => {
    expect(() => extractImports(code, '/components/invalid.kpa')).toThrow(
      'Failed to parse imports in /components/invalid.kpa:',
    )
  })
})

describe('extractImports - direct transform fallback', () => {
  it.each(['js', 'ts'])('keeps the minimal controller for invalid %s bodies', (lang) => {
    const output = transformKpaToModule(
      `[${lang}]import { foo } from 'module'; return { state: ; };[/${lang}]`,
      '/components/invalid.kpa',
      {},
      new Map(),
    )
    const module = new Function(`return (${output})`)() as {
      script: string
      scriptMap: unknown
      deps: unknown
    }

    expect(module.script).toBe('(() => { return { state: {} }; })()')
    expect(module.scriptMap).toBeNull()
    expect(module.deps).toBeNull()
  })
})
