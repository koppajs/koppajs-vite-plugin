import * as sass from 'sass'
import autoprefixer from 'autoprefixer'
import postcss from 'postcss'

/**
 * Scopes plain CSS by prefixing selectors with a parent selector.
 * - Skips rules inside at-rules (e.g. @media) to avoid breaking nested structures.
 * - Only adjusts simple rule selectors (string-based), no AST cloning required.
 */
function scopeCss(css: string, parent: string): string {
  const prefix = ` ${parent} `
  const root = postcss.parse(css)

  root.walkRules((rule) => {
    // Skip rules directly under at-rules (@media, @supports, etc.)
    if (rule.parent && rule.parent.type === 'atrule') return

    // Defensive: selector can be empty in edge cases
    const selector = rule.selector?.trim()
    if (!selector) return

    if (selector.startsWith('.') || selector.startsWith('#')) {
      rule.selector = `${prefix}${selector}`
    } else {
      rule.selector = `${prefix} ${selector}`
    }
  })

  // Keep output reasonably compact (but still valid)
  return root.toString().replace(/\s+/g, ' ').replace(/\n/g, '')
}

type SassSyntax = 'sass' | 'scss'

function transpileToCss(code: string, type: SassSyntax, scope = ''): string {
  if (!code.trim()) {
    throw new Error('Invalid CSS code.')
  }

  const result = sass.compileString(code, {
    syntax: type === 'sass' ? 'indented' : 'scss',
  })

  let css = result.css

  if (scope) {
    css = scopeCss(css, scope)
  }

  const postcssResult = postcss([autoprefixer]).process(css, { from: undefined })
  return postcssResult.css
}

export default transpileToCss
