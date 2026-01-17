// Injects data-k-struct attributes into every HTML element node
// Minimal HTML tokenizer, no DOMParser, no external deps
import { createStructIdFactory } from './structId';
import { STRUCT_ATTR } from './identityConstants';

const VOID_ELEMENTS = new Set([
  'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr',
]);

export function injectStructIdsIntoTemplate(templateHtml: string, seed: string): string {
  const nextId = createStructIdFactory(seed);
  // Regex to match HTML tags (not comments, not doctype)
  // <tag ...> or <tag .../>
  // We will not match text nodes, comments, or doctype
  return templateHtml.replace(/<([a-zA-Z0-9\-]+)([^>]*?)(\/)?/g, (match, tag, attrs, selfClose) => {
    // Skip doctype
    if (/^!/.test(tag)) return match;
    // If already has the struct attribute anywhere in the tag, return the tag unchanged (preserve formatting)
    const attrRegex = new RegExp(`\\s${STRUCT_ATTR}(=|\\s|>|$)`);
    if (attrRegex.test(match)) return match;
    // Only inject into normal/custom elements, not script/style/svg/textarea
    // (But custom elements with - are included)
    // Add attribute before closing > or />
    const id = nextId();
    const inject = ` ${STRUCT_ATTR}="${id}"`;
    // Place before selfClose or >
    if (selfClose) {
      return `<${tag}${attrs}${inject}/>`;
    } else {
      return `<${tag}${attrs}${inject}>`;
    }
  });
}
