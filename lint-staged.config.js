export default {
  '**/*.{ts,js,tsx,mjs,cjs,json}': ['pnpm lint:scripts', 'prettier --write'],
  '**/*.{md,yaml}': ['prettier --write'],
}
