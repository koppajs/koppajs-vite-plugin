import { describe, it, expect } from 'vitest';
import { transformKpaToModule } from '../src/index';
import { validateKoppaModule, MODULE_CONTRACT_VERSION } from '../src/module-contract';

const options = {};
const resolvedDeps = new Map();

function parseOutputObject(output: string) {
  // Evaluate the output string as an object literal
  // (the plugin emits a JS object, not a module)
  // This is safe here because the test controls the input
  // eslint-disable-next-line no-new-func
  return new Function(`return ${output}`)();
}

describe('KoppaModule contract enforcement', () => {
  it('emits contractVersion and passes validation', () => {
    const code = '[template]<div></div>[/template][js]{}[/js][css].a{}[/css]';
    const id = '/test/file.kpa';
    const output = transformKpaToModule(code, id, options, resolvedDeps);
    const obj = parseOutputObject(output);
    expect(obj.contractVersion).toBe(MODULE_CONTRACT_VERSION);
    expect(validateKoppaModule(obj)).toBe(true);
  });

  it('fails validation if shape changes', () => {
    // Remove a required field
    const broken = {
      contractVersion: MODULE_CONTRACT_VERSION,
      path: '/test/file.kpa',
      template: '<div></div>',
      style: '.a{}',
      // script missing
      scriptMap: null,
      deps: {},
      structAttr: 'data-k-struct',
    };
    expect(validateKoppaModule(broken)).toBe(false);
  });

  it('fails validation if contractVersion changes', () => {
    const code = '[template]<div></div>[/template][js]{}[/js][css].a{}[/css]';
    const id = '/test/file.kpa';
    const output = transformKpaToModule(code, id, options, resolvedDeps);
    const obj = parseOutputObject(output);
    obj.contractVersion = '2.0.0';
    expect(validateKoppaModule(obj)).toBe(false);
  });
});
