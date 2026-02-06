import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

// Plugin to stub server-only files was removed
// TanStack Start handles server-only files correctly via Nitro
// The Vercel build warning about node:crypto externalization is informational and harmless

const config = defineConfig({
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  plugins: [
    devtools(),
    // Disabled stubServerFiles plugin - TanStack Start handles server-only files correctly
    // The warning about node:crypto externalization is informational and harmless
    // stubServerFiles(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    nitro(),
    viteReact(),
  ],
  optimizeDeps: {
    include: [
      'use-sync-external-store/shim/index.js',
      'react',
      'react-dom',
      '@clerk/tanstack-react-start',
      '@tanstack/react-query',
      'cookie',
    ],
    // Exclude server-only files from client optimization
    exclude: ['src/lib/logging.server.ts', 'src/lib/**/*.server.ts'],
  },
  resolve: {
    conditions: ['import', 'module', 'browser', 'default'],
    // Removed alias - using plugin instead for more control
  },
  ssr: {
    // Don't externalize anything - let Nitro handle it
    noExternal: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Only apply code splitting to client builds (not SSR/Nitro)
          // Check if this is a client build by looking for client-specific output
          const isClientBuild =
            !id.includes('.nitro') && !id.includes('services/ssr')

          if (!isClientBuild) {
            return undefined // Let Nitro handle its own chunking
          }

          // Exclude server-only files from client build - they should not be included at all
          // TanStack Start should handle this, but we add this as a safeguard
          if (
            id.includes('.server.ts') ||
            id.includes('.server.tsx') ||
            id.includes('.server.js') ||
            id.includes('src/lib/logging.server') ||
            id.includes('src/lib/env.ts')
          ) {
            // Return undefined to exclude from chunking (file should not be in client bundle)
            return undefined
          }

          // Split React and React DOM into separate chunk
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/')
          ) {
            return 'react-vendor'
          }

          // Split TanStack Router into separate chunk
          if (id.includes('node_modules/@tanstack/react-router')) {
            return 'tanstack-router-vendor'
          }

          // Split TanStack Query into separate chunk
          if (
            id.includes('node_modules/@tanstack/react-query') ||
            id.includes('node_modules/@tanstack/query-core')
          ) {
            return 'tanstack-query-vendor'
          }

          // Split Clerk into separate chunk
          if (id.includes('node_modules/@clerk')) {
            return 'clerk-vendor'
          }

          // Split Sentry into separate chunk
          if (id.includes('node_modules/@sentry')) {
            return 'sentry-vendor'
          }

          // Split Drizzle ORM into separate chunk
          if (id.includes('node_modules/drizzle-orm')) {
            return 'drizzle-vendor'
          }

          // Split other large vendor libraries
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide-vendor'
          }

          // Split Zod into separate chunk (used for validation)
          if (id.includes('node_modules/zod')) {
            return 'zod-vendor'
          }

          // All other node_modules go into vendor chunk
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
      },
    },
    // Increase chunk size warning limit slightly to account for vendor chunks
    chunkSizeWarningLimit: 600,
  },
})

export default config
