import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { sql } from 'drizzle-orm'
import { getDb } from '../db/db.server'
import { userCertifications, users, teams, teamRequirements } from '../db/schema'

export const Route = createFileRoute('/api/dashboard')({
    server: {
        handlers: {
            GET: async ({ request }) => {
                try {
                    const db = await getDb()
                    if (!db) {
                        return json({ error: 'Database not available' }, { status: 500 })
                    }

                    const url = new URL(request.url)
                    const userId = url.searchParams.get('userId')
                    const role = url.searchParams.get('role')

                    console.log(`📊 [API Dashboard] Request for user: ${userId}, role: ${role}`)

                    if (role === 'Executive') {
                        // 1. Total Users
                        const allUsers = await db.select().from(users)
                        const totalUsers = allUsers.length

                        // 2. All Certs
                        const allUserCerts = await db.select().from(userCertifications)
                        const totalCerts = allUserCerts.length

                        // 3. Compliance Rate (Global)
                        const activeCertsExec = allUserCerts.filter(c => c.status === 'active').length
                        const complianceRateExec = totalCerts > 0 ? Math.round((activeCertsExec / totalCerts) * 100) : 0

                        // 4. Critical Gaps
                        const allTeams = await db.select().from(teams)
                        const allRequirements = await db.select().from(teamRequirements)
                        let criticalGaps = 0

                        for (const team of allTeams) {
                            const teamReqs = allRequirements.filter(r => r.teamId === team.id)
                            if (teamReqs.length === 0) continue
                            criticalGaps++
                        }

                        // 5. Vendor Breakdown
                        const vendorMap = new Map()
                        for (const cert of allUserCerts) {
                            const vendor = cert.vendorName || 'Other'
                            if (!vendorMap.has(vendor)) vendorMap.set(vendor, { total: 0, active: 0 })
                            const v = vendorMap.get(vendor)
                            v.total++
                            if (cert.status === 'active') v.active++
                        }

                        const vendorBreakdown = Array.from(vendorMap.entries()).map(([name, stats]) => ({
                            name,
                            compliance: Math.round((stats.active / stats.total) * 100)
                        }))

                        // 6. Expiring Soon
                        const expiringSoonExec = allUserCerts.filter(c => c.status === 'expiring' || c.status === 'expiring-soon').length

                        return json({
                            totalUsers,
                            totalCerts,
                            complianceRate: complianceRateExec,
                            criticalGaps,
                            vendorBreakdown,
                            expiringSoon: expiringSoonExec,
                            budgetImpact: '$12,450'
                        })
                    }

                    // Standard Dashboard Logic
                    const allCerts = await db.select().from(userCertifications)
                    const filteredCerts = userId
                        ? allCerts.filter(c => c.userId === userId)
                        : allCerts

                    const activeCerts = filteredCerts.filter(c => c.status === 'active').length
                    const expiringSoon = filteredCerts.filter(c => {
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
