import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { sql } from 'drizzle-orm'
import { getDb } from '../src/db/db.server'
import { certifications } from '../src/db/schema'

async function main() {
  const csvPath = path.resolve(
    process.cwd(),
    'microsoft_certifications_seed.csv',
  )
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found at ${csvPath}`)
    process.exit(1)
  }

  console.log(`📂 Reading certifications from ${csvPath}...`)
  const content = fs.readFileSync(csvPath, 'utf-8')
  const lines = content.split('\n').filter((line) => line.trim() !== '')

  // Skip header
  const dataLines = lines.slice(1)
  const totalLines = dataLines.length

  console.log(`🚀 Starting seed. Total records to process: ${totalLines}`)

  const db = await getDb()
  if (!db) {
    console.error('❌ Database not available')
    process.exit(1)
  }

  let addedCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i].replace(/\r$/, '')

    // Robust CSV parsing
    const parts: Array<string> = []
    let current = ''
    let inQuotes = false
    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') {
        if (inQuotes && line[j + 1] === '"') {
          // Handle escaped quotes ""
          current += '"'
          j++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        parts.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    parts.push(current.trim())

    if (parts.length < 9) {
      console.warn(`[Line ${i + 2}] Skipping invalid line: ${line}`)
      skippedCount++
      continue
    }

    const [
      examCode,
      examTitle,
      vendor,
      level,
      subject,
      product,
      roles,
      timeLimit,
      price,
    ] = parts

    const vendorId = vendor.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    // If examCode is missing, generate a stable ID from the title
    const id = examCode || examTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    if (!id) {
      skippedCount++
      continue
    }

    try {
      await db
        .insert(certifications)
        .values({
          id: id,
          name: examTitle,
          vendorId,
          vendorName: vendor,
          difficulty: level,
          category: subject,
          price: price,
          description: `${product} - Roles: ${roles}. Time Limit: ${timeLimit}`,
        })
        .onConflictDoUpdate({
          target: certifications.id,
          set: {
            name: examTitle,
            difficulty: level,
            category: subject,
            price: price,
            description: `${product} - Roles: ${roles}. Time Limit: ${timeLimit}`,
          },
        })

      addedCount++
      if (addedCount % 10 === 0) {
        console.log(`✅ Processed ${addedCount} records...`)
      }
    } catch (error) {
      console.error(`❌ Error inserting ${examCode}:`, error)
      errorCount++
    }
  }

  console.log('\n--- Microsoft Seed Summary ---')
  console.log(`✅ Records Added/Updated: ${addedCount}`)
  console.log(`⏭️ Records Skipped (Invalid): ${skippedCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log('--------------------\n')
}

main().catch((err) => {
  console.error('💥 Unhandled error:', err)
  process.exit(1)
})
