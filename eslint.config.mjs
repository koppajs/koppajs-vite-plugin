import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

/** Globale Ignore-Liste (ersetzt .eslintignore) */
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
]

/** Gemeinsame Language-Options für TS/JS */
const languageOptions = {
  parser: tsParser,
  ecmaVersion: 'latest',
  sourceType: 'module',
}

export default [
  // 1) Ignore-Konfiguration
  {
    ignores,
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },

  // 2) TS/JS-Regeln
  {
    files: ['**/*.{ts,tsx,js,cjs,mjs}'],
    languageOptions,
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Basis: ESLint-Empfehlungen
      ...js.configs.recommended.rules,

      // TypeScript-Empfehlungen (ohne zu harte/noisy Regeln)
      ...tsPlugin.configs.recommended.rules,

      // TypeScript-spezifische Anpassungen/Overrides
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // optional: etwas weniger streng, wenn du viel refaktorierst
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Prettier bleibt der alleinige Formatter.
  eslintConfigPrettier,
]
