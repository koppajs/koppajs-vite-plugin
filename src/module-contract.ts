// Defines the fixed shape for the module object emitted by the Vite plugin

export const MODULE_CONTRACT_VERSION = 1

export interface KoppaModule {
  /** Version of the emitted contract */
  contractVersion: number
  /** Normalized source path for the component */
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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
  if (!isRecord(deps)) {
    return false
  }
  // Check that all values are functions
  for (const value of Object.values(deps)) {
    if (typeof value !== 'function') {
      return false
    }
  }
  return true
}

export function validateKoppaModule(obj: unknown): obj is KoppaModule {
  if (!isRecord(obj)) {
    return false
  }

  return (
    obj.contractVersion === MODULE_CONTRACT_VERSION &&
    typeof obj.path === 'string' &&
    typeof obj.template === 'string' &&
    typeof obj.style === 'string' &&
    typeof obj.script === 'string' &&
    ((isRecord(obj.scriptMap) && !Array.isArray(obj.scriptMap)) ||
      obj.scriptMap === null) &&
    isValidDeps(obj.deps) &&
    typeof obj.structAttr === 'string'
  )
}
