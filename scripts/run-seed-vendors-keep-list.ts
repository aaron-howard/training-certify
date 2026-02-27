/**
 * Run the vendor keep-list seed SQL against the database.
 * Uses DATABASE_URL from environment (.env by default; use --env-file for prod).
 *
 * Usage:
 *   pnpm run db:seed-vendors                    # uses .env (dev)
 *   pnpm run db:seed-vendors -- --env-file=.env.db_production
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { Pool } from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const envFileArg = process.argv.find((a) => a.startsWith('--env-file='))
if (envFileArg) {
  const envPath = path.resolve(envFileArg.split('=').slice(1).join('=').trim())
  dotenv.config({ path: envPath })
} else {
  dotenv.config()
}

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) {
  console.error(
    '❌ DATABASE_URL is not set. Set it in .env or pass --env-file=.env.db_production',
  )
  process.exit(1)
}

const sqlPath = path.join(__dirname, 'seed-vendors-keep-list.sql')
const sql = fs.readFileSync(sqlPath, 'utf8')

const pool = new Pool({ connectionString: dbUrl })

async function main() {
  try {
    await pool.query(sql)
    console.log('✅ Vendor keep-list seed completed successfully.')
  } catch (err) {
    console.error('❌ Seed failed:', err instanceof Error ? err.message : err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
