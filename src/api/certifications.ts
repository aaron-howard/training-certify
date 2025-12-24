import { createServerFn } from '@tanstack/react-start'
import type { UserCertification } from '../types'

// Mock Data
let userCertifications: UserCertification[] = [
    {
        id: 'uc-001',
        userId: 'user-001',
        certificationId: 'cert-aws-saa',
        certificationName: 'AWS Certified Solutions Architect - Associate',
        vendorName: 'Amazon Web Services',
        certificationNumber: 'AWS-SAA-2024-789456',
        issueDate: '2024-03-15',
        expirationDate: '2027-03-15',
        status: 'active',
        daysUntilExpiration: 900,
        documentUrl: '/uploads/aws-saa-certificate.pdf',
        verifiedAt: '2024-03-15T14:30:00Z'
    },
    {
        id: 'uc-002',
        userId: 'user-001',
        certificationId: 'cert-azure-admin',
        certificationName: 'Microsoft Certified: Azure Administrator Associate',
        vendorName: 'Microsoft',
        certificationNumber: 'AZ104-2024-112233',
        issueDate: '2024-01-10',
        expirationDate: '2026-01-10',
        status: 'expiring-soon',
        daysUntilExpiration: 45,
        documentUrl: '/uploads/azure-admin-certificate.pdf',
        verifiedAt: '2024-01-10T09:15:00Z'
    },
    {
        id: 'uc-003',
        userId: 'user-001',
        certificationId: 'cert-cissp',
        certificationName: 'Certified Information Systems Security Professional (CISSP)',
        vendorName: '(ISC)²',
        certificationNumber: 'CISSP-987654',
        issueDate: '2022-06-20',
        expirationDate: '2028-06-20',
        status: 'active',
        daysUntilExpiration: 1200,
        documentUrl: '/uploads/cissp-certificate.pdf',
        verifiedAt: '2022-06-20T16:45:00Z'
    },
    {
        id: 'uc-004',
        userId: 'user-001',
        certificationId: 'cert-aws-dev',
        certificationName: 'AWS Certified Developer - Associate',
        vendorName: 'Amazon Web Services',
        certificationNumber: 'AWS-DEV-2022-445566',
        issueDate: '2022-08-05',
        expirationDate: '2025-08-05',
        status: 'expired',
        daysUntilExpiration: -30,
        documentUrl: '/uploads/aws-dev-certificate.pdf',
        verifiedAt: '2022-08-05T11:20:00Z'
    },
    {
        id: 'uc-005',
        userId: 'user-001',
        certificationId: 'cert-secplus',
        certificationName: 'CompTIA Security+',
        vendorName: 'CompTIA',
        certificationNumber: 'COMP001234567SEC',
        issueDate: '2023-03-12',
        expirationDate: '2026-03-12',
        status: 'expiring',
        daysUntilExpiration: 120,
        documentUrl: '/uploads/secplus-certificate.pdf',
        verifiedAt: '2023-03-12T13:00:00Z'
    }
]

export const getUserCertifications = createServerFn({ method: 'GET' })
    .handler(async () => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        return userCertifications
    })

export const createCertification = createServerFn({ method: 'POST' })
    .handler(async (ctx: { data: Partial<UserCertification> }) => {
        const { data } = ctx
        const newCert: UserCertification = {
            userId: 'user-001',
            certificationId: 'manual',
            documentUrl: '',
            verifiedAt: new Date().toISOString(),
            daysUntilExpiration: 365,
            ...data,
            id: `uc-${Math.random().toString(36).substr(2, 9)}`,
            status: data.status || 'active',
        } as UserCertification
        userCertifications = [...userCertifications, newCert]
        return newCert
    })

export const updateCertification = createServerFn({ method: 'POST' }) // Patch might not be supported well in some versions
    .handler(async (ctx: { data: { id: string; updates: Partial<UserCertification> } }) => {
        const { data } = ctx
        userCertifications = userCertifications.map(c =>
            c.id === data.id ? { ...c, ...data.updates } : c
        )
        return userCertifications.find(c => c.id === data.id)
    })

export const deleteCertification = createServerFn({ method: 'POST' })
    .handler(async (ctx: { data: string }) => {
        const id = ctx.data
        userCertifications = userCertifications.filter(c => c.id !== id)
        return { success: true }
    })
