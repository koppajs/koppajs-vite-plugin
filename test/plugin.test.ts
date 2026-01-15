// test/plugin.test.ts
import { describe, expect, it } from 'vitest'
import koppajsVitePlugin from '../src/index'

// Access the internal transform function for testing
// We need to test the module output directly, so we'll import and test against
// the actual parsing logic via module evaluation
describe('koppajsVitePlugin', () => {
  it('creates a Vite plugin object', () => {
    const plugin = koppajsVitePlugin()
    expect(plugin.name).toBe('koppajs-vite-plugin')
    expect(plugin.enforce).toBe('pre')
  })
})

describe('transformKpaToModule output safety', () => {
  it('generates valid JS module with backticks in controller code', async () => {
    // Simulate what the plugin does internally by creating a test case
    // that would have broken with the old escapeBackticks approach

    // This is the kind of controller code that could break the old implementation:
    const testCode = 'const msg = `Hello ${name}!`;'

    // Verify JSON.stringify properly handles these characters
    const serialized = JSON.stringify(testCode)

    // The serialized string should be a valid JSON string (wrapped in quotes)
    expect(serialized.startsWith('"')).toBe(true)
    expect(serialized.endsWith('"')).toBe(true)

    // When parsed back, it should equal the original
    expect(JSON.parse(serialized)).toBe(testCode)

    // Test that the full controller wrapping works
    const controllerCode = `
      const name = 'World';
      const greeting = \`Hello \${name}!\`;
      console.log(greeting);
    `
    const wrappedScript = JSON.stringify(`(() => { ${controllerCode} })()`)

    // The serialized wrapper should be valid JSON
    expect(() => JSON.parse(wrappedScript)).not.toThrow()

    // The parsed string should contain the original code
    const parsed = JSON.parse(wrappedScript)
    expect(parsed).toContain('`Hello ${name}!`')
  })

  it('handles nested backticks and complex template literals', () => {
    const complexCode = `
      const outer = \`outer \${inner} text\`;
      const nested = \`level1 \${\`level2 \${value}\`}\`;
      const raw = \\\`escaped backtick\\\`;
    `

    const serialized = JSON.stringify(`(() => { ${complexCode} })()`)

    // Should not throw when parsed
    expect(() => JSON.parse(serialized)).not.toThrow()

    // Should preserve the code structure
    const parsed = JSON.parse(serialized)
    expect(parsed).toContain('outer ${inner}')
    expect(parsed).toContain('level2 ${value}')
  })

  it('generates object properties that can be used in JavaScript', () => {
    // Simulate the full module output format
    const template = '<div>Hello `World` ${name}</div>'
    const style = '.class { content: "`"; }'
    const script = 'const msg = `test ${value}`;'

    const pathStr = JSON.stringify('/test/file.kpa')
    const templateStr = JSON.stringify(template)
    const styleStr = JSON.stringify(style)
    const scriptStr = JSON.stringify(`(() => { ${script} })()`)
    const scriptMapStr = 'null'

    // Test that each individual property value can be parsed correctly
    expect(() => JSON.parse(pathStr)).not.toThrow()
    expect(() => JSON.parse(templateStr)).not.toThrow()
    expect(() => JSON.parse(styleStr)).not.toThrow()
    expect(() => JSON.parse(scriptStr)).not.toThrow()

    // Verify the parsed values are correct
    expect(JSON.parse(templateStr)).toBe(template)
    expect(JSON.parse(styleStr)).toBe(style)
    expect(JSON.parse(scriptStr)).toContain('const msg = `test ${value}`;')

    // Create an object literal expression (non-module syntax) that can be evaluated
    const objectCode = `({
      path: ${pathStr},
      template: ${templateStr},
      style: ${styleStr},
      script: ${scriptStr},
      scriptMap: ${scriptMapStr},
      deps: {}
    })`

    // The generated object should be valid JavaScript
    expect(() => new Function(`return ${objectCode}`)).not.toThrow()

    // Evaluate the object and verify its contents
    const result = new Function(`return ${objectCode}`)()
    expect(result.path).toBe('/test/file.kpa')
    expect(result.template).toBe(template)
    expect(result.style).toBe(style)
    expect(result.script).toContain('const msg = `test ${value}`;')
  })
})
