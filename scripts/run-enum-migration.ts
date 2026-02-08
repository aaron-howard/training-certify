/**
 * Standalone script to apply the enum normalization migration.
 *
 * This bypasses Drizzle's broken migration history and runs the
 * 0004_normalize_enums.sql migration directly against the database.
 *
 * Usage: npx tsx scripts/run-enum-migration.ts
 */

import 'dotenv/config'
import { Pool } from 'pg'

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL must be set')
  process.exit(1)
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  const client = await pool.connect()

  try {
    console.log('🔄 Starting enum normalization migration...\n')

    // Check if the old values still exist
    const enumCheck = await client.query(`
      SELECT enumlabel FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'certification_difficulty'
      ORDER BY enumsortorder
    `)
    const currentDifficultyValues = enumCheck.rows.map(
      (r: { enumlabel: string }) => r.enumlabel,
    )
    console.log(
      '📋 Current difficulty enum values:',
      currentDifficultyValues.join(', '),
    )

    const alreadyMigrated =
      currentDifficultyValues.includes('Foundational') &&
      !currentDifficultyValues.includes('Intermediate')

    if (alreadyMigrated) {
      console.log(
        '\n✅ Enums already normalized. Migration was previously applied.',
      )
      return
    }

    await client.query('BEGIN')

    // Step 1: Create new enum types
    console.log('1️⃣  Creating new category enum type...')
    await client.query(`
      CREATE TYPE "certification_category_new" AS ENUM (
        'AI & Machine Learning',
        'Business Applications',
        'Cloud',
        'Collaboration',
        'Data & Analytics',
        'Database',
        'DevOps',
        'Governance & Compliance',
        'Infrastructure',
        'IT Service Management',
        'Networking',
        'Operating Systems',
        'Project Management',
        'Security',
        'Software Development'
      )
    `)

    console.log('2️⃣  Creating new difficulty enum type...')
    await client.query(`
      CREATE TYPE "certification_difficulty_new" AS ENUM (
        'Foundational',
        'Associate',
        'Professional',
        'Expert'
      )
    `)

    // Step 2: Alter columns with mapping
    console.log('3️⃣  Migrating category values...')
    await client.query(`
      ALTER TABLE "certifications"
        ALTER COLUMN "category" TYPE "certification_category_new"
        USING CASE "category"::text
          WHEN 'AI' THEN 'AI & Machine Learning'
          WHEN 'AppDynamics' THEN 'DevOps'
          WHEN 'Business Applications' THEN 'Business Applications'
          WHEN 'Channel/Partner' THEN 'Business Applications'
          WHEN 'Cloud' THEN 'Cloud'
          WHEN 'Collaboration' THEN 'Collaboration'
          WHEN 'Cybersecurity' THEN 'Security'
          WHEN 'Data' THEN 'Data & Analytics'
          WHEN 'Data Center' THEN 'Infrastructure'
          WHEN 'Design' THEN 'Software Development'
          WHEN 'DevNet' THEN 'DevOps'
          WHEN 'DevOps' THEN 'DevOps'
          WHEN 'Dynamics 365' THEN 'Business Applications'
          WHEN 'Enterprise' THEN 'Infrastructure'
          WHEN 'Field Technician' THEN 'Infrastructure'
          WHEN 'IT' THEN 'IT Service Management'
          WHEN 'Meraki' THEN 'Networking'
          WHEN 'Modern Workplace' THEN 'Collaboration'
          WHEN 'Networking' THEN 'Networking'
          WHEN 'Power Platform' THEN 'Business Applications'
          WHEN 'Project Management' THEN 'Project Management'
          WHEN 'Security' THEN 'Security'
          WHEN 'Service Provider' THEN 'Networking'
          WHEN 'Support Technician' THEN 'IT Service Management'
          ELSE 'Cloud'
        END::"certification_category_new"
    `)

    console.log('4️⃣  Migrating difficulty values...')
    await client.query(`
      ALTER TABLE "certifications"
        ALTER COLUMN "difficulty" TYPE "certification_difficulty_new"
        USING CASE "difficulty"::text
          WHEN 'Advanced' THEN 'Professional'
          WHEN 'Associate' THEN 'Associate'
          WHEN 'Beginner' THEN 'Foundational'
          WHEN 'Cybersecurity' THEN 'Professional'
          WHEN 'Expert' THEN 'Expert'
          WHEN 'Financial App' THEN 'Professional'
          WHEN 'Information Technology' THEN 'Associate'
          WHEN 'Intermediate' THEN 'Associate'
          WHEN 'IT Finance' THEN 'Professional'
          WHEN 'Networking' THEN 'Associate'
          WHEN 'Professional' THEN 'Professional'
          WHEN 'Project Management' THEN 'Professional'
          WHEN 'ServiceNow' THEN 'Associate'
          WHEN 'ServiceNow*' THEN 'Associate'
          WHEN 'Software and Quality' THEN 'Associate'
          WHEN 'Virtualization' THEN 'Professional'
          ELSE 'Associate'
        END::"certification_difficulty_new"
    `)

    // Step 3: Drop old types and rename
    console.log('5️⃣  Dropping old enum types...')
    await client.query('DROP TYPE "certification_category"')
    await client.query('DROP TYPE "certification_difficulty"')

    console.log('6️⃣  Renaming new enum types...')
    await client.query(
      'ALTER TYPE "certification_category_new" RENAME TO "certification_category"',
    )
    await client.query(
      'ALTER TYPE "certification_difficulty_new" RENAME TO "certification_difficulty"',
    )

    await client.query('COMMIT')

    // Verify
    const verifyResult = await client.query(`
      SELECT enumlabel FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'certification_difficulty'
      ORDER BY enumsortorder
    `)
    console.log(
      '\n✅ Migration complete! New difficulty values:',
      verifyResult.rows
        .map((r: { enumlabel: string }) => r.enumlabel)
        .join(', '),
    )
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('❌ Migration failed:', err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
