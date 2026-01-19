// Injects data-k-struct attributes into every HTML element node
// Minimal HTML tokenizer, no DOMParser, no external deps
import { createStructIdFactory } from './structId';
import { STRUCT_ATTR } from './identityConstants';

const VOID_ELEMENTS = new Set([
  'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr',
]);

export function injectStructIdsIntoTemplate(templateHtml: string, seed: string): string {
  const nextId = createStructIdFactory(seed);
  // Regex to match HTML opening tags: <tag ...> or <tag .../> 
  // Captures: (1) tag name, (2) attributes, (3) optional self-close slash, (4) closing >
  const tagRegex = /<([a-zA-Z][a-zA-Z0-9\-]*)([^>]*?)(\/?)>/g;
  
  return templateHtml.replace(tagRegex, (match, tag, attrs, selfClose) => {
    // Skip doctype, comments
    if (tag.startsWith('!')) return match;
    
    // If already has the struct attribute, return unchanged
    if (attrs.includes(STRUCT_ATTR + '=') || attrs.includes(STRUCT_ATTR + ' ')) {
      return match;
    }
    
    const id = nextId();
    const inject = ` ${STRUCT_ATTR}="${id}"`;
    
    if (selfClose) {
      return `<${tag}${attrs}${inject}/>`;
    } else {
      return `<${tag}${attrs}${inject}>`;
    }
  });
}
