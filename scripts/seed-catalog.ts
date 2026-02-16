/**
 * Unified Certification Catalog Seed Script
 *
 * Seeds the certifications table from the comprehensive JSON catalog file.
 * Replaces the previous vendor-specific CSV seed scripts.
 *
 * Which database? The script uses DATABASE_URL from your environment. By default
 * `dotenv/config` loads .env (dev). To seed Neon PROD, set DATABASE_URL to your
 * production URL before running, or use --env-file=.env.db_production.
 *
 * Usage:
 *   npx tsx scripts/seed-catalog.ts                  # Seed from data/certification-catalog.json (uses .env = typically DEV)
 *   npx tsx scripts/seed-catalog.ts --file=data/expanded_certification _catalog.json
 *   npx tsx scripts/seed-catalog.ts --env-file=.env.db_production   # Load prod DB env then seed (e.g. Neon PROD)
 *   npx tsx scripts/seed-catalog.ts --limit=10       # Seed first 10 only
 *   npx tsx scripts/seed-catalog.ts --vendor=aws     # Seed only AWS certifications
 *   npx tsx scripts/seed-catalog.ts --dry-run        # Preview without inserting
 */

import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import { getDb } from '../src/db/db.server'
import { certifications, vendors } from '../src/db/schema'
import { validateCategory, validateDifficulty } from '../src/lib/enum-helpers'

// Load env before main runs (default .env = DEV; use --env-file=.env.db_production for Neon PROD)
const envFileArg = process.argv.find((a) => a.startsWith('--env-file='))
if (envFileArg) {
  const envPath = envFileArg.split('=').slice(1).join('=').trim()
  dotenv.config({ path: envPath })
} else {
  dotenv.config()
}

interface CatalogEntry {
  id: string
  name: string
  vendorId: string
  vendorName: string
  vendorLogo?: string | null
  category: string
  difficulty: string
  validityPeriod?: string | null
  renewalCycle?: number | null
  price?: string | null
  description?: string | null
}

const DEFAULT_CATALOG = path.join('data', 'certification-catalog.json')

async function main() {
  // Parse CLI arguments
  const args = process.argv.slice(2)
  const fileArg = args.find((arg) => arg.startsWith('--file='))
  const limitArg = args.find((arg) => arg.startsWith('--limit='))
  const vendorArg = args.find((arg) => arg.startsWith('--vendor='))
  const dryRun = args.includes('--dry-run')
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity
  const vendorFilter = vendorArg ? vendorArg.split('=')[1].toLowerCase() : null

  const catalogPath = path.resolve(
    process.cwd(),
    fileArg ? fileArg.split('=').slice(1).join('=').trim() : DEFAULT_CATALOG,
  )

  if (!fs.existsSync(catalogPath)) {
    console.error(`❌ Catalog file not found at ${catalogPath}`)
    console.error(
      '   Use --file=path/to/catalog.json or place data in data/certification-catalog.json',
    )
    process.exit(1)
  }

  // Log which DB we're using (host only, no secrets)
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || ''
  const dbHost = dbUrl ? new URL(dbUrl).hostname : '(not set)'
  console.log(`🗄️  Database: ${dbHost}`)

  console.log('📂 Reading certification catalog...')
  console.log(`   File: ${catalogPath}`)
  const content = fs.readFileSync(catalogPath, 'utf-8')
  let catalog: Array<CatalogEntry>

  try {
    catalog = JSON.parse(content)
  } catch (err) {
    console.error('❌ Failed to parse catalog JSON:', err)
    process.exit(1)
  }

  if (!Array.isArray(catalog)) {
    console.error('❌ Catalog must be a JSON array')
    process.exit(1)
  }

  // Apply vendor filter
  if (vendorFilter) {
    catalog = catalog.filter((c) => c.vendorId.toLowerCase() === vendorFilter)
    console.log(
      `🔍 Filtered to vendor "${vendorFilter}": ${catalog.length} certifications`,
    )
  }

  // Apply limit
  const toProcess = Math.min(catalog.length, limit)
  const entries = catalog.slice(0, toProcess)

  console.log(
    `🚀 Starting seed. Total in catalog: ${catalog.length}. Processing: ${toProcess}${dryRun ? ' (DRY RUN)' : ''}`,
  )

  if (dryRun) {
    console.log('\n📋 Certifications that would be seeded:\n')
    for (const entry of entries) {
      console.log(
        `  ${entry.id.padEnd(40)} ${entry.vendorName.padEnd(20)} ${entry.category.padEnd(22)} ${entry.difficulty}`,
      )
    }
    console.log(
      `\n✅ Dry run complete. ${entries.length} certifications would be seeded.`,
    )
    process.exit(0)
  }

  const db = await getDb()
  if (!db) {
    console.error('❌ Database not available. Is DATABASE_URL set?')
    process.exit(1)
  }

  let addedCount = 0
  let conflictCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const entry of entries) {
    try {
      const category = validateCategory(entry.category)
      const difficulty = validateDifficulty(entry.difficulty)

      if (!category || !difficulty) {
        console.warn(
          `⚠️  Skipping "${entry.name}": invalid category (${entry.category}) or difficulty (${entry.difficulty})`,
        )
        skippedCount++
        continue
      }

      await db
        .insert(vendors)
        .values({
          id: entry.vendorId,
          name: entry.vendorName,
          logo: entry.vendorLogo ?? null,
        })
        .onConflictDoUpdate({
          target: vendors.id,
          set: { name: entry.vendorName, logo: entry.vendorLogo ?? null },
        })

      const result = await db
        .insert(certifications)
        .values({
          id: entry.id,
          name: entry.name,
          vendorId: entry.vendorId,
          category,
          difficulty,
          validityPeriod: entry.validityPeriod || null,
          renewalCycle: entry.renewalCycle || null,
          price: entry.price || null,
          description: entry.description || null,
        })
        .onConflictDoNothing({ target: certifications.id })
        .returning({ id: certifications.id })

      if (result.length > 0) {
        addedCount++
      } else {
        conflictCount++
      }
    } catch (err) {
      errorCount++
      console.error(
        `❌ Error seeding "${entry.name}" (${entry.id}):`,
        err instanceof Error ? err.message : String(err),
      )
    }
  }

  console.log('\n📊 Seed Results:')
  console.log(`   ✅ Added:    ${addedCount} (new rows inserted)`)
  console.log(`   ⏭️  Conflict: ${conflictCount} (ID already in DB, skipped)`)
  console.log(`   ⚠️  Skipped:  ${skippedCount} (invalid category/difficulty)`)
  console.log(`   ❌ Errors:   ${errorCount}`)
  console.log(`   📦 Total:    ${entries.length}`)
  if (conflictCount > 0 && addedCount === 0) {
    console.log(
      '\n   💡 All entries already exist. To add new certifications, use a catalog file with different IDs, or remove existing rows from the certifications table.',
    )
  }

  // Print vendor breakdown
  const vendorCounts = new Map<string, number>()
  for (const entry of entries) {
    vendorCounts.set(
      entry.vendorName,
      (vendorCounts.get(entry.vendorName) || 0) + 1,
    )
  }
  console.log('\n📦 By Vendor:')
  for (const [vendor, count] of [...vendorCounts.entries()].sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`   ${vendor.padEnd(35)} ${count}`)
  }

  console.log('\n✅ Catalog seed complete!')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
