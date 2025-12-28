import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

export type JsTranspileResult = {
  code: string
  map?: unknown
}

const commentRegExp =
  /(?<!:)\/\/[^\n]*|\/\*[\s\S]*?(?<!\*\/)\*\/|(["'`])(?:\\\1|(?!\1).)*?\1/g

function stripSourceMapComments(code: string): string {
  return code
    .replace(/^\s*\/\/#\s*sourceMappingURL=.*$/gm, '')
    .replace(/^\s*\/\/#\s*sourceURL=.*$/gm, '')
}

function transpileToJs(tsCode: string, tsconfigPath?: string): JsTranspileResult {
  let compilerOptions: ts.CompilerOptions = {}

  if (typeof tsconfigPath === 'string') {
    const configFileContent = fs.readFileSync(path.resolve(tsconfigPath), {
      encoding: 'utf8',
    })

    const tsConfig = JSON.parse(
      configFileContent.replace(commentRegExp, (match: any) => {
        if (match.startsWith("'") || match.startsWith('"') || match.startsWith('`')) {
          return match
        }
        return ''
      }),
    )

    compilerOptions = tsConfig.compilerOptions ?? {}
  } else {
    compilerOptions = {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
    }
  }

  // Force sourcemap generation into result.sourceMapText (not via file comment)
  compilerOptions = {
    ...compilerOptions,
    sourceMap: true,
    inlineSourceMap: false,
    inlineSources: true,
  }

  const result = ts.transpileModule(tsCode, {
    compilerOptions,
    fileName: 'module.ts',
  })

  const clean = stripSourceMapComments(result.outputText)

  const map = result.sourceMapText ? JSON.parse(result.sourceMapText) : undefined

  return { code: clean, map }
}

export default transpileToJs
