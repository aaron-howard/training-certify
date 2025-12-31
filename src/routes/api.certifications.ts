import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getDb } from '../db/db.server'
import { userCertifications, certifications, auditLogs, userCertificationProofs } from '../db/schema'
import { eq, desc } from 'drizzle-orm'

export const Route = createFileRoute('/api/certifications')({
    server: {
        handlers: {
            GET: async ({ request }) => {
                try {
                    const url = new URL(request.url)
                    const userId = url.searchParams.get('userId')
                    const certId = url.searchParams.get('id')

                    const db = await getDb()
                    if (!db) {
                        return json({ error: 'Database not available' }, { status: 500 })
                    }

                    // If requesting a specific certification with its proofs
                    if (certId) {
                        const cert = await db.select({
                            id: userCertifications.id,
                            certificationId: userCertifications.certificationId,
                            status: userCertifications.status,
                            issueDate: userCertifications.issueDate,
                            expirationDate: userCertifications.expirationDate,
                            certificationName: userCertifications.certificationName,
                            vendorName: userCertifications.vendorName,
                            certificationNumber: userCertifications.certificationNumber,
                            userId: userCertifications.userId
                        })
                            .from(userCertifications)
                            .where(eq(userCertifications.id, certId))
                            .limit(1)

                        if (cert.length === 0) return json({ error: 'Not found' }, { status: 404 })

                        const proofs = await db.select()
                            .from(userCertificationProofs)
                            .where(eq(userCertificationProofs.userCertificationId, certId))
                            .orderBy(desc(userCertificationProofs.uploadedAt))

                        return json({ ...cert[0], proofs })
                    }

                    if (userId) {
                        const result = await db.select({
                            id: userCertifications.id,
                            certificationId: userCertifications.certificationId,
                            status: userCertifications.status,
                            issueDate: userCertifications.issueDate,
                            expirationDate: userCertifications.expirationDate,
                            certificationName: userCertifications.certificationName,
                            vendorName: userCertifications.vendorName,
                            certificationNumber: userCertifications.certificationNumber,
                            userId: userCertifications.userId
                        })
                            .from(userCertifications)
                            .where(eq(userCertifications.userId, userId))

                        // For a bulk list, we don't necessarily need all proofs, 
                        // but let's at least return the count of proofs or similar if needed.
                        // For now, let's just return the basic list.
                        return json(result)
                    }

                    const result = await db.select().from(userCertifications)
                    return json(result)
                } catch (error: any) {
                    console.error('[API Certifications] Error:', error)
                    return json({ error: 'Internal Server Error', details: error.message, stack: error.stack }, { status: 500 })
                }
            },
            POST: async ({ request }) => {
                // ... (rest of POST remains same, just ensure it uses correct imports)
                try {
                    const data = await request.json()
                    const db = await getDb()
                    if (!db) {
                        return json({ error: 'Database not available' }, { status: 500 })
                    }

                    if (!data.userId || !data.certificationId) {
                        return json({ error: 'Missing required fields' }, { status: 400 })
                    }

                    const certExists = await db.select({ id: certifications.id, name: certifications.name, vendorName: certifications.vendorName })
                        .from(certifications)
                        .where(eq(certifications.id, data.certificationId))
                        .limit(1)

                    if (certExists.length === 0) {
                        return json({ error: 'Certification not found in catalog' }, { status: 404 })
                    }

                    const cert = certExists[0]

                    const insertResult = await db.insert(userCertifications).values({
                        userId: data.userId,
                        certificationId: data.certificationId,
                        certificationName: data.certificationName || cert.name,
                        vendorName: data.vendorName || cert.vendorName,
                        status: data.status || 'active',
                        issueDate: data.issueDate || null,
                        expirationDate: data.expirationDate || null,
                        certificationNumber: data.certificationNumber || null
                    }).returning()

                    const result = insertResult[0]

                    await db.insert(auditLogs).values({
                        userId: data.userId,
                        action: 'Add Certification',
                        resourceType: 'Certification',
                        resourceId: result.id,
                        details: `Added ${result.certificationName} (${result.vendorName})`
                    })

                    return json(result, { status: 201 })
                } catch (error) {
                    console.error('[API Certifications POST] Error:', error)
                    return json({ error: 'Failed', details: String(error) }, { status: 500 })
                }
            },
            PATCH: async ({ request }) => {
                // Handle Proof Uploads and other updates
                try {
                    const data = await request.json()
                    const db = await getDb()
                    if (!db) return json({ error: 'DB error' }, { status: 500 })

                    const { id, action, proof } = data

                    if (action === 'addProof' && id && proof) {
                        const newProof = await db.insert(userCertificationProofs).values({
                            userCertificationId: id,
                            fileName: proof.fileName,
                            fileUrl: proof.fileUrl || `https://storage.example.com/${proof.fileName}`,
                        }).returning()

                        // Update certification timestamp
                        await db.update(userCertifications)
                            .set({ updatedAt: new Date() })
                            .where(eq(userCertifications.id, id))

                        return json({ success: true, proof: newProof[0] })
                    }

                    return json({ error: 'Invalid action' }, { status: 400 })
                } catch (error) {
                    console.error('[API Certifications PATCH] Error:', error)
                    return json({ error: 'Failed' }, { status: 500 })
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
