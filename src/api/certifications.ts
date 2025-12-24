import { createServerFn } from '@tanstack/react-start'
import { db } from '../db'
import { userCertifications } from '../db/schema'
import { eq } from 'drizzle-orm'
import type { UserCertification } from '../types'

export const getUserCertifications = createServerFn({ method: 'GET' })
    .handler(async () => {
        const result = await db.select().from(userCertifications)

        // Map DB result to UserCertification type if needed
        return result.map(cert => ({
            ...cert,
            verifiedAt: cert.verifiedAt?.toISOString() || '',
            status: cert.status as UserCertification['status']
        })) as UserCertification[]
    })

export const createCertification = createServerFn({ method: 'POST' })
    .handler(async (ctx: any) => {
        const data = ctx.data as Partial<UserCertification>
        const [newCert] = await db.insert(userCertifications).values({
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

        return {
            ...newCert,
            verifiedAt: newCert.verifiedAt?.toISOString() || '',
            status: newCert.status as UserCertification['status']
        } as UserCertification
    })

export const updateCertification = createServerFn({ method: 'POST' })
    .handler(async (ctx: any) => {
        const { id, updates } = ctx.data as { id: string; updates: Partial<UserCertification> }
        const { verifiedAt, ...rest } = updates
        const updateData: any = { ...rest }
        if (verifiedAt) {
            updateData.verifiedAt = new Date(verifiedAt)
        }
        if ('updatedAt' in updateData) {
            delete updateData.updatedAt
        }

        const [updatedCert] = await db.update(userCertifications)
            .set({
                ...updateData,
                updatedAt: new Date()
            })
            .where(eq(userCertifications.id, id))
            .returning()

        if (!updatedCert) return null

        return {
            ...updatedCert,
            verifiedAt: updatedCert.verifiedAt?.toISOString() || '',
            status: updatedCert.status as UserCertification['status']
        } as UserCertification
    })

export const deleteCertification = createServerFn({ method: 'POST' })
    .handler(async (ctx: any) => {
        const id = ctx.data as string
        await db.delete(userCertifications).where(eq(userCertifications.id, id))
        return { success: true }
    })
