import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      '**/*.json',
      'public/**',
      'uploads/**',
      '.claude/**',
      '.agents/**',
    ],
  },
  {
    files: ['src/**/*.{js,jsx,ts,tsx}', '*.{js,jsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        URL: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        HTMLElement: 'readonly',
        HTMLUListElement: 'readonly',
        requestAnimationFrame: 'readonly',
        React: 'readonly',
        JSX: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs['recommended'].rules,
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
];
