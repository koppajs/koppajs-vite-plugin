// test/extractImports.test.ts
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  extractImports,
  generateDepsCode,
  type ResolvedImportInfo,
} from '../src/utils/extractImports'

describe('extractImports', () => {
  describe('named imports', () => {
    it('extracts a single named import', () => {
      const code = `import { foo } from 'some-module'\nconst x = foo()`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(1)
      expect(result.deps.get('foo')).toEqual({
        localName: 'foo',
        exportName: 'foo',
        source: 'some-module',
      })
      expect(result.strippedCode).not.toContain('import')
      expect(result.strippedCode).toContain('const x = foo()')
    })

    it('extracts multiple named imports from the same module', () => {
      const code = `import { foo, bar, baz } from 'some-module'\nconsole.log(foo, bar, baz)`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(3)
      expect(result.deps.has('foo')).toBe(true)
      expect(result.deps.has('bar')).toBe(true)
      expect(result.deps.has('baz')).toBe(true)
    })

    it('handles aliased imports correctly', () => {
      const code = `import { originalName as aliasName } from 'some-module'`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(1)
      expect(result.deps.get('aliasName')).toEqual({
        localName: 'aliasName',
        exportName: 'originalName',
        source: 'some-module',
      })
    })

    it('extracts imports from multiple modules', () => {
      const code = `
import { foo } from 'module-a'
import { bar } from 'module-b'
const x = foo() + bar()
`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(2)
      expect(result.deps.get('foo')?.source).toBe('module-a')
      expect(result.deps.get('bar')?.source).toBe('module-b')
    })
  })

  describe('default imports', () => {
    it('extracts a default import', () => {
      const code = `import DefaultExport from 'some-module'`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(1)
      expect(result.deps.get('DefaultExport')).toEqual({
        localName: 'DefaultExport',
        exportName: 'default',
        source: 'some-module',
      })
    })

    it('extracts default + named imports together', () => {
      const code = `import Default, { named1, named2 } from 'some-module'`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(3)
      expect(result.deps.get('Default')?.exportName).toBe('default')
      expect(result.deps.get('named1')?.exportName).toBe('named1')
      expect(result.deps.get('named2')?.exportName).toBe('named2')
    })
  })

  describe('namespace imports', () => {
    it('extracts namespace imports', () => {
      const code = `import * as Utils from 'utils-module'`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(1)
      expect(result.deps.get('Utils')).toEqual({
        localName: 'Utils',
        exportName: '*',
        source: 'utils-module',
      })
    })
  })

  describe('side-effect imports', () => {
    it('removes side-effect imports without adding to deps', () => {
      const code = `
import 'polyfill'
import { foo } from 'some-module'
`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(1)
      expect(result.deps.has('foo')).toBe(true)
      expect(result.strippedCode).not.toContain('import')
    })
  })

  describe('duplicate detection', () => {
    it('throws on duplicate identifier from different modules', () => {
      const code = `
import { foo } from 'module-a'
import { foo } from 'module-b'
`
      expect(() => extractImports(code, 'test.kpa')).toThrow(
        "Duplicate imported identifier 'foo' in test.kpa",
      )
    })

    it('throws on duplicate identifier from the same module', () => {
      const code = `
import { foo } from 'module-a'
import { bar as foo } from 'module-a'
`
      expect(() => extractImports(code, 'test.kpa')).toThrow(
        "Duplicate imported identifier 'foo' in test.kpa",
      )
    })

    it('throws on duplicate default import', () => {
      const code = `
import Foo from 'module-a'
import Foo from 'module-b'
`
      expect(() => extractImports(code, 'test.kpa')).toThrow(
        "Duplicate imported identifier 'Foo' in test.kpa",
      )
    })

    it('throws when named import conflicts with default', () => {
      const code = `
import Foo from 'module-a'
import { Foo } from 'module-b'
`
      expect(() => extractImports(code, 'test.kpa')).toThrow(
        "Duplicate imported identifier 'Foo' in test.kpa",
      )
    })

    it('includes file path in error message', () => {
      const code = `import { x } from 'a'\nimport { x } from 'b'`
      expect(() => extractImports(code, '/path/to/component.kpa')).toThrow(
        "Duplicate imported identifier 'x' in /path/to/component.kpa",
      )
    })
  })

  describe('code stripping', () => {
    it('preserves non-import code exactly', () => {
      const code = `import { foo } from 'module'

const x = 1
function bar() {
  return foo(x)
}
`
      const result = extractImports(code, 'test.kpa')

      expect(result.strippedCode).toContain('const x = 1')
      expect(result.strippedCode).toContain('function bar()')
      expect(result.strippedCode).toContain('return foo(x)')
    })

    it('handles TypeScript code correctly', () => {
      const code = `
import { SomeType } from 'types'
import { someFunc } from 'utils'

interface MyInterface {
  value: SomeType
}

const result: MyInterface = { value: someFunc() }
`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(2)
      expect(result.strippedCode).toContain('interface MyInterface')
      expect(result.strippedCode).not.toContain('import')
    })

    it('handles empty script block', () => {
      const code = ''
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(0)
      expect(result.strippedCode).toBe('')
    })

    it('handles code with no imports', () => {
      const code = `const x = 1\nconst y = 2`
      const result = extractImports(code, 'test.kpa')

      expect(result.deps.size).toBe(0)
      expect(result.strippedCode).toBe(code)
    })
  })
})

