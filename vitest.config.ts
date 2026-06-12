import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    exclude: ['**/node_modules/**', '**/.claude/**', '**/dist/**'],
  },
  resolve: {
    alias: { '@': new URL('.', import.meta.url).pathname },
  },
})
