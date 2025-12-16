import * as sass from 'sass'
import postcss from 'postcss'
import autoprefixer from 'autoprefixer'

function scopeCss(css: string, parent: string): string {
  const selector = ` ${parent} `
  let scopedCss = ''

  const ast = postcss.parse(css)
  ast.walkRules((rule: any) => {
    if (!rule.parent || rule.parent.type === 'atrule') {
      scopedCss += rule.toString()
      return
    }

    if (rule.selector.startsWith('.') || rule.selector.startsWith('#')) {
      rule.selector = `${selector}${rule.selector}`
    } else {
      rule.selector = `${selector} ${rule.selector}`
    }

    scopedCss += rule.toString()
    scopedCss = scopedCss.replace(/\s+/g, ' ').replace(/\n/g, '')
  })

  return scopedCss
}

function transpileToCss(code: string, type: string, scope = ''): string {
  if (type !== 'sass' && type !== 'scss') {
    throw new Error(`Invalid type '${type}'. Only 'sass' or 'scss' are allowed.`)
  }

  if (!code.trim()) {
    throw new Error('Invalid CSS code.')
  }

  // Nutzung der neuen API
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
