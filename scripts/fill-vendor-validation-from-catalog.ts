/**
 * Phase 2 completion helper: fill vendor-validation-*-of-8.csv from the
 * production seed catalog (data/certification-catalog.json).
 *
 * Rules:
 * - Vendor in seed catalog → inCatalog=Y, hasCertProgram=Y
 * - Vendor not in seed catalog → hasCertProgram=N, notes explain deferral
 * - Writes vendor-cleanup-list.txt for hasCertProgram=N (Phase 3 input)
 *
 * Usage:
 *   npx tsx scripts/fill-vendor-validation-from-catalog.ts
 *   npx tsx scripts/fill-vendor-validation-from-catalog.ts --dry-run
 */

import fs from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.join(process.cwd(), 'data')
const CATALOG_PATH = path.join(DATA_DIR, 'certification-catalog.json')
const FULL_CATALOG_PATH = path.join(DATA_DIR, 'full_catalog.json')
const CLEANUP_PATH = path.join(DATA_DIR, 'vendor-cleanup-list.txt')

function escapeCsv(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function loadCatalogVendorNames(): Set<string> {
  const names = new Set<string>()
  for (const filePath of [CATALOG_PATH, FULL_CATALOG_PATH]) {
    if (!fs.existsSync(filePath)) continue
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      if (!Array.isArray(data)) continue
      for (const entry of data) {
        const name = entry.vendorName || entry.vendor
        if (name) names.add(String(name).trim().toLowerCase())
      }
    } catch {
      // ignore malformed optional sources
    }
  }
  return names
}

function parseCsvLine(line: string): {
  vendorName: string
  inCatalog: string
  hasCertProgram: string
  notes: string
} {
  // vendorName may be quoted
  const match = line.match(/^"((?:[^"]|"")*)",(.*)$/)
  if (match) {
    const vendorName = match[1].replace(/""/g, '"')
    const rest = match[2].split(',')
    return {
      vendorName,
      inCatalog: rest[0] ?? '',
      hasCertProgram: rest[1] ?? '',
      notes: rest.slice(2).join(',').replace(/^"|"$/g, ''),
    }
  }
  const parts = line.split(',')
  return {
    vendorName: parts[0] ?? '',
    inCatalog: parts[1] ?? '',
    hasCertProgram: parts[2] ?? '',
    notes: parts.slice(3).join(','),
  }
}

function main() {
  const dryRun = process.argv.includes('--dry-run')
  const catalogVendors = loadCatalogVendorNames()
  if (catalogVendors.size === 0) {
    console.error(
      `❌ No vendors found in ${CATALOG_PATH}. Cannot fill validation batches.`,
    )
    process.exit(1)
  }

  const batchFiles = fs
    .readdirSync(DATA_DIR)
    .filter((f) => /^vendor-validation-\d+-of-\d+\.csv$/.test(f))
    .sort()

  if (batchFiles.length === 0) {
    console.error(
      '❌ No vendor-validation-*-of-*.csv files found. Run scripts/vendor-validation-checklist.ts first.',
    )
    process.exit(1)
  }

  let approved = 0
  let deferred = 0
  const cleanupNames: Array<string> = []

  for (const file of batchFiles) {
    const filePath = path.join(DATA_DIR, file)
    const lines = fs.readFileSync(filePath, 'utf-8').trim().split('\n')
    const header = lines[0]
    const rows = lines.slice(1).filter(Boolean)
    const outRows = rows.map((line) => {
      const row = parseCsvLine(line)
      const inSeed = catalogVendors.has(row.vendorName.trim().toLowerCase())
      if (inSeed) {
        approved++
        return `${escapeCsv(row.vendorName)},Y,Y,Present in production seed catalog`
      }
      deferred++
      cleanupNames.push(row.vendorName)
      return `${escapeCsv(row.vendorName)},,N,Not in production seed catalog — exclude until manually validated`
    })

    const csv = [header, ...outRows].join('\n') + '\n'
    if (dryRun) {
      console.log(`[dry-run] would write ${rows.length} rows to ${filePath}`)
    } else {
      fs.writeFileSync(filePath, csv, 'utf-8')
      console.log(`Wrote ${rows.length} rows to ${filePath}`)
    }
  }

  cleanupNames.sort((a, b) => a.localeCompare(b))
  const cleanupBody =
    cleanupNames.join('\n') + (cleanupNames.length ? '\n' : '')
  if (dryRun) {
    console.log(
      `[dry-run] would write ${cleanupNames.length} names to ${CLEANUP_PATH}`,
    )
  } else {
    fs.writeFileSync(CLEANUP_PATH, cleanupBody, 'utf-8')
    console.log(`Wrote ${cleanupNames.length} names to ${CLEANUP_PATH}`)
  }

  console.log(
    `✅ Phase 2 fill complete: ${approved} approved (in seed), ${deferred} deferred (cleanup list).`,
  )
  console.log(
    '   Next: review vendor-cleanup-list.txt, then Phase 3 remove-vendors-from-cleanup-list.ts if needed.',
  )
}

main()
