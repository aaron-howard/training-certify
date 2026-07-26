import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        'dist/',
        '.tanstack/',
        'drizzle/',
      ],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      // Enforce the current all-source baseline; raise thresholds as coverage increases.
      thresholds: {
        lines: 25,
        functions: 25,
        branches: 25,
        statements: 25,
      },
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.tanstack'],
    testTimeout: 10000,
    // Run test files in parallel (default); isolate so mocks and state don't leak
    fileParallelism: true,
    isolate: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