describe('generateDepsCode', () => {
  it('returns null for empty deps', () => {
    const deps = new Map<string, ResolvedImportInfo>()
    expect(generateDepsCode(deps)).toBe('null')
  })

  it('generates correct code for named imports', () => {
    const deps = new Map<string, ResolvedImportInfo>([
      [
        'foo',
        {
          localName: 'foo',
          exportName: 'foo',
          source: 'some-module',
          resolvedPath: 'some-module',
        },
      ],
    ])

    const result = generateDepsCode(deps)
    expect(result).toContain("foo: () => import('some-module').then(m => m['foo'])")
  })

  it('generates correct code for default imports', () => {
    const deps = new Map<string, ResolvedImportInfo>([
      [
        'Default',
        {
          localName: 'Default',
          exportName: 'default',
          source: 'some-module',
          resolvedPath: 'some-module',
        },
      ],
    ])

    const result = generateDepsCode(deps)
    expect(result).toContain(
      "Default: () => import('some-module').then(m => m['default'])",
    )
  })

  it('generates correct code for namespace imports', () => {
    const deps = new Map<string, ResolvedImportInfo>([
      [
        'Utils',
        {
          localName: 'Utils',
          exportName: '*',
          source: 'utils-module',
          resolvedPath: 'utils-module',
        },
      ],
    ])

    const result = generateDepsCode(deps)
    expect(result).toContain("Utils: () => import('utils-module')")
    expect(result).not.toContain('.then')
  })

  it('generates correct code for multiple deps', () => {
    const deps = new Map<string, ResolvedImportInfo>([
      [
        'foo',
        {
          localName: 'foo',
          exportName: 'foo',
          source: 'module-a',
          resolvedPath: 'module-a',
        },
      ],
      [
        'bar',
        {
          localName: 'bar',
          exportName: 'bar',
          source: 'module-b',
          resolvedPath: 'module-b',
        },
      ],
    ])

    const result = generateDepsCode(deps)
    expect(result).toContain("foo: () => import('module-a').then(m => m['foo'])")
    expect(result).toContain("bar: () => import('module-b').then(m => m['bar'])")
    expect(result.startsWith('{')).toBe(true)
    expect(result.endsWith('}')).toBe(true)
  })

  it('handles aliased imports with correct export name', () => {
    const deps = new Map<string, ResolvedImportInfo>([
      [
        'aliasName',
        {
          localName: 'aliasName',
          exportName: 'originalName',
          source: 'module',
          resolvedPath: 'module',
        },
      ],
    ])

    const result = generateDepsCode(deps)
    expect(result).toContain(
      "aliasName: () => import('module').then(m => m['originalName'])",
    )
  })
})

