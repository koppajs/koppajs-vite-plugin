/**
 * Integration Contract Test: koppajs-vite-plugin ↔ koppajs-core
 *
 * This test guarantees that the plugin-emitted module structure remains
 * compatible with what the koppajs-core runtime expects.
 *
 * The contract is defined by:
 * 1. Core's ComponentSource interface (types.ts)
 * 2. Core's isComponentSource type guard (utils/type-guards.ts)
 * 3. Plugin's KoppaModule interface (module-contract.ts)
 *
 * If this test fails, it indicates drift between plugin output and core expectations.
 */

import { describe, it, expect } from 'vitest'
import { transformKpaToModule } from '../src/index'
import { MODULE_CONTRACT_VERSION } from '../src/module-contract'
import { STRUCT_ATTR } from '../src/utils/identityConstants'

/* -------------------------------------------------------------------------- */
/*  Test Utilities                                                            */
/* -------------------------------------------------------------------------- */

const pluginOptions = {}
const resolvedDeps = new Map()

/**
 * Safely evaluates the plugin output to extract the default-exported object.
 * The plugin emits a JS object literal (not wrapped in `export default`),
 * so we can evaluate it directly using Function constructor.
 *
 * This approach:
 * - Avoids eval() which has stricter CSP restrictions
 * - Runs in an isolated scope (no access to test globals)
 * - Is deterministic (no async, no side effects)
 */
function extractModuleObject(pluginOutput: string): unknown {
  // The plugin output is a plain object literal, not an ES module
  // We wrap it in a return statement to extract the value
  return new Function(`return ${pluginOutput}`)()
}

/* -------------------------------------------------------------------------- */
/*  Core Contract Type Guard (mirrored from koppajs-core)                     */
/* -------------------------------------------------------------------------- */

/**
 * Mirrors the isComponentSource type guard from koppajs-core.
 * This is the minimum contract the core runtime expects.
 *
 * Source: koppajs-core/src/utils/type-guards.ts
 */
function isValidComponentSource(ext: unknown): boolean {
  if (ext == null || typeof ext !== 'object') return false
  const obj = ext as Record<string, unknown>
  return (
    typeof obj.template === 'string' &&
    typeof obj.script === 'string' &&
    typeof obj.style === 'string'
  )
}

/**
 * Extended contract validation that covers optional fields.
 * This validates the full runtime contract as documented in ComponentSource.
 *
 * Source: koppajs-core/src/types.ts ComponentSource interface
 */
function validateFullRuntimeContract(obj: Record<string, unknown>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (obj.contractVersion !== MODULE_CONTRACT_VERSION) {
    errors.push(
      `contractVersion: expected ${MODULE_CONTRACT_VERSION}, got ${JSON.stringify(obj.contractVersion)}`,
    )
  }
  if (typeof obj.path !== 'string') {
    errors.push(`path: expected string, got ${typeof obj.path}`)
  }

  // Required fields (strings)
  if (typeof obj.template !== 'string') {
    errors.push(`template: expected string, got ${typeof obj.template}`)
  }
  if (typeof obj.script !== 'string') {
    errors.push(`script: expected string, got ${typeof obj.script}`)
  }
  if (typeof obj.style !== 'string') {
    errors.push(`style: expected string, got ${typeof obj.style}`)
  }

  // scriptMap: null or object (NOT a string-only assumption)
  if (obj.scriptMap !== null && obj.scriptMap !== undefined) {
    if (typeof obj.scriptMap !== 'object') {
      errors.push(`scriptMap: expected null or object, got ${typeof obj.scriptMap}`)
    }
  }

  // deps: null or object with function values (NOT a string-only assumption)
  if (obj.deps !== null && obj.deps !== undefined) {
    if (typeof obj.deps !== 'object' || Array.isArray(obj.deps)) {
      errors.push(
        `deps: expected null or object, got ${Array.isArray(obj.deps) ? 'array' : typeof obj.deps}`,
      )
    } else {
      // Validate all values are functions
      for (const [key, value] of Object.entries(obj.deps as Record<string, unknown>)) {
        if (typeof value !== 'function') {
          errors.push(`deps.${key}: expected function, got ${typeof value}`)
        }
      }
    }
  }

  // structAttr: string (matches the constant)
  if (obj.structAttr !== undefined) {
    if (typeof obj.structAttr !== 'string') {
      errors.push(`structAttr: expected string, got ${typeof obj.structAttr}`)
    }
  }

  // type: undefined or one of "options" | "composite"
  if (obj.type !== undefined) {
    if (typeof obj.type !== 'string' || !['options', 'composite'].includes(obj.type)) {
      errors.push(
        `type: expected undefined, "options", or "composite", got ${JSON.stringify(obj.type)}`,
      )
    }
  }

  return { valid: errors.length === 0, errors }
}

/* -------------------------------------------------------------------------- */
/*  Test Cases: Core Integration Contract                                     */
/* -------------------------------------------------------------------------- */

