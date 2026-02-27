import path from 'node:path'
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
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
      all: true,
      // Enforce minimum to prevent regression. Target 80% per TASK.md Phase 1.2; raise thresholds as coverage increases.
      thresholds: {
        lines: 25,
        functions: 50,
        branches: 50,
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
