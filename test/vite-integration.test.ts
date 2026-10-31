import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { build, createServer } from 'vite'
import koppajsVitePlugin from '../src/index'
import { MODULE_CONTRACT_VERSION } from '../src/module-contract'

function createFixture() {
  const root = mkdtempSync(path.join(tmpdir(), 'koppajs-vite-integration-'))
  writeFileSync(path.join(root, 'dependency.ts'), 'export const initial = 42;')
  writeFileSync(
    path.join(root, 'counter.kpa'),
    `[template]<test-counter>{{ count }}</test-counter>[/template]
[ts]
import { initial } from './dependency.ts';
let count: number = initial;
function increment(): void { count++; }
[/ts]
[scss]$color: red; test-counter { color: $color; }[/scss]`,
  )
  return root
}

describe('real Vite host compatibility', () => {
  it.each(['js', 'ts'])(
    'preserves the invalid %s script fallback through Vite',
    async (language) => {
      const root = createFixture()
      writeFileSync(
        path.join(root, 'broken.kpa'),
        `[${language}]const broken = ;[/${language}]`,
      )
      const server = await createServer({
        root,
        configFile: false,
        logLevel: 'silent',
        plugins: [koppajsVitePlugin({ tsconfigFile: undefined })],
        server: { middlewareMode: true, watch: null },
      })
      try {
        const { default: component } = await server.ssrLoadModule('/broken.kpa')
        expect(new Function(`return ${component.script}`)()).toEqual({ state: {} })
        expect(component.deps).toBeNull()
      } finally {
        await server.close()
        rmSync(root, { recursive: true, force: true })
      }
    },
  )

  it('loads TypeScript, SCSS and relative dependencies through the dev server', async () => {
    const root = createFixture()
    const server = await createServer({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: [koppajsVitePlugin({ tsconfigFile: undefined })],
      server: { middlewareMode: true, watch: null },
    })
    try {
      const transformed = await server.transformRequest('/counter.kpa')
      expect(transformed?.code).toContain('export default')
      const { default: component } = await server.ssrLoadModule('/counter.kpa')
      expect(component.contractVersion).toBe(MODULE_CONTRACT_VERSION)
      expect(component.template).toContain('data-k-struct')
      expect(component.style).toContain('color: red')
      expect(component.script).not.toContain(': number')
      expect(component.script).toContain('increment')
      expect(component.scriptMap).toBeTypeOf('object')
      expect(component.structAttr).toBe('data-k-struct')
      expect(await component.deps.initial()).toBe(42)
    } finally {
      await server.close()
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('builds a production module without losing the emitted contract', async () => {
    const root = createFixture()
    try {
      const result = await build({
        root,
        configFile: false,
        logLevel: 'silent',
        plugins: [koppajsVitePlugin({ tsconfigFile: undefined })],
        build: {
          write: false,
          minify: false,
          lib: { entry: path.join(root, 'counter.kpa'), formats: ['es'] },
        },
      })
      const outputs = Array.isArray(result) ? result : [result]
      const code = outputs
        .flatMap((output) =>
          'output' in output
            ? output.output.flatMap((chunk) =>
                chunk.type === 'chunk' ? [chunk.code] : [],
              )
            : [],
        )
        .join('\n')
      expect(code).toContain('contractVersion')
      expect(code).toContain('data-k-struct')
      expect(code).toContain('color: red')
      expect(code).toContain('increment')
      const script = code.match(/script:\s*("(?:[^"\\]|\\.)*")/)
      expect(script).not.toBeNull()
      expect(JSON.parse(script![1])).not.toContain(': number')
      expect(code).toContain('42')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
