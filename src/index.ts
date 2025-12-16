// src/index.ts

import { parse } from 'acorn'
import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

import transpileToCss from './transpileToCss.js'
import transpileToJs from './transpileToJs.js'

interface PluginOptions {
  tsconfigFile?: string
  // weitere Optionen später
}

const DEFAULT_PLUGIN_OPTIONS: PluginOptions = {
  tsconfigFile: 'tsconfig.json',
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function escapeBackticks(input: string): string {
  // wichtig: `${` → `$-{`, Core macht daraus später wieder `${`
  return input.replace(/`/g, '\\`').replace(/\$\{/g, '\\$-{')
}

function normalizePath(inputPath: string): string {
  return inputPath.replace(/\\/g, '/')
}

/* -------------------------------------------------------------------------- */
/*  Phase 1: .kpa → Blöcke (template/style/script)                            */
/* -------------------------------------------------------------------------- */

type ScriptLang = 'js' | 'ts'
type StyleLang = 'css' | 'scss' | 'sass'

interface ScriptBlock {
  lang: ScriptLang
  content: string
}

interface StyleBlock {
  lang: StyleLang
  content: string
}

interface ParsedKpa {
  template: string | null
  styles: StyleBlock[]
  script: ScriptBlock | null
}

function extractFirstBlock(
  code: string,
  tags: string,
): { tag: string; content: string } | null {
  const tagList = tags.split('|')
  for (const tag of tagList) {
    const regex = new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`, 'm')
    const match = regex.exec(code)
    if (match) {
      return { tag, content: match[1]?.trim() ?? '' }
    }
  }
  return null
}

function extractAllBlocks(
  code: string,
  tags: string,
): { tag: string; content: string }[] {
  const results: { tag: string; content: string }[] = []
  const tagList = tags.split('|')

  for (const tag of tagList) {
    const regex = new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`, 'g')
    let match: RegExpExecArray | null
    while ((match = regex.exec(code)) !== null) {
      results.push({ tag, content: match[1]?.trim() ?? '' })
    }
  }

  return results
}

function parseKpaSource(source: string): ParsedKpa {
  const templateBlock = extractFirstBlock(source, 'template')

  const styleBlocksRaw = extractAllBlocks(source, 'css|scss|sass')
  const styleBlocks: StyleBlock[] = styleBlocksRaw.map((b) => ({
    lang: b.tag as StyleLang,
    content: b.content,
  }))

  const scriptBlockRaw = extractFirstBlock(source, 'js|ts')
  const scriptBlock: ScriptBlock | null = scriptBlockRaw
    ? {
        lang: scriptBlockRaw.tag as ScriptLang,
        content: scriptBlockRaw.content,
      }
    : null

  return {
    template: templateBlock?.content ?? null,
    styles: styleBlocks,
    script: scriptBlock,
  }
}

/* -------------------------------------------------------------------------- */
/*  Phase 2: Composition-Analyse (Top-Level Variablen/Funktionen)             */
/* -------------------------------------------------------------------------- */

interface CompositionAnalysis {
  isComposition: boolean
  dataKeys: string[]
  methodKeys: string[]
}

function analyzeScriptForComposition(jsCode: string): CompositionAnalysis {
  const dataKeys = new Set<string>()
  const methodKeys = new Set<string>()
  let hasTopLevelReturn = false

  try {
    // Wir tun so, als wäre der Script-Block der Body einer async-Funktion.
    const wrapped = `async function __koppa_wrapper__() {\n${jsCode}\n}`
    const ast = parse(wrapped, {
      ecmaVersion: 'latest',
      sourceType: 'script',
    }) as any

    const func = ast.body[0]
    const body = func?.type === 'FunctionDeclaration' ? func.body.body : []

    for (const stmt of body) {
      switch (stmt.type) {
        case 'ReturnStatement':
          hasTopLevelReturn = true
          break
        case 'VariableDeclaration':
          for (const decl of stmt.declarations) {
            if (decl.id.type === 'Identifier') {
              dataKeys.add(decl.id.name)
            }
          }
          break
        case 'FunctionDeclaration':
          if (stmt.id?.name) {
            methodKeys.add(stmt.id.name)
          }
          break
      }
    }
  } catch {
    // Syntaxfehler → lieber Legacy-Mode als kaputtzaubern
    return { isComposition: false, dataKeys: [], methodKeys: [] }
  }

  const isComposition = !hasTopLevelReturn && (dataKeys.size > 0 || methodKeys.size > 0)

  return {
    isComposition,
    dataKeys: [...dataKeys],
    methodKeys: [...methodKeys],
  }
}

/* -------------------------------------------------------------------------- */
/*  Phase 3: Script transpilen + Controller bauen                             */
/* -------------------------------------------------------------------------- */

function transpileScriptBlock(
  script: ScriptBlock | null,
  options: PluginOptions,
): string {
  if (!script) {
    // Minimal-Controller, damit Core.createModel was zum Arbeiten hat
    return 'return { data: {} };'
  }

  // 1) TS → JS oder JS direkt
  let jsCode: string
  if (script.lang === 'ts') {
    const tsconfigPath = options.tsconfigFile
      ? path.resolve(globalThis.process.cwd(), options.tsconfigFile)
      : undefined
    jsCode = transpileToJs(script.content, tsconfigPath)
  } else {
    jsCode = script.content
  }

  // 2) Composition-Analyse
  const { isComposition, dataKeys, methodKeys } = analyzeScriptForComposition(jsCode)

  // Legacy-Mode: Entwickler kümmert sich selbst um `return { ... }`
  if (!isComposition) {
    return jsCode
  }

  // Composition-Mode: Top-Level Variablen/Funktionen → data/methods
  const propsLines: string[] = []

  if (dataKeys.length > 0) {
    propsLines.push(`  data: { ${dataKeys.join(', ')} }`)
  }

  if (methodKeys.length > 0) {
    propsLines.push(`  methods: { ${methodKeys.join(', ')} }`)
  }

  const propsObject = propsLines.length > 0 ? `{\n${propsLines.join(',\n')}\n}` : `{}`

  const jsWithReturn = `${jsCode}\n\nreturn ${propsObject};`

  return jsWithReturn
}

/* -------------------------------------------------------------------------- */
/*  Phase 4: Styles zusammenführen                                            */
/* -------------------------------------------------------------------------- */

function transpileStyleBlocks(styles: StyleBlock[]): string {
  if (!styles.length) return ''

  const cssParts: string[] = []

  for (const block of styles) {
    if (block.lang === 'css') {
      cssParts.push(block.content)
    } else {
      cssParts.push(transpileToCss(block.content, block.lang))
    }
  }

  return cssParts.join('\n\n')
}

/* -------------------------------------------------------------------------- */
/*  Phase 5: .kpa → ES-Modul (ComponentSource)                                */
/* -------------------------------------------------------------------------- */

function transformKpaToModule(code: string, id: string, options: PluginOptions): string {
  const parsed = parseKpaSource(code)

  const template = parsed.template ? escapeBackticks(parsed.template) : ''
  const style = escapeBackticks(transpileStyleBlocks(parsed.styles))
  const scriptBody = escapeBackticks(transpileScriptBlock(parsed.script, options))

  const newModule = `
    export default {
      path: \`${normalizePath(id)}\`,
      template: \`${template}\`,
      style: \`${style}\`,
      script: \`(() => { ${scriptBody || 'return { data: {} };'} })()\`
    };
  `.replace(/\/\/# sourceMappingURL=module\\.jsx\\.map/g, '')

  return newModule
}

/* -------------------------------------------------------------------------- */
/*  Vite-Plugin-Hülle                                                         */
/* -------------------------------------------------------------------------- */

export default function koppajsVitePlugin(config: PluginOptions = {}): Plugin {
  const pluginName = 'koppajs-vite-plugin'
  const options: PluginOptions = { ...DEFAULT_PLUGIN_OPTIONS, ...config }

  return {
    name: pluginName,
    enforce: 'pre',

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.endsWith('.kpa')) {
          res.setHeader('Content-Type', 'application/javascript')
        }
        next()
      })
    },

    resolveId(source, importer) {
      if (source.endsWith('.kpa') && importer) {
        const resolvedPath = normalizePath(path.resolve(path.dirname(importer), source))
        return resolvedPath
      }
      return null
    },

    load(id: string) {
      if (!id.endsWith('.kpa')) return null

      const code = fs.readFileSync(id, 'utf8')
      const moduleCode = transformKpaToModule(code, id, options)

      // Alles Weitere (Imports, Bundling, Caching) übernimmt Vite/Rollup
      return moduleCode
    },
  }
}
