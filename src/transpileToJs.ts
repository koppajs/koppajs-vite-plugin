import path from 'node:path'
import { transformSync } from 'esbuild'
import { parseTsconfig } from 'get-tsconfig'

export type JsTranspileResult = {
  code: string
  map?: unknown
}

function stripSourceMapComments(code: string): string {
  return code
    .replace(/^\s*\/\/#\s*sourceMappingURL=.*$/gm, '')
    .replace(/^\s*\/\/#\s*sourceURL=.*$/gm, '')
}

function transpileToJs(tsCode: string, tsconfigPath?: string): JsTranspileResult {
  const config = tsconfigPath ? parseTsconfig(path.resolve(tsconfigPath)) : undefined
  const configuredTarget = config?.compilerOptions?.target?.toLowerCase()
  const target = configuredTarget === 'es6' ? 'es2015' : (configuredTarget ?? 'esnext')
  if (target === 'es3' || target === 'es5') {
    throw new Error(`Unsupported component target '${target}': use ES2015 or newer`)
  }
  if (config?.compilerOptions?.emitDecoratorMetadata) {
    throw new Error('Component transpilation does not support emitDecoratorMetadata')
  }

  // Component scripts are function bodies, not standalone modules. Leave the
  // output format unset so legacy top-level returns do not gain a module wrapper.
  const result = transformSync(tsCode, {
    loader: 'ts',
    sourcefile: 'module.ts',
    target,
    tsconfigRaw: config,
    sourcemap: 'external',
    sourcesContent: true,
    logLevel: 'silent',
  })

  for (const warning of result.warnings) {
    console.warn(`[koppajs-vite-plugin] module.ts: ${warning.text}`)
  }

  return {
    code: stripSourceMapComments(result.code),
    map: result.map ? JSON.parse(result.map) : undefined,
  }
}

export default transpileToJs
