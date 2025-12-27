import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getDb } from '../db/db.server'
import { userCertifications } from '../db/schema'
import { eq } from 'drizzle-orm'

export const Route = createFileRoute('/api/dashboard')({
    server: {
        handlers: {
            GET: async () => {
                try {
                    const db = await getDb()
                    if (!db) {
                        return json({ error: 'Database not available' }, { status: 500 })
                    }

                    // Get counts
                    const allCerts = await db.select().from(userCertifications)
                    const activeCerts = allCerts.filter(c => c.status === 'active').length
                    const expiringSoon = allCerts.filter(c => {
                        if (!c.daysUntilExpiration) return false
                        return c.daysUntilExpiration <= 30 && c.daysUntilExpiration > 0
                    }).length

                    return json({
                        activeCerts,
                        expiringSoon,
                        complianceRate: 98 // Mock value
                    })
                } catch (error) {
                    console.error('[API Dashboard] Error:', error)
                    return json({ activeCerts: 0, expiringSoon: 0, complianceRate: 0 })
                }
            }
        }
    }
})
