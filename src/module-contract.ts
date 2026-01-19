// Defines the fixed, versioned shape for the module object emitted by the Vite plugin

export const MODULE_CONTRACT_VERSION = '1.0.0';

export interface KoppaModule {
  /** Version of the contract enforced by the plugin */
  contractVersion: typeof MODULE_CONTRACT_VERSION;
  /** Path to the source file */
  path: string;
  /** HTML template string */
  template: string;
  /** CSS string */
  style: string;
  /** JS controller string */
  script: string;
  /** Source map for the script, or null */
  scriptMap: unknown | null;
  /** Dependency map */
  deps: Record<string, unknown>;
  /** Attribute used for struct identification */
  structAttr: string;
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
    typeof obj.deps === 'object' &&
    typeof obj.structAttr === 'string'
  );
}
