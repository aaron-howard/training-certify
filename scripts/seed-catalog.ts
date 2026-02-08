/**
 * Unified Certification Catalog Seed Script
 *
 * Seeds the certifications table from the comprehensive JSON catalog file.
 * Replaces the previous vendor-specific CSV seed scripts.
 *
 * Usage:
 *   npx tsx scripts/seed-catalog.ts                  # Seed all certifications
 *   npx tsx scripts/seed-catalog.ts --limit=10       # Seed first 10 only
 *   npx tsx scripts/seed-catalog.ts --vendor=aws     # Seed only AWS certifications
 *   npx tsx scripts/seed-catalog.ts --dry-run        # Preview without inserting
 */

import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { getDb } from '../src/db/db.server'
import { certifications } from '../src/db/schema'
import { validateCategory, validateDifficulty } from '../src/lib/enum-helpers'

interface CatalogEntry {
  id: string
  name: string
  vendorId: string
  vendorName: string
  category: string
  difficulty: string
  validityPeriod?: string | null
  renewalCycle?: number | null
  price?: string | null
  description?: string | null
}

async function main() {
  const catalogPath = path.resolve(
    process.cwd(),
    'data',
    'certification-catalog.json',
  )

  if (!fs.existsSync(catalogPath)) {
    console.error(`❌ Catalog file not found at ${catalogPath}`)
    console.error('   Expected: data/certification-catalog.json')
    process.exit(1)
  }

  // Parse CLI arguments
  const args = process.argv.slice(2)
  const limitArg = args.find((arg) => arg.startsWith('--limit='))
  const vendorArg = args.find((arg) => arg.startsWith('--vendor='))
  const dryRun = args.includes('--dry-run')
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity
  const vendorFilter = vendorArg ? vendorArg.split('=')[1].toLowerCase() : null

  console.log('📂 Reading certification catalog...')
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
        .insert(certifications)
        .values({
          id: entry.id,
          name: entry.name,
          vendorId: entry.vendorId,
          vendorName: entry.vendorName,
          category,
          difficulty,
          validityPeriod: entry.validityPeriod || null,
          renewalCycle: entry.renewalCycle || null,
          price: entry.price || null,
          description: entry.description || null,
        })
        .onConflictDoNothing()

      addedCount++
    } catch (err) {
      errorCount++
      console.error(
        `❌ Error seeding "${entry.name}" (${entry.id}):`,
        err instanceof Error ? err.message : String(err),
      )
    }
  }

  console.log('\n📊 Seed Results:')
  console.log(`   ✅ Added:   ${addedCount}`)
  console.log(`   ⏭️  Skipped: ${skippedCount}`)
  console.log(`   ❌ Errors:  ${errorCount}`)
  console.log(`   📦 Total:   ${entries.length}`)

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
