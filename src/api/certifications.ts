import { createServerFn } from '@tanstack/react-start';
import { userCertifications } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { UserCertification } from '../types';

/** Helper to obtain DB instance for each request */
async function resolveDb() {
    const { getDb } = await import('../db/index.server');
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    return db;
}

export const getUserCertifications = createServerFn({ method: 'GET' })
    .handler(async () => {
        try {
            const db = await resolveDb();
            if (!db) {
                console.log('⚠️ [Server] DB is null, returning empty user certifications');
                return [];
            }
            const result = await db.select().from(userCertifications);
            const mapped = result.map((cert) => ({
                ...cert,
                verifiedAt: cert.verifiedAt?.toISOString() || '',
                status: (cert.status || 'active') as UserCertification['status'],
            })) as UserCertification[];
            console.log(`✅ [Server] Returning ${mapped.length} user certifications`);
            return mapped;
        } catch (error) {
            console.error('❌ [Server] Failed to fetch user certifications:', error);
            return [];
        }
    });

interface CreateCertificationInput {
    userId?: string;
    certificationId?: string;
    certificationName?: string;
    vendorName?: string;
    certificationNumber?: string;
    issueDate?: string;
    expirationDate?: string;
    status?: string;
    daysUntilExpiration?: number;
    documentUrl?: string;
    verifiedAt?: string | Date;
}

export const createCertification = createServerFn({ method: 'POST' })
    .inputValidator((data: unknown): CreateCertificationInput => {
        if (typeof data === 'object' && data !== null) {
            return data as CreateCertificationInput;
        }
        throw new Error('Invalid input data');
    })
    .handler(async ({ data }) => {
        try {
            const db = await resolveDb();
            const verifiedAtValue = data.verifiedAt
                ? (typeof data.verifiedAt === 'string' ? new Date(data.verifiedAt) : data.verifiedAt)
                : new Date();

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
                verifiedAt: verifiedAtValue,
            }).returning();

            if (!result || result.length === 0) throw new Error('Failed to create certification record');
            const newCert = result[0];
            return {
                ...newCert,
                verifiedAt: newCert.verifiedAt?.toISOString() || '',
                status: newCert.status as UserCertification['status'],
            } as UserCertification;
        } catch (error) {
            console.error('❌ [Server] Failed to create certification:', error);
            throw error;
        }
    });

interface UpdateCertificationInput {
    id: string;
    updates: {
        userId?: string;
        certificationId?: string;
        certificationName?: string;
        vendorName?: string;
        certificationNumber?: string;
        issueDate?: string;
        expirationDate?: string;
        status?: string;
        daysUntilExpiration?: number;
        documentUrl?: string;
        verifiedAt?: string | Date;
    };
}

export const updateCertification = createServerFn({ method: 'POST' })
    .inputValidator((data: unknown): UpdateCertificationInput => {
        if (typeof data === 'object' && data !== null && 'id' in data && 'updates' in data) {
            return data as UpdateCertificationInput;
        }
        throw new Error('Invalid input data');
    })
    .handler(async ({ data }) => {
        try {
            const db = await resolveDb();
            const { id, updates } = data;
            const { verifiedAt, ...rest } = updates;
            const updateData: Record<string, unknown> = { ...rest };
            if (verifiedAt) {
                updateData.verifiedAt = typeof verifiedAt === 'string' ? new Date(verifiedAt) : verifiedAt;
            }
            if ('updatedAt' in updateData) {
                delete updateData.updatedAt;
            }
            const result = await db.update(userCertifications)
                .set({ ...updateData, updatedAt: new Date() })
                .where(eq(userCertifications.id, id))
                .returning();
            if (!result || result.length === 0) return null;
            const updatedCert = result[0];
            return {
                ...updatedCert,
                verifiedAt: updatedCert.verifiedAt?.toISOString() || '',
                status: updatedCert.status as UserCertification['status'],
            } as UserCertification;
        } catch (error) {
            console.error('❌ [Server] Failed to update certification:', error);
            throw error;
        }
    });

export const deleteCertification = createServerFn({ method: 'POST' })
    .inputValidator((data: string) => data)
    .handler(async ({ data: id }) => {
        try {
            const db = await resolveDb();
            await db.delete(userCertifications).where(eq(userCertifications.id, id));
            return { success: true };
        } catch (error) {
            console.error('❌ [Server] Failed to delete certification:', error);
            throw error;
        }
    });

