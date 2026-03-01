import * as sass from 'sass'
import autoprefixer from 'autoprefixer'
import postcss from 'postcss'

type SassSyntax = 'sass' | 'scss'

/**
 * Transpiles SCSS/SASS code to CSS with autoprefixer support.
 * CSS is emitted exactly as authored (no selector scoping).
 * Returns empty string for empty/whitespace-only input.
 */
function transpileToCss(code: string, type: SassSyntax): string {
  if (!code.trim()) {
    return ''
  }

  const result = sass.compileString(code, {
    syntax: type === 'sass' ? 'indented' : 'scss',
  })

  const postcssResult = postcss([autoprefixer]).process(result.css, { from: undefined })
  return postcssResult.css
}

export default transpileToCss
