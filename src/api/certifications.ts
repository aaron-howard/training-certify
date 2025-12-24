import { createServerFn } from '@tanstack/react-start'
import { db } from '../db'
import { userCertifications } from '../db/schema'
import { eq } from 'drizzle-orm'
import type { UserCertification } from '../types'

export const getUserCertifications = createServerFn({ method: 'GET' })
    .handler(async () => {
        try {
            if (!db) {
                console.log('⚠️ [Server] DB is null, returning empty user certifications')
                return []
            }
            const result = await db.select().from(userCertifications)

            // Map DB result to UserCertification type if needed
            const mapped = result.map(cert => ({
                ...cert,
                verifiedAt: cert.verifiedAt?.toISOString() || '',
                status: (cert.status || 'active') as UserCertification['status']
            })) as UserCertification[]

            console.log(`✅ [Server] Returning ${mapped.length} user certifications`)
            return mapped
        } catch (error) {
            console.error('❌ [Server] Failed to fetch user certifications:', error)
            return []
        }
    })

export const createCertification = createServerFn({ method: 'POST' })
    .inputValidator((data: any) => data)
    .handler(async ({ data }) => {
        try {
            if (!db) throw new Error('Database not available')
            const result = await db.insert(userCertifications).values({
                userId: data.userId || 'user-001',
                certificationId: data.certificationId || 'manual',
                certificationName: data.certificationName || 'Unknown Certification',
                vendorName: data.vendorName || 'Unknown Vendor',
                certificationNumber: data.certificationNumber,
                issueDate: data.issueDate,
                expirationDate: data.expirationDate,
                status: data.status || 'active',
                daysUntilExpiration: data.daysUntilExpiration,
                documentUrl: data.documentUrl || '',
                verifiedAt: data.verifiedAt ? new Date(data.verifiedAt) : new Date(),
            }).returning()

            if (!result || result.length === 0) throw new Error('Failed to create certification record')
            const newCert = result[0]

            return {
                ...newCert,
                verifiedAt: newCert.verifiedAt?.toISOString() || '',
                status: newCert.status as UserCertification['status']
            } as UserCertification
        } catch (error) {
            console.error('❌ [Server] Failed to create certification:', error)
            throw error
        }
    })

export const updateCertification = createServerFn({ method: 'POST' })
    .inputValidator((data: { id: string; updates: any }) => data)
    .handler(async ({ data }) => {
        try {
            if (!db) throw new Error('Database not available')
            const { id, updates } = data
            const { verifiedAt, ...rest } = updates
            const updateData: any = { ...rest }
            if (verifiedAt) {
                updateData.verifiedAt = new Date(verifiedAt)
            }
            if ('updatedAt' in updateData) {
                delete updateData.updatedAt
            }

            const result = await db.update(userCertifications)
                .set({
                    ...updateData,
                    updatedAt: new Date()
                })
                .where(eq(userCertifications.id, id))
                .returning()

            if (!result || result.length === 0) return null
            const updatedCert = result[0]

            return {
                ...updatedCert,
                verifiedAt: updatedCert.verifiedAt?.toISOString() || '',
                status: updatedCert.status as UserCertification['status']
            } as UserCertification
        } catch (error) {
            console.error('❌ [Server] Failed to update certification:', error)
            throw error
        }
    })

export const deleteCertification = createServerFn({ method: 'POST' })
    .inputValidator((data: string) => data)
    .handler(async ({ data: id }) => {
        try {
            if (!db) throw new Error('Database not available')
            await db.delete(userCertifications).where(eq(userCertifications.id, id))
            return { success: true }
        } catch (error) {
            console.error('❌ [Server] Failed to delete certification:', error)
            throw error
        }
    })
