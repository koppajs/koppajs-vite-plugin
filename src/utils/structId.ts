// Utility for deterministic structId generation
// No external dependencies

export function createStructIdFactory(seed: string): () => string {
  // Use the seed as a prefix/namespace, but ids are always s1, s2, ...
  // The seed is only for namespacing, not for randomness
  let counter = 1
  // Use a simple hash of the seed for prefixing
  const prefix = 's' + stableHash(seed) + '-'
  return () => `${prefix}${counter++}`
}

export function normalizeStructSeed(inputPath: string, template: string): string {
  // Create a stable seed string from file path + template content
  // Use a simple reducer: char codes sum and length
  let hash = 0
  for (let i = 0; i < inputPath.length; i++)
    hash = (hash * 31 + inputPath.charCodeAt(i)) >>> 0
  for (let i = 0; i < template.length; i++)
    hash = (hash * 31 + template.charCodeAt(i)) >>> 0
  return hash.toString(36)
}

function stableHash(str: string): string {
  // Simple stable hash for prefixing
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  return hash.toString(36)
}
