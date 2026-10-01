import globals from 'globals';
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'coverage/**'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
    },
  },
];
