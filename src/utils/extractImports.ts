/**
 * Utility for extracting and processing import declarations from TypeScript code.
 * Used to collect runtime dependencies from .kpa [ts] blocks.
 */
import { parseSync } from 'oxc-parser'

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface ImportInfo {
  /** The local identifier name (e.g., "X" in `import { X } from "..."`) */
  localName: string
  /** The exported name from the module (may differ if using `as`) */
  exportName: string
  /** The module specifier (e.g., "lodash") */
  source: string
}

export interface ResolvedImportInfo extends ImportInfo {
  /** The resolved import path (after Vite resolution) */
  resolvedPath: string
}

export interface ExtractImportsResult {
  /** Map of identifier -> import info for dependency injection */
  deps: Map<string, ImportInfo>
  /** The code with all import declarations removed */
  strippedCode: string
}

/* -------------------------------------------------------------------------- */
/*  Import Extraction                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Extracts import declarations from TypeScript/JavaScript code.
 * Detects named imports and throws on duplicate identifiers.
 *
 * @param code - The source code to parse
 * @param filePath - The file path (used in error messages)
 * @returns The deps map and code with imports removed
 * @throws Error if duplicate identifiers or invalid syntax are found
 */
export function extractImports(code: string, filePath: string): ExtractImportsResult {
  const parsed = parseSync('module.ts', code)
  // Component scripts are function bodies, but imports require module parsing.
  // Oxc retains the AST for top-level returns, so tolerate only that diagnostic.
  const parseError = parsed.errors.find(
    (error) =>
      error.message !== "A 'return' statement can only be used within a function body.",
  )
  if (parseError) {
    throw new SyntaxError(`Failed to parse imports in ${filePath}: ${parseError.message}`)
  }

  const deps = new Map<string, ImportInfo>()
  const importRanges: Array<{ start: number; end: number }> = []

  for (const statement of parsed.program.body) {
    if (statement.type !== 'ImportDeclaration') {
      continue
    }

    const source = statement.source.value

    // Oxc's JavaScript AST offsets are UTF-16, matching String.slice.
    importRanges.push({ start: statement.start, end: statement.end })

    // Strip type-only and side-effect imports without runtime dependencies.
    if (statement.importKind === 'type') {
      continue
    }

    for (const specifier of statement.specifiers) {
      if (specifier.type === 'ImportSpecifier' && specifier.importKind === 'type') {
        continue
      }

      const localName = specifier.local.name
      let exportName: string
      if (specifier.type === 'ImportDefaultSpecifier') {
        exportName = 'default'
      } else if (specifier.type === 'ImportNamespaceSpecifier') {
        exportName = '*'
      } else {
        exportName =
          specifier.imported.type === 'Identifier'
            ? specifier.imported.name
            : specifier.imported.value
      }

      checkDuplicate(deps, localName, filePath)
      deps.set(localName, { localName, exportName, source })
    }
  }

  // Remove import declarations from code (in reverse order to preserve positions)
  const sortedRanges = [...importRanges].sort((a, b) => b.start - a.start)
  let strippedCode = code
  for (const range of sortedRanges) {
    strippedCode = strippedCode.slice(0, range.start) + strippedCode.slice(range.end)
  }

  // Clean up leading whitespace from removed imports
  strippedCode = strippedCode.replace(/^\s*\n/, '')

  return { deps, strippedCode }
}

/**
 * Checks if an identifier is already in the deps map and throws if so.
 */
function checkDuplicate(
  deps: Map<string, ImportInfo>,
  name: string,
  filePath: string,
): void {
  if (deps.has(name)) {
    throw new Error(`Duplicate imported identifier '${name}' in ${filePath}`)
  }
}

/**
 * Generates the deps object code for the module output.
 * Creates dynamic import functions for each dependency.
 *
 * @param deps - The resolved deps map with pre-resolved import paths
 * @returns A string representing the deps object literal
 */
export function generateDepsCode(deps: Map<string, ResolvedImportInfo>): string {
  if (deps.size === 0) {
    return 'null'
  }

  const entries: string[] = []

  for (const [identifier, info] of deps) {
    const importPath = JSON.stringify(info.resolvedPath)

    if (info.exportName === '*') {
      // Namespace import: return the whole module
      entries.push(`${identifier}: () => import(${importPath})`)
    } else {
      // Named or default import: return specific export
      const exportName = JSON.stringify(info.exportName)
      entries.push(
        `${identifier}: () => import(${importPath}).then((m) => m[${exportName}])`,
      )
    }
  }

  return `{ ${entries.join(', ')} }`
}
