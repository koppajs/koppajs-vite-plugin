// src/index.ts

import { parse } from 'acorn'
import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

import transpileToCss from './transpileToCss.js'
import transpileToJs, { type JsTranspileResult } from './transpileToJs.js'

/* -------------------------------------------------------------------------- */
/*  Plugin Options                                                            */
/* -------------------------------------------------------------------------- */

interface PluginOptions {
  tsconfigFile?: string
  // Reserved for future extensions
}

const DEFAULT_PLUGIN_OPTIONS: PluginOptions = {
  tsconfigFile: 'tsconfig.json',
}

/* -------------------------------------------------------------------------- */
/*  Utility Helpers                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Escapes backticks and template interpolation markers.
 * `${` is rewritten so the core runtime can safely restore it later.
 */
function escapeBackticks(input: string): string {
  return input.replace(/`/g, '\\`').replace(/\$\{/g, '\\$-{')
}

/**
 * Normalizes paths to POSIX style for consistency across platforms.
 */
function normalizePath(inputPath: string): string {
  return inputPath.replace(/\\/g, '/')
}

/* -------------------------------------------------------------------------- */
/*  Phase 1: Parse .kpa source into blocks                                    */
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

/**
 * Extracts the first matching block from the source.
 */
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

/**
 * Extracts all matching blocks from the source.
 */
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

/**
 * Parses the raw .kpa file into its logical parts.
 */
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
/*  Phase 2: Composition API analysis                                         */
/* -------------------------------------------------------------------------- */

interface CompositionAnalysis {
  isComposition: boolean
  dataKeys: string[]
  methodKeys: string[]
}

/**
 * Minimal AST shapes we need from Acorn.
 * This avoids using `any` while still staying lightweight.
 */
type AstIdentifier = { type: 'Identifier'; name: string }
type AstVariableDeclarator = { id: AstIdentifier | { type: string } }
type AstVariableDeclaration = {
  type: 'VariableDeclaration'
  declarations: AstVariableDeclarator[]
}
type AstReturnStatement = { type: 'ReturnStatement' }
type AstFunctionDeclaration = {
  type: 'FunctionDeclaration'
  id?: AstIdentifier
  body: { body: AstStatement[] }
}

type AstStatement = AstReturnStatement | AstVariableDeclaration | AstFunctionDeclaration | { type: string }

type AstProgram = {
  body: unknown[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isAstProgram(value: unknown): value is AstProgram {
  return isRecord(value) && Array.isArray(value.body)
}

function asAstFunctionDeclaration(stmt: unknown): AstFunctionDeclaration | null {
  if (!isRecord(stmt)) return null
  if (stmt.type !== 'FunctionDeclaration') return null
  if (!isRecord(stmt.body) || !Array.isArray((stmt.body as Record<string, unknown>).body)) return null

  // id is optional
  const idVal = stmt.id
  const id =
    isRecord(idVal) && idVal.type === 'Identifier' && typeof idVal.name === 'string'
      ? ({ type: 'Identifier', name: idVal.name } satisfies AstIdentifier)
      : undefined

  return {
    type: 'FunctionDeclaration',
    id,
    body: { body: (stmt.body as Record<string, unknown>).body as AstStatement[] },
  }
}

function isAstIdentifier(value: unknown): value is AstIdentifier {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { type?: unknown }).type === 'Identifier' &&
    typeof (value as { name?: unknown }).name === 'string'
  )
}

/**
 * Analyzes a script block to detect composition-style usage.
 * Top-level variables and functions are treated as data/methods
 * unless a top-level return is found.
 */
function analyzeScriptForComposition(jsCode: string): CompositionAnalysis {
  const dataKeys = new Set<string>()
  const methodKeys = new Set<string>()
  let hasTopLevelReturn = false

  try {
    // The script is parsed as if it were the body of an async function.
    const wrapped = `async function __koppa_wrapper__() {\n${jsCode}\n}`
    const astUnknown: unknown = parse(wrapped, {
      ecmaVersion: 'latest',
      sourceType: 'script',
    })

    if (!isAstProgram(astUnknown) || astUnknown.body.length === 0) {
      return { isComposition: false, dataKeys: [], methodKeys: [] }
    }

    const func = asAstFunctionDeclaration(astUnknown.body[0])
    if (!func) {
      return { isComposition: false, dataKeys: [], methodKeys: [] }
    }

    const body = func.body.body

    for (const stmt of body) {
      if (!isRecord(stmt) || typeof stmt.type !== 'string') continue

      switch (stmt.type) {
        case 'ReturnStatement':
          hasTopLevelReturn = true
          break

        case 'VariableDeclaration': {
          const decls = (stmt as AstVariableDeclaration).declarations

          for (const decl of decls) {
            if (isAstIdentifier(decl.id)) {
              dataKeys.add(decl.id.name)
            }
          }
          break
        }

        case 'FunctionDeclaration': {
          const fd = stmt as unknown as AstFunctionDeclaration
          if (fd.id?.name) {
            methodKeys.add(fd.id.name)
          }
          break
        }
      }
    }
  } catch {
    // Syntax errors fall back to legacy mode.
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
/*  Phase 3: Script transpilation and controller generation                  */
/* -------------------------------------------------------------------------- */

type ScriptTranspileResult = {
  code: string
  map?: unknown
}

/**
 * Transpiles the script block and optionally transforms it into
 * a composition-style controller.
 */
function transpileScriptBlock(
  script: ScriptBlock | null,
  options: PluginOptions,
): ScriptTranspileResult {
  if (!script) {
    // Minimal controller to satisfy the core runtime.
    return { code: 'return { data: {} };' }
  }

  let js: JsTranspileResult

  if (script.lang === 'ts') {
    const tsconfigPath = options.tsconfigFile
      ? path.resolve(globalThis.process.cwd(), options.tsconfigFile)
      : undefined

    js = transpileToJs(script.content, tsconfigPath)
  } else {
    js = { code: script.content }
  }

  const { isComposition, dataKeys, methodKeys } = analyzeScriptForComposition(js.code)

  // Legacy mode: developer controls the return value manually.
  if (!isComposition) {
    return js
  }

  const propsLines: string[] = []

  if (dataKeys.length > 0) {
    propsLines.push(`  data: { ${dataKeys.join(', ')} }`)
  }

  if (methodKeys.length > 0) {
    propsLines.push(`  methods: { ${methodKeys.join(', ')} }`)
  }

  const propsObject =
    propsLines.length > 0 ? `{\n${propsLines.join(',\n')}\n}` : `{}`

  return {
    code: `${js.code}\n\nreturn ${propsObject};`,
    map: js.map,
  }
}

/* -------------------------------------------------------------------------- */
/*  Phase 4: Style transpilation                                              */
/* -------------------------------------------------------------------------- */

/**
 * Compiles and merges all style blocks into a single CSS string.
 */
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
/*  Phase 5: Transform .kpa into an ES module                                 */
/* -------------------------------------------------------------------------- */

/**
 * Converts a .kpa file into a standard ES module that can be consumed
 * by the KoppaJS core runtime.
 */
function transformKpaToModule(code: string, id: string, options: PluginOptions): string {
  const parsed = parseKpaSource(code)

  const template = parsed.template ? escapeBackticks(parsed.template) : ''
  const style = escapeBackticks(transpileStyleBlocks(parsed.styles))

  const scriptResult = transpileScriptBlock(parsed.script, options)
  const scriptBody = escapeBackticks(scriptResult.code)

  const scriptMapJson = scriptResult.map ? JSON.stringify(scriptResult.map) : null
  const scriptMap = scriptMapJson ? escapeBackticks(scriptMapJson) : null

  return `
    export default {
      path: \`${normalizePath(id)}\`,
      template: \`${template}\`,
      style: \`${style}\`,
      script: \`(() => { ${scriptBody || 'return { data: {} };'} })()\`,
      scriptMap: ${scriptMap ? `\`${scriptMap}\`` : 'null'}
    };
  `
}

/* -------------------------------------------------------------------------- */
/*  Vite Plugin Wrapper                                                       */
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
        return normalizePath(path.resolve(path.dirname(importer), source))
      }
      return null
    },

    load(id: string) {
      if (!id.endsWith('.kpa')) return null

      const code = fs.readFileSync(id, 'utf8')
      return transformKpaToModule(code, id, options)
    },
  }
}
