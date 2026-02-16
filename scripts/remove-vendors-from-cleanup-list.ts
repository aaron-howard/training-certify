/**
 * Phase 3: Remove vendors (and their certifications) from the database using
 * the cleanup list. Respects FKs: notifications, team_requirements,
 * user_certification_proofs, user_certifications, certifications, vendors.
 *
 * Usage:
 *   npx tsx scripts/remove-vendors-from-cleanup-list.ts --dry-run
 *   npx tsx scripts/remove-vendors-from-cleanup-list.ts
 *   npx tsx scripts/remove-vendors-from-cleanup-list.ts --list=data/my-cleanup.txt
 *
 * Input: data/vendor-cleanup-list.txt (one vendor name per line).
 * Optional: --list=path for a different file.
 * With --dry-run: only logs what would be deleted; no writes.
 */

import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { count, inArray } from 'drizzle-orm'
import { getDb } from '../src/db/db.server'
import {
  certifications,
  notifications,
  teamRequirements,
  userCertificationProofs,
  userCertifications,
  vendors,
} from '../src/db/schema'

const DEFAULT_LIST_PATH = path.join(
  process.cwd(),
  'data',
  'vendor-cleanup-list.txt',
)
const APPLIED_LOG_PATH = path.join(
  process.cwd(),
  'data',
  'vendor-cleanup-applied.log',
)

function normalizeName(name: string): string {
  return name.trim().toLowerCase()
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const listArg = args.find((a) => a.startsWith('--list='))
  const listPath = listArg
    ? path.resolve(process.cwd(), listArg.split('=').slice(1).join('=').trim())
    : DEFAULT_LIST_PATH

  if (!fs.existsSync(listPath)) {
    console.error(`❌ Cleanup list not found at ${listPath}`)
    console.error(
      '   Create data/vendor-cleanup-list.txt (one vendor name per line) or use --list=path',
    )
    process.exit(1)
  }

  const content = fs.readFileSync(listPath, 'utf-8')
  const cleanupNames = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))

  if (cleanupNames.length === 0) {
    console.log('No vendor names in cleanup list. Exiting.')
    process.exit(0)
  }

  const db = await getDb()
  if (!db) {
    console.error('❌ Database not available. Is DATABASE_URL set?')
    process.exit(1)
  }

  const nameSet = new Set(cleanupNames.map(normalizeName))

  // Resolve cleanup list names to vendor ids (case-insensitive match)
  const allVendors = await db
    .select({ id: vendors.id, name: vendors.name })
    .from(vendors)
  const toRemove = allVendors.filter((v) => nameSet.has(normalizeName(v.name)))
  const vendorIds = toRemove.map((v) => v.id)

  if (vendorIds.length === 0) {
    console.log(
      'No matching vendors found in the database for the cleanup list.',
    )
    process.exit(0)
  }

  if (dryRun) {
    console.log('🧪 DRY RUN - No changes will be made.\n')
  }

  console.log(`Vendors to remove (${vendorIds.length}):`)
  toRemove.forEach((v) => console.log(`  - ${v.name} (id=${v.id})`))

  const certsToRemove = await db
    .select({ id: certifications.id })
    .from(certifications)
    .where(inArray(certifications.vendorId, vendorIds))
  const certIds = certsToRemove.map((c) => c.id)

  const userCertIdsToRemove = certIds.length
    ? (
        await db
          .select({ id: userCertifications.id })
          .from(userCertifications)
          .where(inArray(userCertifications.certificationId, certIds))
      ).map((r) => r.id)
    : []

  let teamReqsCount = 0
  let notifCount = 0
  if (certIds.length > 0) {
    const [tr] = await db
      .select({ count: count() })
      .from(teamRequirements)
      .where(inArray(teamRequirements.certificationId, certIds))
    teamReqsCount = Number(tr.count)
    const notifByCert = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(inArray(notifications.certificationId, certIds))
    notifCount += notifByCert.length
  }
  if (userCertIdsToRemove.length > 0) {
    const notifByUserCert = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(inArray(notifications.userCertificationId, userCertIdsToRemove))
    notifCount += notifByUserCert.length
  }

  console.log(`\nWould delete:`)
  console.log(`  - ${teamReqsCount} team requirement(s)`)
  console.log(`  - ${notifCount} notification(s)`)
  console.log(
    `  - ${userCertIdsToRemove.length} user certification(s) (and their proofs)`,
  )
  console.log(`  - ${certIds.length} certification(s)`)
  console.log(`  - ${vendorIds.length} vendor(s)`)

  if (dryRun) {
    console.log('\nRun without --dry-run to apply. Backup the DB first.')
    process.exit(0)
  }

  await db.transaction(async (tx) => {
    if (certIds.length > 0) {
      await tx
        .delete(teamRequirements)
        .where(inArray(teamRequirements.certificationId, certIds))
      if (userCertIdsToRemove.length > 0) {
        await tx
          .delete(notifications)
          .where(
            inArray(notifications.userCertificationId, userCertIdsToRemove),
          )
        await tx
          .delete(userCertificationProofs)
          .where(
            inArray(
              userCertificationProofs.userCertificationId,
              userCertIdsToRemove,
            ),
          )
      }
      await tx
        .delete(notifications)
        .where(inArray(notifications.certificationId, certIds))
      await tx
        .delete(userCertifications)
        .where(inArray(userCertifications.certificationId, certIds))
      await tx
        .delete(certifications)
        .where(inArray(certifications.vendorId, vendorIds))
    }
    await tx.delete(vendors).where(inArray(vendors.id, vendorIds))
  })

  const logLine = `${new Date().toISOString()} Removed vendors: ${toRemove.map((v) => v.id).join(', ')} (${toRemove.map((v) => v.name).join('; ')})\n`
  fs.appendFileSync(APPLIED_LOG_PATH, logLine, 'utf-8')
  console.log(
    `\n✅ Removed ${vendorIds.length} vendor(s) and ${certIds.length} certification(s).`,
  )
  console.log(`   Audit log: ${APPLIED_LOG_PATH}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
