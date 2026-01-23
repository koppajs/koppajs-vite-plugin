// Defines the fixed, versioned shape for the module object emitted by the Vite plugin

export const MODULE_CONTRACT_VERSION = '1.0.0'

export interface KoppaModule {
  /** Version of the contract enforced by the plugin */
  contractVersion: typeof MODULE_CONTRACT_VERSION
  /** Path to the source file */
  path: string
  /** HTML template string */
  template: string
  /** CSS string */
  style: string
  /** JS controller string */
  script: string
  /** Source map for the script, or null */
  scriptMap: unknown | null
  /**
   * Dependency map of lazy loader functions, or null if no dependencies.
   * Each value is a function that returns a Promise resolving to the imported module/export.
   */
  deps: Record<string, () => Promise<unknown>> | null
  /** Attribute used for struct identification */
  structAttr: string
}

/**
 * Validates that deps is either null or a plain object with all function values.
 */
function isValidDeps(
  deps: unknown,
): deps is Record<string, () => Promise<unknown>> | null {
  if (deps === null) {
    return true
  }
  if (typeof deps !== 'object' || Array.isArray(deps)) {
    return false
  }
  // Check that all values are functions
  for (const value of Object.values(deps as Record<string, unknown>)) {
    if (typeof value !== 'function') {
      return false
    }
  }
  return true
}

export function validateKoppaModule(obj: any): obj is KoppaModule {
  return (
    obj &&
    obj.contractVersion === MODULE_CONTRACT_VERSION &&
    typeof obj.path === 'string' &&
    typeof obj.template === 'string' &&
    typeof obj.style === 'string' &&
    typeof obj.script === 'string' &&
    (typeof obj.scriptMap === 'object' || obj.scriptMap === null) &&
    isValidDeps(obj.deps) &&
    typeof obj.structAttr === 'string'
  )
}
