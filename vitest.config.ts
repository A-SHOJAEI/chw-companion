import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    globals: false,
  },
  resolve: {
    alias: {
      // Stub native modules that don't load in Node — tests mock these per file.
      'cactus-react-native': new URL('./__tests__/__mocks__/cactus-react-native.ts', import.meta.url).pathname,
      'expo-secure-store': new URL('./__tests__/__mocks__/expo-secure-store.ts', import.meta.url).pathname,
      '@op-engineering/op-sqlite': new URL('./__tests__/__mocks__/op-sqlite.ts', import.meta.url).pathname,
    },
  },
});
