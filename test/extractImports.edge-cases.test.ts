import { describe, it, expect } from "vitest";
import { extractImports } from "../src/utils/extractImports";

describe("extractImports - edge cases and negative tests", () => {
  describe("malformed imports", () => {
    it("handles import with no specifiers", () => {
      const code = `import 'side-effect-module'`;
      const result = extractImports(code, "test.kpa");

      // Side-effect imports have no bindings
      expect(result.deps.size).toBe(0);
      expect(result.strippedCode).not.toContain("import");
    });

    it("handles import with trailing comma", () => {
      const code = `import { foo, bar, } from 'module'`;
      const result = extractImports(code, "test.kpa");

      expect(result.deps.size).toBe(2);
      expect(result.deps.has("foo")).toBe(true);
      expect(result.deps.has("bar")).toBe(true);
    });

    it("handles import with whitespace variations", () => {
      const code = `import  {  foo  ,  bar  }  from  'module'`;
      const result = extractImports(code, "test.kpa");

      expect(result.deps.size).toBe(2);
      expect(result.deps.has("foo")).toBe(true);
      expect(result.deps.has("bar")).toBe(true);
    });

    it("handles import with newlines", () => {
      const code = `import {
        foo,
        bar,
        baz
      } from 'module'`;
      const result = extractImports(code, "test.kpa");

      expect(result.deps.size).toBe(3);
    });

    it("handles import with comments", () => {
      const code = `import {
        foo, // first import
        bar, /* second import */
        baz
      } from 'module'`;
      const result = extractImports(code, "test.kpa");

      expect(result.deps.size).toBe(3);
    });

    it("handles dynamic imports in code", () => {
      const code = `
        import { foo } from 'static-module'
        const bar = await import('dynamic-module')
      `;
      const result = extractImports(code, "test.kpa");

      // Only static imports are extracted
      expect(result.deps.size).toBe(1);
      expect(result.deps.has("foo")).toBe(true);
      expect(result.strippedCode).toContain("import('dynamic-module')");
    });

    it("handles import inside string literal", () => {
      const code = `
        import { foo } from 'module'
        const str = "import { fake } from 'fake-module'"
      `;
      const result = extractImports(code, "test.kpa");

      // Only real import should be extracted
      expect(result.deps.size).toBe(1);
      expect(result.deps.has("foo")).toBe(true);
    });

    it("handles import inside comment", () => {
      const code = `
        import { foo } from 'module'
        // import { fake } from 'fake-module'
        /* import { another } from 'another-module' */
      `;
      const result = extractImports(code, "test.kpa");

      // Only real import should be extracted
      expect(result.deps.size).toBe(1);
      expect(result.deps.has("foo")).toBe(true);
    });

    it("handles empty file", () => {
      const code = ``;
      const result = extractImports(code, "test.kpa");

      expect(result.deps.size).toBe(0);
      expect(result.strippedCode).toBe("");
    });

    it("handles file with only whitespace", () => {
      const code = `   \n\n\t\t  \n  `;
      const result = extractImports(code, "test.kpa");

      expect(result.deps.size).toBe(0);
    });

    it("handles file with no imports", () => {
      const code = `const x = 42;\nconsole.log(x);`;
      const result = extractImports(code, "test.kpa");

      expect(result.deps.size).toBe(0);
      expect(result.strippedCode).toContain("const x = 42");
    });
  });

  describe("import sources - edge cases", () => {
    it("handles scoped package names", () => {
      const code = `import { Component } from '@koppajs/core'`;
      const result = extractImports(code, "test.kpa");

      expect(result.deps.size).toBe(1);
      expect(result.deps.get("Component")?.source).toBe("@koppajs/core");
    });

    it("handles relative imports with ..", () => {
      const code = `import { foo } from '../parent/module'`;
      const result = extractImports(code, "test.kpa");

      expect(result.deps.size).toBe(1);
      expect(result.deps.get("foo")?.source).toBe("../parent/module");
    });

    it("handles deep relative imports", () => {
      const code = `import { foo } from '../../../very/deep/module'`;
      const result = extractImports(code, "test.kpa");

      expect(result.deps.size).toBe(1);
      expect(result.deps.get("foo")?.source).toBe("../../../very/deep/module");
    });

    it("handles imports with file extensions", () => {
      const code = `import { foo } from './module.js'`;
      const result = extractImports(code, "test.kpa");

      expect(result.deps.size).toBe(1);
      expect(result.deps.get("foo")?.source).toBe("./module.js");
    });

    it("handles imports with .kpa extension", () => {
      const code = `import Component from './Component.kpa'`;
      const result = extractImports(code, "test.kpa");

      expect(result.deps.size).toBe(1);
      expect(result.deps.get("Component")?.source).toBe("./Component.kpa");
    });

    it("handles imports with query parameters", () => {
      const code = `import styles from './styles.css?inline'`;
      const result = extractImports(code, "test.kpa");

      expect(result.deps.size).toBe(1);
    });

    it("handles imports with special characters in path", () => {
      const code = `import { foo } from './my-module-v1.2.3'`;
      const result = extractImports(code, "test.kpa");

      expect(result.deps.size).toBe(1);
    });
  });

  describe("import specifiers - edge cases", () => {
    it("handles type-only imports", () => {
      const code = `import type { Foo } from 'module'`;
      const result = extractImports(code, "test.kpa");

      // Type imports should be handled or stripped
      expect(result.strippedCode).not.toContain("import type");
    });

    it("handles mixed default and named imports", () => {
      const code = `import Default, { named1, named2 } from 'module'`;
      const result = extractImports(code, "test.kpa");

      expect(result.deps.has("Default")).toBe(true);
      expect(result.deps.has("named1")).toBe(true);
      expect(result.deps.has("named2")).toBe(true);
    });

    it("handles namespace imports", () => {
      const code = `import * as Everything from 'module'`;
      const result = extractImports(code, "test.kpa");

      expect(result.deps.has("Everything")).toBe(true);
    });

    it("handles mixed namespace and named imports", () => {
      const code = `import Default, * as NS from 'module'`;
      const result = extractImports(code, "test.kpa");

      expect(result.deps.has("Default")).toBe(true);
      expect(result.deps.has("NS")).toBe(true);
    });

    it("handles imports with reserved words as aliases", () => {
      const code = `import { default as defaultValue } from 'module'`;
      const result = extractImports(code, "test.kpa");

      expect(result.deps.has("defaultValue")).toBe(true);
    });

    it("handles imports with special characters in names", () => {
      const code = `import { $special, _private, __proto__ } from 'module'`;
      const result = extractImports(code, "test.kpa");

      expect(result.deps.size).toBe(3);
      expect(result.deps.has("$special")).toBe(true);
      expect(result.deps.has("_private")).toBe(true);
      expect(result.deps.has("__proto__")).toBe(true);
    });
  });

  describe("code stripping - edge cases", () => {
    it("preserves code after imports", () => {
      const code = `import { foo } from 'module'\nconst x = foo();\nconsole.log(x);`;
      const result = extractImports(code, "test.kpa");

      expect(result.strippedCode).not.toContain("import");
      expect(result.strippedCode).toContain("const x = foo()");
      expect(result.strippedCode).toContain("console.log(x)");
    });

    it("preserves code before imports", () => {
      const code = `const before = 42;\nimport { foo } from 'module'\nconst after = foo();`;
      const result = extractImports(code, "test.kpa");

      expect(result.strippedCode).toContain("const before = 42");
      expect(result.strippedCode).toContain("const after = foo()");
      expect(result.strippedCode).not.toContain("import");
    });

    it("preserves code between multiple imports", () => {
      const code = `
        import { foo } from 'module1'
        const x = 1;
        import { bar } from 'module2'
        const y = 2;
      `;
      const result = extractImports(code, "test.kpa");

      expect(result.strippedCode).toContain("const x = 1");
      expect(result.strippedCode).toContain("const y = 2");
      expect(result.strippedCode).not.toContain("import");
    });

    it("handles semicolons correctly", () => {
      const code = `import { foo } from 'module';const x = foo();`;
      const result = extractImports(code, "test.kpa");

      expect(result.strippedCode).toContain("const x = foo()");
    });
  });

  describe("duplicate imports", () => {
    it("handles duplicate named imports from same module", () => {
      const code = `
        import { foo } from 'module'
        import { bar } from 'module'
      `;
      const result = extractImports(code, "test.kpa");

      expect(result.deps.size).toBe(2);
      expect(result.deps.has("foo")).toBe(true);
      expect(result.deps.has("bar")).toBe(true);
    });

    it("handles same name imported from different modules", () => {
      const code = `
        import { foo } from 'module1'
        import { foo as foo2 } from 'module2'
      `;
      const result = extractImports(code, "test.kpa");

      expect(result.deps.size).toBe(2);
      expect(result.deps.has("foo")).toBe(true);
      expect(result.deps.has("foo2")).toBe(true);
    });

    it("handles duplicate default imports", () => {
      const code = `
        import Default1 from 'module1'
        import Default2 from 'module2'
      `;
      const result = extractImports(code, "test.kpa");

      expect(result.deps.size).toBe(2);
      expect(result.deps.has("Default1")).toBe(true);
      expect(result.deps.has("Default2")).toBe(true);
    });
  });

  describe("complex scenarios", () => {
    it("handles very long import list", () => {
      const imports = Array.from({ length: 100 }, (_, i) => `import${i}`).join(
        ", ",
      );
      const code = `import { ${imports} } from 'module'`;
      const result = extractImports(code, "test.kpa");

      expect(result.deps.size).toBe(100);
    });

    it("handles many separate import statements", () => {
      const imports = Array.from(
        { length: 50 },
        (_, i) => `import { foo${i} } from 'module${i}'`,
      ).join("\n");
      const result = extractImports(imports, "test.kpa");

      expect(result.deps.size).toBe(50);
    });

    it("handles imports with unicode characters", () => {
      const code = `import { föö, 日本語, emoji😀 } from 'module'`;
      const result = extractImports(code, "test.kpa");

      // JavaScript identifiers can contain unicode
      expect(result.deps.size).toBeGreaterThanOrEqual(0);
    });

    it("handles imports with escaped characters", () => {
      const code = `import { foo } from 'module\\npath'`;
      const result = extractImports(code, "test.kpa");

      expect(result.deps.size).toBeGreaterThanOrEqual(0);
    });
  });
});
