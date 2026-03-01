export default {
  '**/*.{ts,js,tsx,mjs,cjs,json}': [
    'pnpm lint',
    'prettier --config prettier.config.mjs --write',
  ],
  '**/*.{md,yaml}': ['prettier --config prettier.config.mjs --write'],
}
