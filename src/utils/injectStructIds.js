/**
 * Injects `data-k-struct` attributes into all elements of a given HTML template string.
 *
 * @param {string} template - The HTML template string.
 * @param {string} seed - The seed value to generate unique struct IDs.
 * @returns {string} - The modified template string with `data-k-struct` attributes.
 */
export function injectStructIdsIntoTemplate(template, seed) {
  let counter = 0;
  return template.replace(/<([a-zA-Z][^\s/>]*)/g, (match, tagName) => {
    const structId = `${seed}-${counter++}`;
    return `<${tagName} data-k-struct="${structId}"`;
  });
}