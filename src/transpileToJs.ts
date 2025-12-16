import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const commentRegExp =
  /(?<!:)\/\/[^\n]*|\/\*[\s\S]*?(?<!\*\/)\*\/|(["'`])(?:\\\1|(?!\1).)*?\1/g

function transpileToJs(tsCode: string, tsconfigPath?: string): string {
  let compilerOptions = {}

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

    compilerOptions = tsConfig.compilerOptions
  } else {
    compilerOptions = {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
    }
  }

  const result = ts.transpileModule(tsCode, { compilerOptions })

  return result.outputText
}

export default transpileToJs
