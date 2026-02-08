import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import path from 'path'
import type { Plugin } from 'vite'

// Plugin to stub server-only files for client builds ONLY
const stubServerFiles = (): Plugin => {
  let isSSRBuild = false

  return {
    name: 'stub-server-files',
    enforce: 'pre' as const,
    // Detect SSR build phase
    configResolved(config) {
      // Check if this is an SSR build
      isSSRBuild = config.build.ssr !== undefined && config.build.ssr !== false
    },
    resolveId(id) {
      // Only stub during client builds (not SSR/Nitro)
      if (isSSRBuild) return null

      // Match any import of logging.server
      const isLoggingServerImport =
        (id === './logging.server' ||
          id === '../lib/logging.server' ||
          id === 'logging.server' ||
          id.endsWith('/logging.server') ||
          id.includes('/logging.server') ||
          id.includes('logging.server')) &&
        !id.includes('.nitro') &&
        !id.includes('logging.client-stub')

      if (isLoggingServerImport) {
        return path.resolve(process.cwd(), 'src/lib/logging.client-stub.ts')
      }
      return null
    },
  }
}

const config = defineConfig({
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  plugins: [
    devtools(),
    // Stub server files for client builds to prevent bundling errors
    stubServerFiles(),
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
  },
  // SSR: Vite externalizes node_modules for SSR by default, which avoids
  // circular dependency TDZ errors (e.g. BaseRoute) that occur when
  // everything is inlined into a single SSR bundle via noExternal: true.
  // Nitro handles dependency bundling during its own build phase.
  //
  // Client code splitting: Let Vite/Rollup handle chunking automatically.
  // Custom manualChunks breaks React's internal module initialization order
  // (scheduler, react-dom, etc.) causing hydration failures.
  build: {
    chunkSizeWarningLimit: 600,
  },
})

export default config
