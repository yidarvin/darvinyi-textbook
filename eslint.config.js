import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['playwright.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // Widgets and diagrams predate eslint-plugin-react-hooks v7's stricter
    // rules (refs-during-render, components-defined-in-render, etc.), plus a
    // handful of pre-existing unused locals. Rewriting all 101 widgets'
    // internals to match is a separately-scoped effort (see
    // context/V2_PLAN.md), not a lint-config task — downgrade to warnings
    // here so real errors elsewhere aren't drowned out and `npm run lint`
    // stays a useful signal.
    files: ['src/components/widgets/**/*.jsx', 'src/components/diagrams/**/*.jsx'],
    rules: {
      'no-unused-vars': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/immutability': 'warn',
    },
  },
])
