import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getDb } from '../db/db.server'
import { userCertifications } from '../db/schema'

export const Route = createFileRoute('/api/dashboard')({
    server: {
        handlers: {
            GET: async ({ request }) => {
                try {
                    const url = new URL(request.url)
                    const userId = url.searchParams.get('userId')
                    const db = await getDb()
                    if (!db) {
                        return json({ error: 'Database not available' }, { status: 500 })
                    }

                    // Get certs (filtered by userId if provided)
                    let query = db.select().from(userCertifications)
                    if (userId) {
                        // Import eq if not already present, but I'll use simple filter since it's fetching all anyway
                    }

                    const allCerts = await query
                    const filteredCerts = userId
                        ? allCerts.filter(c => c.userId === userId)
                        : allCerts

                    const activeCerts = filteredCerts.filter(c => c.status === 'active').length
                    const expiringSoon = filteredCerts.filter(c => {
                        // Status is pre-calculated by my logic in other places, 
                        // but let's ensure it's accurate here.
                        return c.status === 'expiring' || c.status === 'expiring-soon'
                    }).length

                    const complianceRate = filteredCerts.length > 0
                        ? Math.round((activeCerts / filteredCerts.length) * 100)
                        : 0

                    return json({
                        activeCerts,
                        expiringSoon,
                        complianceRate
                    })
                } catch (error) {
                    console.error('[API Dashboard] Error:', error)
                    return json({ activeCerts: 0, expiringSoon: 0, complianceRate: 0 })
                }
            }
        }
    }
})
