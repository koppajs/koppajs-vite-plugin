export default {
  '**/*.{ts,js,tsx,mjs,cjs}': [
    'eslint --fix --max-warnings=0',
    'prettier --config prettier.config.mjs --write',
  ],
  '**/*.{json,md,yml,yaml}': ['prettier --config prettier.config.mjs --write'],
}
