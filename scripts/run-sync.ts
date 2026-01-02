import 'dotenv/config' // Load env vars
import { syncCatalogFromITExams } from '../src/lib/ingestion.server'

async function main() {
  console.log('🔄 Starting Manual ITExams Sync...')

  try {
    // Limit to 3 vendors for a quick test
    const result = await syncCatalogFromITExams(3)
    console.log(
      `✅ Sync successful! Processed ${result.totalProcessed} certifications.`,
    )
  } catch (error) {
    console.error('❌ Sync failed:', error)
    process.exit(1)
  }
}

main()
