import 'dotenv/config'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set')
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})
const db = drizzle(pool, { schema })

async function main() {
  console.log('Seeding database...')

  // 1. Seed Users
  const user1 = {
    id: 'user-001',
    name: 'Marcus Williams',
    email: 'marcus@example.com',
    role: 'Architect',
  }
  await db.insert(schema.users).values(user1).onConflictDoNothing()

  // 2. Seed Teams
  const team1 = {
    name: 'Engineering',
    description: 'Core platform engineering team',
    managerId: user1.id,
  }
  const [insertedTeam] = await db.insert(schema.teams).values(team1).returning()

  // 3. Join User to Team
  await db
    .insert(schema.userTeams)
    .values({
      userId: user1.id,
      teamId: insertedTeam.id,
    })
    .onConflictDoNothing()

  // 4. Seed Certifications Catalog
  const certs = [
    {
      id: 'cert-aws-saa',
      name: 'AWS Certified Solutions Architect - Associate',
      vendorId: 'aws',
      vendorName: 'Amazon Web Services',
      category: 'Cloud',
      difficulty: 'Intermediate',
    },
    {
      id: 'cert-azure-admin',
      name: 'Microsoft Certified: Azure Administrator Associate',
      vendorId: 'microsoft',
      vendorName: 'Microsoft',
      category: 'Cloud',
      difficulty: 'Intermediate',
    },
    {
      id: 'cert-cissp',
      name: 'Certified Information Systems Security Professional (CISSP)',
      vendorId: 'isc2',
      vendorName: '(ISC)²',
      category: 'Security',
      difficulty: 'Expert',
    },
  ]
  for (const cert of certs) {
    await db.insert(schema.certifications).values(cert).onConflictDoNothing()
  }

  // 5. Seed User Certifications
  await db.insert(schema.userCertifications).values([
    {
      userId: user1.id,
      certificationId: 'cert-aws-saa',
      certificationName: 'AWS Certified Solutions Architect - Associate',
      vendorName: 'Amazon Web Services',
      certificationNumber: 'AWS-SAA-2024-789456',
      issueDate: '2024-03-15',
      expirationDate: '2027-03-15',
      status: 'active',
      daysUntilExpiration: 900,
      documentUrl: '/uploads/aws-saa-certificate.pdf',
      verifiedAt: new Date('2024-03-15T14:30:00Z'),
    },
    {
      userId: user1.id,
      certificationId: 'cert-azure-admin',
      certificationName: 'Microsoft Certified: Azure Administrator Associate',
      vendorName: 'Microsoft',
      certificationNumber: 'AZ104-2024-112233',
      issueDate: '2024-01-10',
      expirationDate: '2026-01-10',
      status: 'expiring-soon',
      daysUntilExpiration: 45,
      documentUrl: '/uploads/azure-admin-certificate.pdf',
      verifiedAt: new Date('2024-01-10T09:15:00Z'),
    },
  ])

  // 6. Seed Notifications
  await db.insert(schema.notifications).values([
    {
      userId: user1.id,
      type: 'expiration-alert',
      severity: 'warning',
      title: 'Azure Admin Certificate Expiring',
      description:
        'Your Microsoft Certified: Azure Administrator Associate expires in 45 days. Start planning your renewal.',
      timestamp: new Date(),
    },
  ])

  // 7. Seed Audit Logs
  await db.insert(schema.auditLogs).values([
    {
      userId: user1.id,
      action: 'Created Certification',
      resourceType: 'user_certification',
      resourceId: 'uc-001',
      details: 'Added AWS Certified Solutions Architect - Associate',
    },
    {
      userId: user1.id,
      action: 'Updated Profile',
      resourceType: 'user',
      resourceId: user1.id,
      details: 'Updated contact information',
    },
    {
      userId: user1.id,
      action: 'Viewed Audit Log',
      resourceType: 'system',
      resourceId: 'system',
      details: 'Accessed compliance dashboard',
    },
  ])

  console.log('Seeding completed successfully!')
}

main().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
