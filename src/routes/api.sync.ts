import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getDb } from '../db/db.server'
import { certifications } from '../db/schema'

// This is a placeholder for the actual ITExams sync
// In production, this would scrape/fetch from itexams.com
const mockITExamsCertifications = [
    { id: 'ms-100', name: 'Microsoft 365 Identity and Services', vendorId: 'microsoft', vendorName: 'Microsoft', category: 'Cloud', difficulty: 'Advanced' },
    { id: 'ms-700', name: 'Managing Microsoft Teams', vendorId: 'microsoft', vendorName: 'Microsoft', category: 'Cloud', difficulty: 'Intermediate' },
    { id: 'dp-900', name: 'Microsoft Azure Data Fundamentals', vendorId: 'microsoft', vendorName: 'Microsoft', category: 'Data', difficulty: 'Beginner' },
    { id: 'dp-100', name: 'Azure Data Scientist Associate', vendorId: 'microsoft', vendorName: 'Microsoft', category: 'Data', difficulty: 'Advanced' },
    { id: 'ai-900', name: 'Microsoft Azure AI Fundamentals', vendorId: 'microsoft', vendorName: 'Microsoft', category: 'Data', difficulty: 'Beginner' },
]

export const Route = createFileRoute('/api/sync')({
    server: {
        handlers: {
            POST: async ({ request }) => {
                try {
                    const data = await request.json().catch(() => ({}))
                    const limit = data.limit || 10

                    const db = await getDb()
                    if (!db) {
                        return json({ error: 'Database not available' }, { status: 500 })
                    }

                    let synced = 0
                    let skipped = 0

                    const certsToSync = mockITExamsCertifications.slice(0, limit)

                    for (const cert of certsToSync) {
                        try {
                            await db.insert(certifications).values({
                                id: cert.id,
                                name: cert.name,
                                vendorId: cert.vendorId,
                                vendorName: cert.vendorName,
                                category: cert.category,
                                difficulty: cert.difficulty,
                            }).onConflictDoNothing()
                            synced++
                        } catch (err: any) {
                            if (err.code === '23505') {
                                skipped++
                            } else {
                                console.error(`Failed to sync ${cert.id}:`, err.message)
                            }
                        }
                    }

                    console.log(`🔄 [Sync] Synced ${synced} certifications, skipped ${skipped}`)
                    return json({
                        success: true,
                        synced,
                        skipped,
                        total: certsToSync.length,
                        message: 'Sync complete (mock data - ITExams integration pending)'
                    })
                } catch (error) {
                    console.error('[API Sync] Error:', error)
                    return json({ error: 'Failed to sync catalog' }, { status: 500 })
                }
            }
        }
    }
})
