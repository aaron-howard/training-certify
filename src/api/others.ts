import { createServerFn } from '@tanstack/react-start'

// Mock Data for Catalog
const catalogData = {
    certifications: [
        { id: 'cert-001', name: 'AWS Certified Solutions Architect - Associate', vendor: 'AWS', level: 'Associate' },
        { id: 'cert-002', name: 'AWS Certified Solutions Architect - Professional', vendor: 'AWS', level: 'Professional' },
        { id: 'cert-003', name: 'CISSP', vendor: '(ISC)²', level: 'Expert' },
        { id: 'cert-004', name: 'CompTIA Security+', vendor: 'CompTIA', level: 'Entry' },
        { id: 'cert-005', name: 'Azure Administrator Associate', vendor: 'Microsoft', level: 'Associate' }
    ]
}

export const getCatalog = createServerFn({ method: 'GET' })
    .handler(async () => {
        await new Promise(resolve => setTimeout(resolve, 500))
        return catalogData
    })

// Mock Data for Compliance
const complianceData = {
    auditLogs: [
        { id: 'log-001', user: 'Sarah Chen', action: 'Uploaded Certificate', date: '2024-03-15', status: 'verified' },
        { id: 'log-002', user: 'Marcus Williams', action: 'Renewed Certification', date: '2024-02-10', status: 'pending' }
    ],
    stats: { complianceRate: 88, totalAudits: 156, issuesFound: 3 }
}

export const getComplianceData = createServerFn({ method: 'GET' })
    .handler(async () => {
        await new Promise(resolve => setTimeout(resolve, 500))
        return complianceData
    })

// Mock Data for Notifications
const notificationsData = [
    { id: 'notif-001', title: 'Certification Expiring', message: 'Your AWS SAA expires in 30 days.', type: 'alert', date: '2024-03-20', read: false },
    { id: 'notif-002', title: 'New Requirement', message: 'Security team now requires CISSP for senior roles.', type: 'info', date: '2024-03-18', read: true }
]

export const getNotifications = createServerFn({ method: 'GET' })
    .handler(async () => {
        await new Promise(resolve => setTimeout(resolve, 500))
        return notificationsData
    })