describe('Core Integration Contract: Plugin output ↔ Core ComponentSource', () => {
  describe('Minimal valid .kpa input', () => {
    const minimalKpa = '[template]<div></div>[/template][js]{}[/js][css].a{}[/css]'
    const id = '/test/minimal.kpa'

    it('passes core isComponentSource type guard', () => {
      const output = transformKpaToModule(minimalKpa, id, pluginOptions, resolvedDeps)
      const obj = extractModuleObject(output)
      expect(isValidComponentSource(obj)).toBe(true)
    })

    it('passes full runtime contract validation', () => {
      const output = transformKpaToModule(minimalKpa, id, pluginOptions, resolvedDeps)
      const obj = extractModuleObject(output) as Record<string, unknown>
      const result = validateFullRuntimeContract(obj)
      expect(result.errors).toEqual([])
      expect(result.valid).toBe(true)
    })

    it('has template, script, style as strings', () => {
      const output = transformKpaToModule(minimalKpa, id, pluginOptions, resolvedDeps)
      const obj = extractModuleObject(output) as Record<string, unknown>
      expect(obj.contractVersion).toBe(MODULE_CONTRACT_VERSION)
      expect(obj.path).toBe(id)
      expect(typeof obj.template).toBe('string')
      expect(typeof obj.script).toBe('string')
      expect(typeof obj.style).toBe('string')
    })

    it('has deps as null or object of functions', () => {
      const output = transformKpaToModule(minimalKpa, id, pluginOptions, resolvedDeps)
      const obj = extractModuleObject(output) as Record<string, unknown>
      expect(
        obj.deps === null ||
          (typeof obj.deps === 'object' &&
            !Array.isArray(obj.deps) &&
            Object.values(obj.deps as Record<string, unknown>).every(
              (v) => typeof v === 'function',
            )),
      ).toBe(true)
    })

    it('has structAttr matching the constant', () => {
      const output = transformKpaToModule(minimalKpa, id, pluginOptions, resolvedDeps)
      const obj = extractModuleObject(output) as Record<string, unknown>
      expect(obj.structAttr).toBe(STRUCT_ATTR)
    })

    it('has scriptMap as null or object (NOT a string)', () => {
      const output = transformKpaToModule(minimalKpa, id, pluginOptions, resolvedDeps)
      const obj = extractModuleObject(output) as Record<string, unknown>
      expect(obj.scriptMap === null || typeof obj.scriptMap === 'object').toBe(true)
      expect(typeof obj.scriptMap).not.toBe('string')
    })

    it('normalizes the emitted source path', () => {
      const windowsId = 'C:\\repo\\src\\minimal.kpa'
      const output = transformKpaToModule(
        minimalKpa,
        windowsId,
        pluginOptions,
        resolvedDeps,
      )
      const obj = extractModuleObject(output) as Record<string, unknown>
      expect(obj.path).toBe('C:/repo/src/minimal.kpa')
    })
  })

  describe('Representative .kpa with template + script + style', () => {
    const representativeKpa = `
[template]
<div class="counter">
  <span data-ref="count">0</span>
  <button data-ref="increment">+</button>
</div>
[/template]

[js]
let count = 0;

function increment() {
  count++;
}
[/js]

[css]
.counter {
  display: flex;
  gap: 8px;
}
.counter button {
  padding: 4px 8px;
}
[/css]
`
    const id = '/components/counter.kpa'

    it('passes core isComponentSource type guard', () => {
      const output = transformKpaToModule(
        representativeKpa,
        id,
        pluginOptions,
        resolvedDeps,
      )
      const obj = extractModuleObject(output)
      expect(isValidComponentSource(obj)).toBe(true)
    })

    it('passes full runtime contract validation', () => {
      const output = transformKpaToModule(
        representativeKpa,
        id,
        pluginOptions,
        resolvedDeps,
      )
      const obj = extractModuleObject(output) as Record<string, unknown>
      const result = validateFullRuntimeContract(obj)
      expect(result.errors).toEqual([])
      expect(result.valid).toBe(true)
    })

    it('preserves template content structure', () => {
      const output = transformKpaToModule(
        representativeKpa,
        id,
        pluginOptions,
        resolvedDeps,
      )
      const obj = extractModuleObject(output) as Record<string, unknown>
      expect(obj.template).toContain('class="counter"')
      expect(obj.template).toContain('data-ref="count"')
      expect(obj.template).toContain('data-ref="increment"')
    })

    it('preserves style content', () => {
      const output = transformKpaToModule(
        representativeKpa,
        id,
        pluginOptions,
        resolvedDeps,
      )
      const obj = extractModuleObject(output) as Record<string, unknown>
      expect(obj.style).toContain('.counter')
      expect(obj.style).toContain('display: flex')
    })

    it('generates valid script controller', () => {
      const output = transformKpaToModule(
        representativeKpa,
        id,
        pluginOptions,
        resolvedDeps,
      )
      const obj = extractModuleObject(output) as Record<string, unknown>
      // Script should be an IIFE string that returns component definition
      expect(obj.script).toContain('(() => {')
      expect(obj.script).toContain('return')
    })
  })

  describe('Edge case: Empty or missing blocks', () => {
    it('handles empty template', () => {
      const kpa = '[template][/template][js]{}[/js][css][/css]'
      const output = transformKpaToModule(
        kpa,
        '/test/empty.kpa',
        pluginOptions,
        resolvedDeps,
      )
      const obj = extractModuleObject(output) as Record<string, unknown>
      expect(isValidComponentSource(obj)).toBe(true)
      expect(obj.template).toBe('')
    })

    it('handles empty style', () => {
      const kpa = '[template]<div></div>[/template][js]{}[/js][css][/css]'
      const output = transformKpaToModule(
        kpa,
        '/test/no-style.kpa',
        pluginOptions,
        resolvedDeps,
      )
      const obj = extractModuleObject(output) as Record<string, unknown>
      expect(isValidComponentSource(obj)).toBe(true)
      expect(obj.style).toBe('')
    })

    it('handles minimal script (empty object)', () => {
      const kpa = '[template]<div></div>[/template][js]{}[/js][css][/css]'
      const output = transformKpaToModule(
        kpa,
        '/test/minimal-script.kpa',
        pluginOptions,
        resolvedDeps,
      )
      const obj = extractModuleObject(output) as Record<string, unknown>
      expect(isValidComponentSource(obj)).toBe(true)
      expect(typeof obj.script).toBe('string')
    })
  })

  describe('Contract field type assertions', () => {
    const kpa = '[template]<div></div>[/template][js]{}[/js][css].a{}[/css]'
    const id = '/test/types.kpa'

    it('template is never null or undefined', () => {
      const output = transformKpaToModule(kpa, id, pluginOptions, resolvedDeps)
      const obj = extractModuleObject(output) as Record<string, unknown>
      expect(obj.template).not.toBeNull()
      expect(obj.template).not.toBeUndefined()
    })

    it('script is never null or undefined', () => {
      const output = transformKpaToModule(kpa, id, pluginOptions, resolvedDeps)
      const obj = extractModuleObject(output) as Record<string, unknown>
      expect(obj.script).not.toBeNull()
      expect(obj.script).not.toBeUndefined()
    })

    it('style is never null or undefined', () => {
      const output = transformKpaToModule(kpa, id, pluginOptions, resolvedDeps)
      const obj = extractModuleObject(output) as Record<string, unknown>
      expect(obj.style).not.toBeNull()
      expect(obj.style).not.toBeUndefined()
    })

    it('structAttr is always the expected constant string', () => {
      const output = transformKpaToModule(kpa, id, pluginOptions, resolvedDeps)
      const obj = extractModuleObject(output) as Record<string, unknown>
      expect(obj.structAttr).toBe(STRUCT_ATTR)
      expect(obj.structAttr).toBe('data-k-struct')
    })

    it('deps follows the contract: null or Record<string, () => Promise<unknown>>', () => {
      const output = transformKpaToModule(kpa, id, pluginOptions, resolvedDeps)
      const obj = extractModuleObject(output) as Record<string, unknown>

      // Must be null or an object
      const isNullOrObject = obj.deps === null || typeof obj.deps === 'object'
      expect(isNullOrObject).toBe(true)

      // If object, must not be array
      if (obj.deps !== null) {
        expect(Array.isArray(obj.deps)).toBe(false)
        // All values must be functions
        for (const value of Object.values(obj.deps as Record<string, unknown>)) {
          expect(typeof value).toBe('function')
        }
      }
    })

    it('scriptMap follows the contract: null or object (sourcemap)', () => {
      const output = transformKpaToModule(kpa, id, pluginOptions, resolvedDeps)
      const obj = extractModuleObject(output) as Record<string, unknown>

      // Must be null or an object (sourcemap structure)
      const isNullOrObject = obj.scriptMap === null || typeof obj.scriptMap === 'object'
      expect(isNullOrObject).toBe(true)

      // Must NOT be a string
      expect(typeof obj.scriptMap).not.toBe('string')
    })
  })
})

describe('Determinism: Plugin output is reproducible', () => {
  it('produces identical output for identical input', () => {
    const kpa = '[template]<div>Hello</div>[/template][js]let x = 1;[/js][css].a{}[/css]'
    const id = '/test/determinism.kpa'

    const output1 = transformKpaToModule(kpa, id, pluginOptions, resolvedDeps)
    const output2 = transformKpaToModule(kpa, id, pluginOptions, resolvedDeps)

    expect(output1).toBe(output2)
  })

  it('object structure is identical across multiple evaluations', () => {
    const kpa = '[template]<div>Hello</div>[/template][js]let x = 1;[/js][css].a{}[/css]'
    const id = '/test/determinism-obj.kpa'

    const output = transformKpaToModule(kpa, id, pluginOptions, resolvedDeps)
    const obj1 = extractModuleObject(output) as Record<string, unknown>
    const obj2 = extractModuleObject(output) as Record<string, unknown>

    expect(obj1.template).toBe(obj2.template)
    expect(obj1.script).toBe(obj2.script)
    expect(obj1.style).toBe(obj2.style)
    expect(obj1.structAttr).toBe(obj2.structAttr)
  })
})
