const globals = require('globals');

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    project: './tsconfig.eslint.json',
    tsconfigRootDir: __dirname,
  },
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: [
    '*.config.js',
    '*.config.ts',
    'eslint.config.js',
    'svelte.config.js',
    'llama.cpp/**',
    'node_modules/**',
    'dist/**',
    'build/**',
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^[A-Z_]|^_' },
    ],
    '@typescript-eslint/no-explicit-any': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    'react/prop-types': 'off',
    'react/display-name': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    'no-mixed-spaces-and-tabs': 'off',
    'no-constant-condition': 'off',
    semi: ['warn', 'always'],
    quotes: ['warn', 'single'],
    indent: ['warn', 2, { SwitchCase: 1 }],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};