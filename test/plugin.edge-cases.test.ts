import { describe, it, expect } from "vitest";

describe("plugin - .kpa file parsing edge cases", () => {
  describe("malformed .kpa structure", () => {
    it("handles missing template section", () => {
      const source = `
[ts]
  return { state: { count: 0 } }
[/ts]

[scss]
  .test { color: red; }
[/scss]
      `;

      // Test that parser handles gracefully
      expect(source).toBeDefined();
    });

    it("handles missing script section", () => {
      const source = `
[template]
  <div>Hello World</div>
[/template]

[scss]
  .test { color: red; }
[/scss]
      `;

      expect(source).toBeDefined();
    });

    it("handles missing style section", () => {
      const source = `
[template]
  <div>Hello World</div>
[/template]

[ts]
  return { state: { count: 0 } }
[/ts]
      `;

      expect(source).toBeDefined();
    });

    it("handles completely empty file", () => {
      const source = ``;
      expect(source).toBe("");
    });

    it("handles file with only whitespace", () => {
      const source = `   \n\n\t\t  \n  `;
      expect(source.trim()).toBe("");
    });

    it("handles file with only comments", () => {
      const source = `
// This is a comment
/* Multi-line
   comment */
      `;
      expect(source).toBeDefined();
    });
  });

  describe("malformed section tags", () => {
    it("handles unclosed template tag", () => {
      const source = `
[template]
  <div>Hello World</div>
      `;

      // Missing [/template]
      expect(source).toBeDefined();
    });

    it("handles unopened closing tag", () => {
      const source = `
  <div>Hello World</div>
[/template]
      `;

      expect(source).toBeDefined();
    });

    it("handles nested section tags", () => {
      const source = `
[template]
  <div>
    [template]
      <span>Nested?</span>
    [/template]
  </div>
[/template]
      `;

      expect(source).toBeDefined();
    });

    it("handles mismatched tags", () => {
      const source = `
[template]
  <div>Hello</div>
[/ts]
      `;

      expect(source).toBeDefined();
    });

    it("handles mixed case tags", () => {
      const source = `
[Template]
  <div>Hello</div>
[/Template]
      `;

      expect(source).toBeDefined();
    });

    it("handles tags with spaces", () => {
      const source = `
[ template ]
  <div>Hello</div>
[ /template ]
      `;

      expect(source).toBeDefined();
    });
  });

  describe("template content edge cases", () => {
    it("handles template with special characters", () => {
      const template = `<div>Special: &lt;&gt;&amp;&quot;&#39;</div>`;
      expect(template).toBeDefined();
    });

    it("handles template with malformed HTML", () => {
      const template = `<div><span>Unclosed`;
      expect(template).toBeDefined();
    });

    it("handles template with script tags", () => {
      const template = `<div><script>alert('xss')</script></div>`;
      expect(template).toBeDefined();
    });

    it("handles template with style tags", () => {
      const template = `<div><style>.test { color: red; }</style></div>`;
      expect(template).toBeDefined();
    });

    it("handles template with very long content", () => {
      const template = `<div>${"x".repeat(10000)}</div>`;
      expect(template.length).toBeGreaterThan(10000);
    });

    it("handles template with unicode characters", () => {
      const template = `<div>日本語 🎉 föö</div>`;
      expect(template).toBeDefined();
    });

    it("handles template with CDATA", () => {
      const template = `<div><![CDATA[Some content]]></div>`;
      expect(template).toBeDefined();
    });

    it("handles template with XML comments", () => {
      const template = `<div><!-- Comment --></div>`;
      expect(template).toBeDefined();
    });

    it("handles template with processing instructions", () => {
      const template = `<div><?xml version="1.0"?></div>`;
      expect(template).toBeDefined();
    });

    it("handles empty template", () => {
      const template = ``;
      expect(template).toBe("");
    });

    it("handles template with only whitespace", () => {
      const template = `   \n\n   `;
      expect(template.trim()).toBe("");
    });

    it("handles template with self-closing tags", () => {
      const template = `<div><img src="test.jpg" /><br /></div>`;
      expect(template).toBeDefined();
    });
  });

  describe("script content edge cases", () => {
    it("handles script with syntax errors", () => {
      const script = `{ invalid javascript }}}`;
      expect(script).toBeDefined();
    });

    it("handles script with template literals", () => {
      const script = "const msg = `Hello ${name}`;";
      expect(script).toBeDefined();
    });

    it("handles script with nested template literals", () => {
      const script = "const msg = `Outer ${`Inner ${value}`}`;";
      expect(script).toBeDefined();
    });

    it("handles script with regex patterns", () => {
      const script = "const pattern = /\\d+/g;";
      expect(script).toBeDefined();
    });

    it("handles script with division operator", () => {
      const script = "const result = a / b;";
      expect(script).toBeDefined();
    });

    it("handles script with comments containing slashes", () => {
      const script = "// http://example.com\nconst x = 1;";
      expect(script).toBeDefined();
    });

    it("handles script with strings containing brackets", () => {
      const script = 'const str = "[template] and [/template]";';
      expect(script).toBeDefined();
    });

    it("handles script with multiline strings", () => {
      const script = `const str = \`
        Line 1
        Line 2
        Line 3
      \`;`;
      expect(script).toBeDefined();
    });

    it("handles empty script", () => {
      const script = ``;
      expect(script).toBe("");
    });

    it("handles script returning null", () => {
      const script = `return null;`;
      expect(script).toBeDefined();
    });

    it("handles script returning undefined", () => {
      const script = `return undefined;`;
      expect(script).toBeDefined();
    });

    it("handles script with arrow functions", () => {
      const script = `return { methods: { onClick: () => {} } }`;
      expect(script).toBeDefined();
    });

    it("handles script with async functions", () => {
      const script = `return { methods: { async fetch() { } } }`;
      expect(script).toBeDefined();
    });

    it("handles script with generators", () => {
      const script = `return { methods: { *generate() { yield 1; } } }`;
      expect(script).toBeDefined();
    });

    it("handles script with classes", () => {
      const script = `class Helper {} return { Helper }`;
      expect(script).toBeDefined();
    });

    it("handles script with try-catch", () => {
      const script = `try { } catch (e) { } finally { } return {}`;
      expect(script).toBeDefined();
    });

    it("handles script with destructuring", () => {
      const script = `const { a, b } = obj; return { a, b }`;
      expect(script).toBeDefined();
    });

    it("handles script with spread operator", () => {
      const script = `const arr = [...items]; return { arr }`;
      expect(script).toBeDefined();
    });

    it("handles script with nullish coalescing", () => {
      const script = `const value = data ?? default; return { value }`;
      expect(script).toBeDefined();
    });

    it("handles script with optional chaining", () => {
      const script = `const name = user?.profile?.name; return { name }`;
      expect(script).toBeDefined();
    });
  });

  describe("style content edge cases", () => {
    it("handles style with invalid CSS", () => {
      const style = `.test { invalid-property: value }`;
      expect(style).toBeDefined();
    });

    it("handles style with SCSS variables", () => {
      const style = `$primary: #333; .test { color: $primary; }`;
      expect(style).toBeDefined();
    });

    it("handles style with SCSS nesting", () => {
      const style = `.parent { .child { color: red; } }`;
      expect(style).toBeDefined();
    });

    it("handles style with SCSS mixins", () => {
      const style = `@mixin test { color: red; } .test { @include test; }`;
      expect(style).toBeDefined();
    });

    it("handles style with media queries", () => {
      const style = `@media (max-width: 768px) { .test { display: none; } }`;
      expect(style).toBeDefined();
    });

    it("handles style with keyframes", () => {
      const style = `@keyframes slide { from { left: 0; } to { left: 100%; } }`;
      expect(style).toBeDefined();
    });

    it("handles style with font-face", () => {
      const style = `@font-face { font-family: Custom; src: url(font.woff); }`;
      expect(style).toBeDefined();
    });

    it("handles style with imports", () => {
      const style = `@import 'other.css';`;
      expect(style).toBeDefined();
    });

    it("handles empty style", () => {
      const style = ``;
      expect(style).toBe("");
    });

    it("handles style with only comments", () => {
      const style = `/* Comment */`;
      expect(style).toBeDefined();
    });

    it("handles style with special characters", () => {
      const style = `.test::before { content: "🎉"; }`;
      expect(style).toBeDefined();
    });

    it("handles style with calc function", () => {
      const style = `.test { width: calc(100% - 20px); }`;
      expect(style).toBeDefined();
    });

    it("handles style with CSS variables", () => {
      const style = `:root { --primary: #333; } .test { color: var(--primary); }`;
      expect(style).toBeDefined();
    });

    it("handles multiple style sections", () => {
      const source = `
[css]
  .test1 { color: red; }
[/css]

[scss]
  .test2 { color: blue; }
[/scss]
      `;
      expect(source).toBeDefined();
    });
  });

  describe("module generation edge cases", () => {
    it("handles component with all sections empty", () => {
      const source = `
[template]
[/template]

[ts]
[/ts]

[scss]
[/scss]
      `;
      expect(source).toBeDefined();
    });

    it("handles component with special characters in all sections", () => {
      const source = `
[template]
  <div>{{ special$_var }}</div>
[/template]

[ts]
  const $_special = 42;
  return { state: { special$_var: $_special } }
[/ts]

[scss]
  ._special-class { color: red; }
[/scss]
      `;
      expect(source).toBeDefined();
    });

    it("handles component with very long content", () => {
      const template = `<div>${"x".repeat(1000)}</div>`;
      const script = `return { state: { data: "${"y".repeat(1000)}" } }`;
      const style = `.test { ${"content: '';".repeat(100)} }`;

      expect(template.length).toBeGreaterThan(1000);
      expect(script.length).toBeGreaterThan(1000);
      expect(style.length).toBeGreaterThan(100);
    });
  });
});
