import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'

/** Globale Ignore-Liste (ersetzt .eslintignore). TypeScript prüft oxlint. */
const ignores = [
  '.ai/**',
  '.git',
  '.history/**',
  '.vscode/**',
  '.idea/**',
  '.local/**',
  'node_modules/**',
  'dist',
  'dist/**',
  'coverage',
  'coverage/**',
  'pnpm-lock.yaml',
  'package-lock.json',
  '**/*_del',
  '---*',
  '**/*.{ts,tsx,mts,cts}',
]

export default [
  { ignores },
  {
    files: ['**/*.{js,cjs,mjs}'],
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // Prettier bleibt der alleinige Formatter.
  eslintConfigPrettier,
]
