import js from '@eslint/js';
import globals from 'globals';
import pluginVue from 'eslint-plugin-vue';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  { ignores: ['node_modules', 'dist', 'build'] },
  {
    files: ['**/*.{js,mjs,cjs,vue}'],
    plugins: { js },
    extends: ['js/recommended'],
  },
  pluginVue.configs['flat/essential'],
  {
    files: ['**/*.{js,mjs,cjs,vue}'],
    languageOptions: { globals: globals.browser },
    rules: {
      'vue/multi-word-component-names': 'off', // Disable error for single-word component names
      'vue/no-parsing-error': 'off',
      // 'no-console': 'warn', // Warns if console.log is left in the code
      // 'no-debugger': 'error', // Disallows debugger statements
      'no-unused-vars': 'warn', // Warn for declared but unused variables
      eqeqeq: ['error', 'always'], // Enforce the use of === instead of ==
      // curly: ['error', 'all'], // Require curly braces for all control blocks (if, else, etc.)
      'no-var': 'error', // Disallow var; enforce let or const instead
      'prefer-const': 'warn', // Suggest using const if variable is not reassigned
      'comma-dangle': ['warn', 'only-multiline'], // Allow trailing comma only in multiline constructs
      'key-spacing': ['warn', { beforeColon: false, afterColon: true }], // Enforce spacing around object keys and colons
      'space-before-blocks': ['warn', 'always'], // Require a space before opening brace
      quotes: ['warn', 'single'], // Enforce the use of single quotes
      // 'vue/max-attributes-per-line': [
      //   // Limit number of attributes per line in HTML tags
      //   'warn',
      //   {
      //     singleline: 4,
      //     multiline: { max: 2 },
      //   },
      // ],
      'vue/this-in-template': 'error', // Disallow usage of `this` in template expressions
      'vue/order-in-components': [
        'warn',
        {
          order: ['name', 'components', 'props', 'data', 'computed', 'methods', 'watch', 'mounted'],
        },
      ],
    },
  },
]);
