import { defineConfig } from '@tanstack/react-start/config'

export default defineConfig({
  server: {
    // Use Nitro as the server runtime
    preset: 'node-server',
  },
})
