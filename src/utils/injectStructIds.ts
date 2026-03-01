// Injects data-k-struct attributes into custom element nodes only.
// Custom elements need structId to preserve their instance after re-rendering.
// Regular HTML elements don't have instances, so they don't need this attribute.
// Uses a simple regex-based approach, no DOMParser, no external deps.
import { createStructIdFactory } from './structId.js'
import { STRUCT_ATTR } from './identityConstants.js'

/**
 * Checks if a tag name represents a custom element (contains a hyphen).
 */
function isCustomElementTag(tag: string): boolean {
  return tag.includes('-')
}

export function injectStructIdsIntoTemplate(templateHtml: string, seed: string): string {
  const nextId = createStructIdFactory(seed)
  // Regex to match HTML opening tags: <tag ...> or <tag .../>
  // Only matches tags starting with a letter (standard HTML elements).
  // Captures: (1) tag name, (2) attributes, (3) optional self-close slash
  const tagRegex = /<([a-zA-Z][a-zA-Z0-9-]*)([^>]*?)(\/?)>/g

  return templateHtml.replace(tagRegex, (match, tag, attrs, selfClose) => {
    // Only inject structId for custom elements (tags with hyphen)
    if (!isCustomElementTag(tag)) {
      return match
    }

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
