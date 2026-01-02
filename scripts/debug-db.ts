import 'dotenv/config'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { desc } from 'drizzle-orm'
import * as schema from '../src/db/schema'

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set')
    return
  }
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL)
    console.log(
      `🔗 Connecting to: ${url.hostname}:${url.port || '5432'} / ${url.pathname}`,
    )
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const db = drizzle(pool, { schema })

  console.log('--- USERS ---')
  const users = await db.select().from(schema.users)
  console.table(users)

  console.log('\n--- RECENT AUDIT LOGS ---')
  const auditLogsResult = await db
    .select()
    .from(schema.auditLogs)
    .orderBy(desc(schema.auditLogs.timestamp))
    .limit(20)
  console.table(auditLogsResult)

  console.log('\n--- CATALOG (CERTIFICATIONS) ---')
  const catalog = await db.select().from(schema.certifications)
  console.table(
    catalog.map((c) => ({ id: c.id, name: c.name, vendor: c.vendorName })),
  )

  console.log('\n--- USER CERTIFICATIONS ---')
  const userCertsResult = await db.select().from(schema.userCertifications)
  console.table(userCertsResult)

  await pool.end()
}

main().catch(console.error)
