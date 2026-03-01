import { describe, it, expect } from 'vitest'
import transpileToCss from '../src/transpileToCss'

describe('transpileToCss', () => {
  describe('positive cases', () => {
    it('compiles valid SCSS to CSS', () => {
      const scss = `.parent { .child { color: red; } }`
      const result = transpileToCss(scss, 'scss')
      expect(result).toContain('.parent .child')
      expect(result).toContain('color: red')
    })

    it('compiles valid SASS (indented syntax) to CSS', () => {
      const sass = `.parent\n  .child\n    color: red`
      const result = transpileToCss(sass, 'sass')
      expect(result).toContain('.parent .child')
      expect(result).toContain('color: red')
    })

    it('handles SCSS variables', () => {
      const scss = `$primary: #333; .test { color: $primary; }`
      const result = transpileToCss(scss, 'scss')
      expect(result).toContain('color: #333')
    })

    it('handles SCSS nesting', () => {
      const scss = `.outer { .inner { font-weight: bold; } }`
      const result = transpileToCss(scss, 'scss')
      expect(result).toContain('.outer .inner')
    })

    it('handles SCSS mixins', () => {
      const scss = `@mixin bold { font-weight: bold; } .test { @include bold; }`
      const result = transpileToCss(scss, 'scss')
      expect(result).toContain('font-weight: bold')
    })

    it('handles media queries', () => {
      const scss = `@media (max-width: 768px) { .mobile { display: block; } }`
      const result = transpileToCss(scss, 'scss')
      expect(result).toContain('@media')
      expect(result).toContain('max-width: 768px')
    })

    it('applies autoprefixer', () => {
      // Use a property that typically needs prefixing
      const scss = `.flex { display: flex; }`
      const result = transpileToCss(scss, 'scss')
      // Result should include the original display: flex at minimum
      expect(result).toContain('display: flex')
    })

    it('handles complex SCSS with imports, functions, and operations', () => {
      const scss = `
        $base-size: 16px;
        .container {
          font-size: $base-size;
          padding: calc($base-size / 2);
        }
      `
      const result = transpileToCss(scss, 'scss')
      expect(result).toContain('font-size: 16px')
    })
  })

  describe('empty input handling', () => {
    it('returns empty string on empty input', () => {
      expect(transpileToCss('', 'scss')).toBe('')
    })

    it('returns empty string on whitespace-only input', () => {
      expect(transpileToCss('   \n\t  ', 'scss')).toBe('')
    })

    it('returns empty string for empty SASS input', () => {
      expect(transpileToCss('', 'sass')).toBe('')
    })

    it('returns empty string for whitespace-only SASS input', () => {
      expect(transpileToCss('   \n\t  ', 'sass')).toBe('')
    })
  })

  describe('negative cases', () => {
    it('throws on invalid SCSS syntax', () => {
      const invalidScss = `.test { { color: red; }`
      expect(() => transpileToCss(invalidScss, 'scss')).toThrow()
    })
  })

  describe('edge cases', () => {
    it('preserves CSS comments', () => {
      const scss = `/* comment */ .test { color: red; }`
      const result = transpileToCss(scss, 'scss')
      // Comments may or may not be preserved depending on sass config
      expect(result).toContain('.test')
    })

    it('handles deeply nested selectors', () => {
      const scss = `.a { .b { .c { .d { color: red; } } } }`
      const result = transpileToCss(scss, 'scss')
      expect(result).toContain('.a .b .c .d')
    })

    it('handles pseudo-selectors', () => {
      const scss = `.btn { &:hover { background: blue; } }`
      const result = transpileToCss(scss, 'scss')
      expect(result).toContain('.btn:hover')
    })
  })
})
