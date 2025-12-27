import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getDb } from '../db/db.server'
import { userCertifications, certifications } from '../db/schema'
import { eq } from 'drizzle-orm'

export const Route = createFileRoute('/api/certifications')({
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

                    if (userId) {
                        const result = await db.select({
                            id: userCertifications.id,
                            certificationId: userCertifications.certificationId,
                            status: userCertifications.status,
                            issueDate: userCertifications.issueDate,
                            expirationDate: userCertifications.expirationDate,
                            certificationName: userCertifications.certificationName,
                            vendorName: userCertifications.vendorName
                        })
                            .from(userCertifications)
                            .where(eq(userCertifications.userId, userId))

                        return json(result)
                    }

                    // Return all if no userId
                    const result = await db.select().from(userCertifications)
                    return json(result)
                } catch (error) {
                    console.error('[API Certifications] Error:', error)
                    return json([])
                }
            },
            POST: async ({ request }) => {
                try {
                    const data = await request.json()
                    const db = await getDb()
                    if (!db) {
                        return json({ error: 'Database not available' }, { status: 500 })
                    }

                    // Validate required fields
                    if (!data.userId) {
                        return json({ error: 'userId is required' }, { status: 400 })
                    }
                    if (!data.certificationId) {
                        return json({ error: 'certificationId is required' }, { status: 400 })
                    }

                    // Verify the certification exists in catalog
                    const certExists = await db.select({ id: certifications.id, name: certifications.name, vendorName: certifications.vendorName })
                        .from(certifications)
                        .where(eq(certifications.id, data.certificationId))
                        .limit(1)

                    if (certExists.length === 0) {
                        return json({ error: 'Certification not found in catalog' }, { status: 404 })
                    }

                    const cert = certExists[0]

                    const result = await db.insert(userCertifications).values({
                        userId: data.userId,
                        certificationId: data.certificationId,
                        certificationName: data.certificationName || cert.name,
                        vendorName: data.vendorName || cert.vendorName,
                        status: data.status || 'active',
                        issueDate: data.issueDate || null,
                        expirationDate: data.expirationDate || null
                    }).returning()

                    console.log(`✅ [API] Created user certification: ${result[0].id}`)
                    return json(result[0], { status: 201 })
                } catch (error) {
                    console.error('[API Certifications POST] Error:', error)
                    return json({ error: 'Failed to create certification', details: String(error) }, { status: 500 })
                }
            },
            DELETE: async ({ request }) => {
                try {
                    const url = new URL(request.url)
                    const id = url.searchParams.get('id')
                    if (!id) {
                        return json({ error: 'Missing id' }, { status: 400 })
                    }

                    const db = await getDb()
                    if (!db) {
                        return json({ error: 'Database not available' }, { status: 500 })
                    }

                    await db.delete(userCertifications).where(eq(userCertifications.id, id))
                    return json({ success: true })
                } catch (error) {
                    console.error('[API Certifications DELETE] Error:', error)
                    return json({ error: 'Failed to delete' }, { status: 500 })
                }
            }
        }
    }
})
