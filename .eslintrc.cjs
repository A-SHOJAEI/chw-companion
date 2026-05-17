/* eslint-env node */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  settings: { react: { version: 'detect' } },
  ignorePatterns: ['node_modules', 'android', 'ios', 'web/dist', 'dist', 'build', '*.config.*'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    // expo-asset's canonical pattern is `Asset.fromModule(require('./foo.png'))`.
    // The asset bundler resolves the require at build time, so this is real
    // and intentional, not a CommonJS leak.
    '@typescript-eslint/no-require-imports': 'off',
    // React 19's experimental `set-state-in-effect` rule is overly strict
    // for the canonical async-load-on-mount pattern (the setState happens in
    // an async continuation, not in the effect body synchronously).
    'react-hooks/set-state-in-effect': 'off',
  },
  overrides: [
    {
      files: ['__tests__/**/*.ts', '*.config.ts', 'vitest.config.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
      },
    },
  ],
};
