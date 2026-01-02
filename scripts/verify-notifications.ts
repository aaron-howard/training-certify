import 'dotenv/config'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { and, eq, gt, lt, sql } from 'drizzle-orm'
import * as schema from '../src/db/schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set')
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})
const db = drizzle(pool, { schema })

async function verifyNotifications() {
  console.log('🚀 Starting Notification Logic Validation...')

  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)

  // 1. Check for expiring user certifications
  console.log('--- Checking for expiring certifications ---')
  const certsToAlert = await db
    .select()
    .from(schema.userCertifications)
    .where(
      and(
        sql`${schema.userCertifications.status} IN ('active', 'expiring-soon')`,
        sql`${schema.userCertifications.expirationDate} < ${thirtyDaysFromNow.toISOString()}`,
      ),
    )

  console.log(`Found ${certsToAlert.length} certifications requiring alerts.`)

  for (const cert of certsToAlert) {
    // Create notification if not exists
    const existingNotif = await db
      .select()
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, cert.userId),
          eq(schema.notifications.type, 'expiration-alert'),
          sql`${schema.notifications.title} LIKE ${'%' + cert.certificationName + '%'}`,
        ),
      )
      .limit(1)

    if (existingNotif.length === 0) {
      await db.insert(schema.notifications).values({
        userId: cert.userId,
        type: 'expiration-alert',
        severity: 'critical',
        title: `ACTION REQUIRED: ${cert.certificationName} Expiring`,
        description: `Your ${cert.certificationName} (${cert.vendorName}) is set to expire on ${cert.expirationDate}. Please upload renewal proof soon.`,
        timestamp: new Date(),
      })
      console.log(`✅ Created expiration-alert for user ${cert.userId}`)
    } else {
      console.log(
        `⏭️ Notification already exists for ${cert.userId} / ${cert.certificationName}`,
      )
    }

    // Update status in DB if needed
    if (cert.status !== 'expiring') {
      await db
        .update(schema.userCertifications)
        .set({ status: 'expiring' })
        .where(eq(schema.userCertifications.id, cert.id))
    }
  }

  // 2. Check for Team Coverage Gaps
  console.log('\n--- Checking for team coverage gaps ---')
  const teams = await db.select().from(schema.teams)

  for (const team of teams) {
    const requirements = await db
      .select()
      .from(schema.teamRequirements)
      .where(eq(schema.teamRequirements.teamId, team.id))

    const members = await db
      .select({ userId: schema.userTeams.userId })
      .from(schema.userTeams)
      .where(eq(schema.userTeams.teamId, team.id))

    const memberIds = members.map((m) => m.userId)

    for (const req of requirements) {
      let actualCount = 0
      if (memberIds.length > 0) {
        const countResult = await db
          .select({
            value: sql`count(DISTINCT ${schema.userCertifications.userId})`,
          })
          .from(schema.userCertifications)
          .where(
            and(
              sql`${schema.userCertifications.userId} IN ${memberIds}`,
              eq(
                schema.userCertifications.certificationId,
                req.certificationId,
              ),
              sql`${schema.userCertifications.status} IN ('active', 'expiring-soon')`,
            ),
          )
        actualCount = Number(countResult[0]?.value || 0)
      }

      if (actualCount < req.targetCount) {
        console.log(
          `⚠️ Team "${team.name}" has a gap: ${actualCount}/${req.targetCount} for Cert ID ${req.certificationId}`,
        )

        // Notify Manager if they exist
        if (team.managerId) {
          const existingTeamNotif = await db
            .select()
            .from(schema.notifications)
            .where(
              and(
                eq(schema.notifications.userId, team.managerId),
                eq(schema.notifications.type, 'compliance-warning'),
                sql`${schema.notifications.description} LIKE ${'%' + team.name + '%'}`,
              ),
            )
            .limit(1)

          if (existingTeamNotif.length === 0) {
            await db.insert(schema.notifications).values({
              userId: team.managerId,
              type: 'compliance-warning',
              severity: 'warning',
              title: `Team Coverage Gap: ${team.name}`,
              description: `Team "${team.name}" is below the required coverage for a certification. Actual: ${actualCount}, Required: ${req.targetCount}.`,
              timestamp: new Date(),
            })
            console.log(
              `✅ Created compliance-warning for manager ${team.managerId}`,
            )
          }
        }
      }
    }
  }

  console.log('\n✨ Notification Logic Validation Complete.')
  process.exit(0)
}

verifyNotifications().catch((err) => {
  console.error('❌ Validation Failed:', err)
  process.exit(1)
})