describe('generateDepsCode - resolved import paths', () => {
  // These tests verify that generateDepsCode uses the pre-resolved paths
  // The actual resolution is done by Vite's resolver in the plugin

  it('uses resolved root-relative path from Vite resolver', () => {
    // Simulates a resolved relative import (../docs/nav -> /src/demos/docs/nav)
    const deps = new Map<string, ResolvedImportInfo>([
      [
        'DOC_NAV',
        {
          localName: 'DOC_NAV',
          exportName: 'DOC_NAV',
          source: '../docs/nav',
          resolvedPath: '/src/demos/docs/nav',
        },
      ],
    ])

    const result = generateDepsCode(deps)
    expect(result).toContain(
      "DOC_NAV: () => import('/src/demos/docs/nav').then(m => m['DOC_NAV'])",
    )
  })

  it('uses resolved ./ relative imports', () => {
    const deps = new Map<string, ResolvedImportInfo>([
      [
        'helper',
        {
          localName: 'helper',
          exportName: 'helper',
          source: './utils',
          resolvedPath: '/src/components/utils',
        },
      ],
    ])

    const result = generateDepsCode(deps)
    expect(result).toContain(
      "helper: () => import('/src/components/utils').then(m => m['helper'])",
    )
  })

  it('uses resolved deeply nested relative imports', () => {
    const deps = new Map<string, ResolvedImportInfo>([
      [
        'shared',
        {
          localName: 'shared',
          exportName: 'default',
          source: '../../../shared/index',
          resolvedPath: '/src/shared/index',
        },
      ],
    ])

    const result = generateDepsCode(deps)
    expect(result).toContain(
      "shared: () => import('/src/shared/index').then(m => m['default'])",
    )
  })

  it('uses bare package imports unchanged', () => {
    const deps = new Map<string, ResolvedImportInfo>([
      [
        'lodash',
        {
          localName: 'lodash',
          exportName: 'default',
          source: 'lodash',
          resolvedPath: 'lodash',
        },
      ],
    ])

    const result = generateDepsCode(deps)
    expect(result).toContain("lodash: () => import('lodash').then(m => m['default'])")
  })

  it('uses root-relative imports unchanged', () => {
    const deps = new Map<string, ResolvedImportInfo>([
      [
        'config',
        {
          localName: 'config',
          exportName: 'config',
          source: '/src/config',
          resolvedPath: '/src/config',
        },
      ],
    ])

    const result = generateDepsCode(deps)
    expect(result).toContain("config: () => import('/src/config').then(m => m['config'])")
  })

  it('uses scoped package imports unchanged', () => {
    const deps = new Map<string, ResolvedImportInfo>([
      [
        'koppa',
        {
          localName: 'koppa',
          exportName: '*',
          source: '@koppajs/core',
          resolvedPath: '@koppajs/core',
        },
      ],
    ])

    const result = generateDepsCode(deps)
    expect(result).toContain("koppa: () => import('@koppajs/core')")
  })

  it('uses Vite alias resolved paths', () => {
    // Simulates a resolved alias import (~/docs/nav -> /src/docs/nav)
    const deps = new Map<string, ResolvedImportInfo>([
      [
        'Nav',
        {
          localName: 'Nav',
          exportName: 'Nav',
          source: '~/docs/nav',
          resolvedPath: '/src/docs/nav',
        },
      ],
    ])

    const result = generateDepsCode(deps)
    expect(result).toContain("Nav: () => import('/src/docs/nav').then(m => m['Nav'])")
  })

  it('preserves virtual module paths', () => {
    // Virtual modules should be kept as-is
    const deps = new Map<string, ResolvedImportInfo>([
      [
        'virtual',
        {
          localName: 'virtual',
          exportName: 'default',
          source: 'virtual:my-module',
          resolvedPath: 'virtual:my-module',
        },
      ],
    ])

    const result = generateDepsCode(deps)
    expect(result).toContain(
      "virtual: () => import('virtual:my-module').then(m => m['default'])",
    )
  })
})
