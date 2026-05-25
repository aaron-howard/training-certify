import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

if (!process.env.DATABASE_URL) {
  console.warn(
    '⚠️ DATABASE_URL is not set in environment variables. Drizzle Kit might fail.',
  )
}

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL is required for Drizzle Kit. Set it in .env (see SETUP.md).',
    )
  }
  return url
}

export default defineConfig({
  out: './src/db/migrations',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDatabaseUrl(),
  },
})
