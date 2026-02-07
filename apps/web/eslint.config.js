import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';

export default [
  {
    ignores: ['dist/', '.astro/', 'node_modules/', 'playwright-report/', 'test-results/'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  ...svelte.configs['flat/recommended'],

  // Default to browser globals for app source.
  {
    files: ['src/**/*.{ts,js,svelte,astro}', 'tests/**/*.{ts,js}'],
    languageOptions: {
      globals: globals.browser,
    },
  },

  // Ensure TypeScript in .svelte files is parsed correctly.
  {
    files: ['**/*.svelte'],
    languageOptions: {
      globals: globals.browser,
      parser: svelteParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.svelte'],
        sourceType: 'module',
      },
    },
    rules: {
      // This rule is nice but too strict for our current style.
      'svelte/prefer-svelte-reactivity': 'off',
    },
  },

  // Node-only config files
  {
    files: [
      'astro.config.mjs',
      'eslint.config.js',
      'prettier.config.cjs',
      'playwright.config.ts',
      'vitest.config.ts',
      'scripts/**/*.{js,mjs,cjs,ts}',
    ],
    languageOptions: {
      globals: globals.node,
    },
  },
];
