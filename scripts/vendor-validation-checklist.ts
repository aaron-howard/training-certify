/**
 * Phase 2: Generate a validation checklist from the deduped vendor list.
 *
 * Outputs CSV with columns: vendorName, inCatalog, hasCertProgram, notes
 * for manual validation. Optionally marks vendors that appear in full_catalog.json.
 *
 * Usage:
 *   npx tsx scripts/vendor-validation-checklist.ts
 *   npx tsx scripts/vendor-validation-checklist.ts --batch-size=80
 *   npx tsx scripts/vendor-validation-checklist.ts --batch=2 --batch-size=50  # only batch 2
 */

import fs from 'node:fs'
import path from 'node:path'

const DEDUPED_PATH = path.join(
  process.cwd(),
  'data',
  'vendor-list-deduped.json',
)
const CATALOG_PATH = path.join(process.cwd(), 'data', 'full_catalog.json')
const OUT_DIR = path.join(process.cwd(), 'data')

function main() {
  const args = process.argv.slice(2)
  const batchSize = parseInt(
    args.find((a) => a.startsWith('--batch-size='))?.split('=')[1] ?? '50',
    10,
  )
  const batchArg = args.find((a) => a.startsWith('--batch='))
  const batchIndex = batchArg ? parseInt(batchArg.split('=')[1], 10) - 1 : null // 1-based to 0-based

  if (!fs.existsSync(DEDUPED_PATH)) {
    console.error(
      `❌ Deduped list not found at ${DEDUPED_PATH}. Run: npx tsx scripts/dedupe-vendor-list.ts`,
    )
    process.exit(1)
  }

  const deduped: Array<{ name: string }> = JSON.parse(
    fs.readFileSync(DEDUPED_PATH, 'utf-8'),
  )
  const vendorNames = deduped.map((v) => v.name)

  const catalogVendorNames = new Set<string>()
  if (fs.existsSync(CATALOG_PATH)) {
    try {
      const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'))
      if (Array.isArray(catalog)) {
        for (const entry of catalog) {
          const name = entry.vendorName
          if (name) catalogVendorNames.add(String(name).trim())
        }
      }
    } catch {
      // ignore
    }
  }

  let slice = vendorNames
  let batchLabel = 'all'
  if (batchIndex !== null && batchIndex >= 0) {
    const start = batchIndex * batchSize
    slice = vendorNames.slice(start, start + batchSize)
    batchLabel = `batch-${batchIndex + 1}`
  } else if (batchSize < vendorNames.length) {
    // output multiple batch files
    const numBatches = Math.ceil(vendorNames.length / batchSize)
    for (let i = 0; i < numBatches; i++) {
      const batch = vendorNames.slice(i * batchSize, (i + 1) * batchSize)
      const csv = [
        'vendorName,inCatalog,hasCertProgram,notes',
        ...batch.map(
          (name) =>
            `"${name.replace(/"/g, '""')}",${catalogVendorNames.has(name) ? 'Y' : ''},,`,
        ),
      ].join('\n')
      const outPath = path.join(
        OUT_DIR,
        `vendor-validation-${i + 1}-of-${numBatches}.csv`,
      )
      fs.writeFileSync(outPath, csv, 'utf-8')
      console.log(`Wrote ${batch.length} rows to ${outPath}`)
    }
    console.log(
      `✅ Generated ${numBatches} batch files (batch size ${batchSize}). Fill hasCertProgram (Y/N) and notes, then merge into vendor-cleanup-list.txt (names where hasCertProgram=N).`,
    )
    return
  }

  const csv = [
    'vendorName,inCatalog,hasCertProgram,notes',
    ...slice.map(
      (name) =>
        `"${name.replace(/"/g, '""')}",${catalogVendorNames.has(name) ? 'Y' : ''},,`,
    ),
  ].join('\n')
  const outPath = path.join(OUT_DIR, `vendor-validation-${batchLabel}.csv`)
  fs.writeFileSync(outPath, csv, 'utf-8')
  console.log(`✅ Wrote ${slice.length} rows to ${outPath}`)
  console.log(
    '   Fill hasCertProgram (Y/N) and notes. Vendors with N go on vendor-cleanup-list.txt.',
  )
}

main()
