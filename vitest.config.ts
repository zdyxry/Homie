import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.output', '.wxt'],
  },
  resolve: {
    alias: {
      '~': __dirname,
      '@': __dirname + '/entrypoints',
    },
  },
});
