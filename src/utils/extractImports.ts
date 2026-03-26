/**
 * Utility for extracting and processing import declarations from TypeScript code.
 * Used to collect runtime dependencies from .kpa [ts] blocks.
 */
import ts from 'typescript'

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
 * @throws Error if duplicate identifiers are found
 */
export function extractImports(code: string, filePath: string): ExtractImportsResult {
  const sourceFile = ts.createSourceFile(
    'module.ts',
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )

  const deps = new Map<string, ImportInfo>()
  const importRanges: Array<{ start: number; end: number }> = []

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) {
      continue
    }

    // Get the module specifier (e.g., "lodash")
    const moduleSpecifier = statement.moduleSpecifier
    if (!ts.isStringLiteral(moduleSpecifier)) {
      continue
    }
    const source = moduleSpecifier.text

    // Track the range to remove
    importRanges.push({
      start: statement.getStart(sourceFile),
      end: statement.getEnd(),
    })

    // Get the import clause (what's being imported)
    const importClause = statement.importClause
    if (!importClause) {
      // Side-effect import like `import "module"` - we skip these
      continue
    }

    // Skip type-only imports completely - they don't need runtime deps
    // e.g., `import type { Foo } from "..."` has importClause.isTypeOnly = true
    if (importClause.isTypeOnly) {
      continue
    }

    // Handle default import: import X from "..."
    if (importClause.name) {
      const localName = importClause.name.text
      checkDuplicate(deps, localName, filePath)
      deps.set(localName, {
        localName,
        exportName: 'default',
        source,
      })
    }

    // Handle named imports: import { X, Y as Z } from "..."
    const namedBindings = importClause.namedBindings
    if (namedBindings && ts.isNamedImports(namedBindings)) {
      for (const element of namedBindings.elements) {
        // Skip type-only named imports within a value import
        // e.g., `import { type Foo, Bar } from "..."` - skip Foo, keep Bar
        if (element.isTypeOnly) {
          continue
        }

        const localName = element.name.text
        const exportName = element.propertyName?.text ?? localName

        checkDuplicate(deps, localName, filePath)
        deps.set(localName, {
          localName,
          exportName,
          source,
        })
      }
    }

    // Handle namespace import: import * as X from "..."
    if (namedBindings && ts.isNamespaceImport(namedBindings)) {
      const localName = namedBindings.name.text
      checkDuplicate(deps, localName, filePath)
      deps.set(localName, {
        localName,
        exportName: '*',
        source,
      })
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
