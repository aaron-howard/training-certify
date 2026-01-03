import { defineConfig } from '@tanstack/react-start/config'

export default defineConfig({
  server: {
    // Use Vercel serverless preset for deployment
    preset: 'vercel',
  },
})
