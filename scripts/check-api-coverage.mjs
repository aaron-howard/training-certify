#!/usr/bin/env node
/**
 * Check that all API route files (src/routes/api.*.ts) meet the minimum
 * statement coverage threshold. Used for Phase 1.2 API-layer coverage gate.
 *
 * Usage:
 *   node scripts/check-api-coverage.mjs [coverage-file]
 *
 * Default coverage file: coverage/coverage-final.json (Istanbul/v8 format).
 * Exit code: 0 if all API routes >= threshold, 1 otherwise.
 */

import fs from 'fs'
import path from 'path'

const DEFAULT_COVERAGE_FILE = 'coverage/coverage-final.json'
const THRESHOLD_PCT = 80
const API_ROUTE_PATTERN = /[\\/]routes[\\/]api\.[^/\\]+\.ts$/i

/** Thin API routes that delegate to lib handlers — enforce coverage on the lib file instead. */
const DELEGATE_COVERAGE_LIB = {
  'src/routes/api.certifications.proof.ts':
    'src/lib/certificationProofUpload.server.ts',
}

function normalizePath(filePath) {
  return path.normalize(filePath).replace(/\\/g, '/')
}

function isApiRoute(filePath) {
  const normalized = normalizePath(filePath)
  return API_ROUTE_PATTERN.test(normalized) && !normalized.includes('/demo/')
}

function statementCoveragePct(entry) {
  const s = entry?.s
  if (!s || typeof s !== 'object') return null
  const keys = Object.keys(s)
  if (keys.length === 0) return 100
  const covered = keys.filter((id) => Number(s[id]) > 0).length
  return Math.round((covered / keys.length) * 100)
}

function main() {
  const coveragePath = path.resolve(
    process.cwd(),
    process.argv[2] || DEFAULT_COVERAGE_FILE,
  )
  if (!fs.existsSync(coveragePath)) {
    console.error('Error: coverage file not found:', coveragePath)
    console.error('Run: pnpm run test:coverage')
    process.exit(1)
  }

  const raw = fs.readFileSync(coveragePath, 'utf8')
  let data
  try {
    data = JSON.parse(raw)
  } catch (e) {
    console.error('Error: invalid JSON in', coveragePath, e.message)
    process.exit(1)
  }

  const entries = Object.entries(data)
  const apiEntries = entries.filter(([filePath]) => isApiRoute(filePath))
  const byShortPath = new Map(
    entries.map(([filePath, entry]) => [
      path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
      { filePath, entry },
    ]),
  )

  const results = []
  for (const [filePath, entry] of apiEntries) {
    const short = path.relative(process.cwd(), filePath).replace(/\\/g, '/')
    const delegateLib = DELEGATE_COVERAGE_LIB[short]
    if (delegateLib) {
      const lib = byShortPath.get(delegateLib)
      if (!lib) {
        console.error(
          `Error: delegate coverage missing for ${short} → ${delegateLib}`,
        )
        process.exit(1)
      }
      const pct = statementCoveragePct(lib.entry)
      results.push({
        file: `${short} (via ${delegateLib})`,
        pct,
        path: lib.filePath,
      })
      continue
    }
    const pct = statementCoveragePct(entry)
    results.push({ file: short, pct, path: filePath })
  }

  results.sort((a, b) => a.file.localeCompare(b.file))
  const below = results.filter((r) => r.pct !== null && r.pct < THRESHOLD_PCT)
  const ok = results.filter((r) => r.pct === null || r.pct >= THRESHOLD_PCT)

  if (results.length === 0) {
    console.error(
      'Error: no API route files found in coverage. Pattern: src/routes/api.*.ts',
    )
    process.exit(1)
  }

  for (const r of ok) {
    const pctStr = r.pct !== null ? `${r.pct}%` : 'N/A'
    console.log(`  ${r.file}: ${pctStr}`)
  }
  for (const r of below) {
    console.log(`  ${r.file}: ${r.pct}% (below ${THRESHOLD_PCT}%)`)
  }

  if (below.length > 0) {
    console.error('')
    console.error(
      `API coverage check failed: ${below.length} file(s) below ${THRESHOLD_PCT}% statements.`,
    )
    process.exit(1)
  }

  console.log('')
  console.log(
    `API coverage check passed: all ${results.length} route(s) >= ${THRESHOLD_PCT}% statements.`,
  )
}

main()
