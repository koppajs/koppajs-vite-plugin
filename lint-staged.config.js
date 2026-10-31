export default {
  '**/*.{js,mjs,cjs}': [
    'eslint --fix --max-warnings=0',
    'prettier --config prettier.config.mjs --write',
  ],
  '**/*.{ts,tsx,mts,cts}': [
    'oxlint --fix --max-warnings=0',
    'prettier --config prettier.config.mjs --write',
  ],
  '**/*.{json,md,yml,yaml}': ['prettier --config prettier.config.mjs --write'],
}
