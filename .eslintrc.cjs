/* eslint-env node */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'dist-electron', 'release', 'coverage', 'node_modules'],
  rules: {
    // noUnusedLocals/noUnusedParameters in tsconfig already cover these; keep
    // ESLint aligned and avoid double-reporting.
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    // rules-of-hooks is still enforced; exhaustive-deps is intentionally left
    // off to avoid a large migration of existing effect dependencies.
    'react-hooks/exhaustive-deps': 'off',
  },
};
