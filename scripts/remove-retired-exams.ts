import { inArray, sql } from 'drizzle-orm'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as dotenv from 'dotenv'
import * as schema from '../src/db/schema'

dotenv.config()

const RETIRED_LEGACY_PREFIXES = [
  '70-',
  '74-',
  '77-',
  '98-',
  'MB2-',
  'MB3-',
  'MB4-',
  'MB5-',
  'MB6-',
]
const RETIRED_SPECIFIC_CODES = [
  'AZ-100',
  'AZ-101',
  'AZ-102',
  'AZ-103',
  'AZ-200',
  'AZ-201',
  'AZ-202',
  'AZ-203',
  'AZ-300',
  'AZ-301',
  'AZ-302',
  'AZ-303',
  'AZ-304',
  'AI-100',
  'AZ-600',
  'AZ-720',
  'MS-100',
  'MS-101',
  'MS-200',
  'MS-201',
  'MS-202',
  'MS-300',
  'MS-301',
  'MS-600',
  'MS-740',
  'MD-100',
  'MD-101',
  'MB-200',
  'MB-400',
  'MB-600',
  'MB-900',
  'MB-901',
]

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })
  const db = drizzle(pool, { schema })

  console.log('Fetching Microsoft certifications to identify retired ones...')
  const msCerts = await db
    .select()
    .from(schema.certifications)
    .where(sql`vendor_id = 'microsoft' OR vendor_id = 'msft'`)

  const toDelete = msCerts.filter((c) => {
    const code = c.id
      .replace('microsoft-', '')
      .replace('msft-', '')
      .toUpperCase()

    const isLegacy = RETIRED_LEGACY_PREFIXES.some((prefix) =>
      code.startsWith(prefix),
    )
    const isSpecific = RETIRED_SPECIFIC_CODES.some(
      (retiredCode) => code === retiredCode.toUpperCase(),
    )

    return isLegacy || isSpecific
  })

  if (toDelete.length === 0) {
    console.log('No retired Microsoft exams found in the database.')
    process.exit(0)
  }

  console.log(`Found ${toDelete.length} retired exams to remove.`)

  const idsToDelete = toDelete.map((c) => c.id)

  // Perform deletion in chunks if necessary, but here we can probably do it in one go or batches
  const BATCH_SIZE = 100
  for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
    const batch = idsToDelete.slice(i, i + BATCH_SIZE)
    console.log(`Deleting batch ${i / BATCH_SIZE + 1}...`)
    await db
      .delete(schema.certifications)
      .where(inArray(schema.certifications.id, batch))
  }

  console.log('✅ Successfully removed all retired Microsoft exams.')
  process.exit(0)
}

main().catch(console.error)
