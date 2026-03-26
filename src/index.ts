// src/index.ts

import { parse } from 'acorn'
import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

import transpileToCss from './transpileToCss.js'
import transpileToJs, { type JsTranspileResult } from './transpileToJs.js'
import {
  extractImports,
  generateDepsCode,
  type ImportInfo,
  type ResolvedImportInfo,
} from './utils/extractImports.js'
import { MODULE_CONTRACT_VERSION } from './module-contract.js'
import { normalizeStructSeed } from './utils/structId.js'
import { injectStructIdsIntoTemplate } from './utils/injectStructIds.js'
import { STRUCT_ATTR } from './utils/identityConstants.js'

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
 * Extracts all matching blocks from the source, preserving source order.
 * Uses a single regex pass to match all tag types simultaneously,
 * so interleaved blocks (e.g. [scss]...[css]...) keep their original order.
 */
function extractAllBlocks(
  code: string,
  tags: string,
): { tag: string; content: string }[] {
  const results: { tag: string; content: string }[] = []
  const regex = new RegExp(`\\[(${tags})\\]([\\s\\S]*?)\\[\\/(?:${tags})\\]`, 'g')
  let match: RegExpExecArray | null

  while ((match = regex.exec(code)) !== null) {
    results.push({ tag: match[1]!, content: match[2]?.trim() ?? '' })
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

type AstStatement =
  | AstReturnStatement
  | AstVariableDeclaration
  | AstFunctionDeclaration
  | { type: string }

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
  if (!isRecord(stmt.body) || !Array.isArray((stmt.body as Record<string, unknown>).body))
    return null

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
  deps: Map<string, ImportInfo>
}

/**
 * Transpiles the script block and optionally transforms it into
 * a composition-style controller.
 * Also extracts import declarations and returns them as deps.
 */
function transpileScriptBlock(
  script: ScriptBlock | null,
  options: PluginOptions,
  filePath: string,
): ScriptTranspileResult {
  if (!script) {
    // Minimal controller to satisfy the core runtime.
    return { code: 'return { state: {} };', deps: new Map() }
  }

  try {
    // Extract imports from the source code BEFORE transpilation.
    // This detects duplicate identifiers and removes import declarations.
    const { deps, strippedCode } = extractImports(script.content, filePath)

    let js: JsTranspileResult

    if (script.lang === 'ts') {
      const tsconfigPath = options.tsconfigFile
        ? path.resolve(globalThis.process.cwd(), options.tsconfigFile)
        : undefined

      js = transpileToJs(strippedCode, tsconfigPath)
    } else {
      js = { code: strippedCode }
    }

    const { isComposition, dataKeys, methodKeys } = analyzeScriptForComposition(js.code)

    // Legacy mode: developer controls the return value manually.
    if (!isComposition) {
      // Try to parse the code to catch syntax errors
      try {
        // This will throw if the code is invalid

        new Function(js.code)
      } catch {
        // Fallback to minimal controller
        return { code: 'return { state: {} };', deps: new Map() }
      }
      return { ...js, deps }
    }

    const propsLines: string[] = []

    if (dataKeys.length > 0) {
      propsLines.push('  state: { ' + dataKeys.join(', ') + ' }')
    }

    if (methodKeys.length > 0) {
      propsLines.push('  methods: { ' + methodKeys.join(', ') + ' }')
    }

    const propsObject =
      propsLines.length > 0 ? '{\n' + propsLines.join(',\n') + '\n}' : '{}'

    return {
      code: js.code + '\n\nreturn ' + propsObject + ';',
      map: js.map,
      deps,
    }
  } catch {
    // Any error in transpilation or analysis falls back to minimal controller
    return { code: 'return { state: {} };', deps: new Map() }
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
    const content = block.content.trim()
    if (!content) continue

    if (block.lang === 'css') {
      cssParts.push(block.content)
    } else {
      const css = transpileToCss(block.content, block.lang)
      if (css) cssParts.push(css)
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
export function transformKpaToModule(
  code: string,
  id: string,
  options: PluginOptions,
  resolvedDeps: Map<string, ResolvedImportInfo>,
): string {
  const normalizedId = normalizePath(id)
  const parsed = parseKpaSource(code)

  let template = parsed.template ?? ''
  const style = transpileStyleBlocks(parsed.styles)

  const scriptResult = transpileScriptBlock(parsed.script, options, id)
  const scriptBody = scriptResult.code || 'return { state: {} };'

  // Inject structId attributes if template is non-empty
  if (template) {
    const seed = normalizeStructSeed(id, template)
    template = injectStructIdsIntoTemplate(template, seed)
  }

  // Use JSON.stringify to safely serialize all string content.
  // This prevents backticks, ${}, and other special characters from breaking
  // the generated ES module output.
  const pathStr = JSON.stringify(normalizedId)
  const templateStr = JSON.stringify(template)
  const styleStr = JSON.stringify(style)
  const scriptStr = JSON.stringify('(() => { ' + scriptBody + ' })()')
  const scriptMapStr = scriptResult.map ? JSON.stringify(scriptResult.map) : 'null'

  // Generate deps code for dynamic imports using pre-resolved paths
  const depsCode = generateDepsCode(resolvedDeps)

  return (
    '{\n' +
    '    contractVersion: ' +
    MODULE_CONTRACT_VERSION +
    ',\n' +
    '    path: ' +
    pathStr +
    ',\n' +
    '    template: ' +
    templateStr +
    ',\n' +
    '    style: ' +
    styleStr +
    ',\n' +
    '    script: ' +
    scriptStr +
    ',\n' +
    '    scriptMap: ' +
    scriptMapStr +
    ',\n' +
    '    deps: ' +
    depsCode +
    ',\n' +
    `    structAttr: '${STRUCT_ATTR}',\n` +
    '  }'
  )
}

/* -------------------------------------------------------------------------- */
/*  Vite Plugin Wrapper                                                       */
/* -------------------------------------------------------------------------- */

export default function koppajsVitePlugin(config: PluginOptions = {}): Plugin {
  const pluginName = 'koppajs-vite-plugin'
  const options: PluginOptions = { ...DEFAULT_PLUGIN_OPTIONS, ...config }
  let isDev = false

  return {
    name: pluginName,
    enforce: 'pre',

    configResolved(resolvedConfig) {
      isDev = resolvedConfig.command === 'serve'
    },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.endsWith('.kpa')) {
          res.setHeader('Content-Type', 'application/javascript')
        }
        next()
      })
    },

    resolveId(source, importer) {
      // Only resolve relative .kpa imports — let Vite handle alias/bare imports
      if (
        source.endsWith('.kpa') &&
        importer &&
        (source.startsWith('./') || source.startsWith('../'))
      ) {
        return normalizePath(path.resolve(path.dirname(importer), source))
      }
      return null
    },

    async load(id: string) {
      if (!id.endsWith('.kpa')) return null

      // Strip query string from .kpa id for resolution
      const importerId = id.split('?')[0]

      const code = fs.readFileSync(importerId, 'utf8')

      // Pre-extract imports to get deps before transform
      const parsed = parseKpaSource(code)
      const scriptContent = parsed.script?.content ?? ''
      const { deps } = extractImports(scriptContent, importerId)

      // Resolve all import sources using Vite's resolver
      const resolvedDeps = new Map<string, ResolvedImportInfo>()

      for (const [identifier, info] of deps) {
        const source = info.source
        let spec = source
        let resolvedId: string | undefined

        try {
          const resolved = await this.resolve(source, importerId, { skipSelf: true })
          resolvedId = resolved?.id

          if (resolved?.id) {
            // Check if it's a virtual module or special ID (starts with \0)
            // or already URL-like (http://, https://, etc.)
            if (
              resolved.id.startsWith('\0') ||
              resolved.id.startsWith('virtual:') ||
              /^https?:\/\//.test(resolved.id)
            ) {
              spec = resolved.id
            } else if (path.isAbsolute(resolved.id)) {
              // Check if resolved path is inside project root
              const projectRoot = process.cwd()
              const rel = path.relative(projectRoot, resolved.id).replace(/\\/g, '/')

              if (!rel.startsWith('..') && !path.isAbsolute(rel)) {
                // Inside project root - use Vite root-relative specifier
                spec = '/' + rel
              } else {
                // Outside project root - use the resolved id as-is
                spec = resolved.id
              }
            } else {
              // Already a valid specifier (e.g., bare import that resolved to itself)
              spec = resolved.id
            }
          } else {
            // Resolution returned null
            if (source.startsWith('.')) {
              // Relative import - compute absolute path and convert to root-relative
              const abs = path.resolve(path.dirname(importerId), source)
              const rel = path.relative(process.cwd(), abs).replace(/\\/g, '/')
              spec = '/' + rel
            }
            // Else: bare import like "react" - keep source unchanged
          }
        } catch {
          // Resolution failed
          if (source.startsWith('.')) {
            // Relative import - compute absolute path and convert to root-relative
            const abs = path.resolve(path.dirname(importerId), source)
            const rel = path.relative(process.cwd(), abs).replace(/\\/g, '/')
            spec = '/' + rel
          }
          // Else: keep original source
        }

        // Debug log in dev mode
        if (isDev) {
          console.debug('[koppajs-vite-plugin][deps]', {
            importerId,
            source,
            resolvedId,
            spec,
          })
        }

        resolvedDeps.set(identifier, {
          ...info,
          resolvedPath: spec,
        })
      }

      return (
        'export default ' + transformKpaToModule(code, importerId, options, resolvedDeps)
      )
    },
  }
}
