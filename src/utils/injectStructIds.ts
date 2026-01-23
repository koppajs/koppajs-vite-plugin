// Injects data-k-struct attributes into every HTML element node.
// Uses a simple regex-based approach, no DOMParser, no external deps.
// Note: Only matches standard HTML element tags (starting with a letter).
// Doctypes, comments, and processing instructions are naturally skipped
// because they don't match the element tag pattern.
import { createStructIdFactory } from './structId.js'
import { STRUCT_ATTR } from './identityConstants.js'

export function injectStructIdsIntoTemplate(templateHtml: string, seed: string): string {
  const nextId = createStructIdFactory(seed)
  // Regex to match HTML opening tags: <tag ...> or <tag .../>
  // Only matches tags starting with a letter (standard HTML elements).
  // Captures: (1) tag name, (2) attributes, (3) optional self-close slash
  const tagRegex = /<([a-zA-Z][a-zA-Z0-9-]*)([^>]*?)(\/?)>/g

  return templateHtml.replace(tagRegex, (match, tag, attrs, selfClose) => {
    // If already has the struct attribute, return unchanged
    if (attrs.includes(STRUCT_ATTR + '=') || attrs.includes(STRUCT_ATTR + ' ')) {
      return match
    }

    const id = nextId()
    const inject = ` ${STRUCT_ATTR}="${id}"`

    if (selfClose) {
      return `<${tag}${attrs}${inject}/>`
    } else {
      return `<${tag}${attrs}${inject}>`
    }
  })
}
