import { useMemo } from 'react'

export type Role = 'Admin' | 'Manager' | 'Executive' | 'Auditor' | 'User'

export interface Permissions {
    // Dashboard
    canViewDashboard: boolean

    // Certifications
    canManageOwnCerts: boolean
    canViewAllCerts: boolean

    // Team
    canViewTeam: boolean
    canManageTeam: boolean
    canCreateTeam: boolean
    canDeleteTeam: boolean

    // Catalog
    canViewCatalog: boolean
    canManageCatalog: boolean
    canSeedCatalog: boolean
    canSyncCatalog: boolean

    // Audit
    canViewAuditLogs: boolean

    // Users
    canManageUsers: boolean
    canPromoteUsers: boolean

    // Notifications
    canManageNotificationCategories: boolean
    canManageOwnNotificationSettings: boolean
}

const rolePermissions: Record<Role, Permissions> = {
    Admin: {
        canViewDashboard: true,
        canManageOwnCerts: true,
        canViewAllCerts: true,
        canViewTeam: true,
        canManageTeam: true,
        canCreateTeam: true,
        canDeleteTeam: true,
        canViewCatalog: true,
        canManageCatalog: true,
        canSeedCatalog: true,
        canSyncCatalog: true,
        canViewAuditLogs: true,
        canManageUsers: true,
        canPromoteUsers: true,
        canManageNotificationCategories: true,
        canManageOwnNotificationSettings: true,
    },
    Manager: {
        canViewDashboard: true,
        canManageOwnCerts: true,
        canViewAllCerts: true,
        canViewTeam: true,
        canManageTeam: true,
        canCreateTeam: false,
        canDeleteTeam: false,
        canViewCatalog: true,
        canManageCatalog: false,
        canSeedCatalog: false,
        canSyncCatalog: false,
        canViewAuditLogs: true,
        canManageUsers: false,
        canPromoteUsers: false,
        canManageNotificationCategories: false,
        canManageOwnNotificationSettings: true,
    },
    Auditor: {
        canViewDashboard: true,
        canManageOwnCerts: true,
        canViewAllCerts: true,
        canViewTeam: true,
        canManageTeam: false,
        canCreateTeam: false,
        canDeleteTeam: false,
        canViewCatalog: true,
        canManageCatalog: false,
        canSeedCatalog: false,
        canSyncCatalog: false,
        canViewAuditLogs: true,
        canManageUsers: false,
        canPromoteUsers: false,
        canManageNotificationCategories: false,
        canManageOwnNotificationSettings: true,
    },
    Executive: {
        canViewDashboard: true,
        canManageOwnCerts: true,
        canViewAllCerts: true,
        canViewTeam: true,
        canManageTeam: false,
        canCreateTeam: false,
        canDeleteTeam: false,
        canViewCatalog: true,
        canManageCatalog: false,
        canSeedCatalog: false,
        canSyncCatalog: false,
        canViewAuditLogs: true,
        canManageUsers: false,
        canPromoteUsers: false,
        canManageNotificationCategories: false,
        canManageOwnNotificationSettings: true,
    },
    User: {
        canViewDashboard: true,
        canManageOwnCerts: true,
        canViewAllCerts: false,
        canViewTeam: false,
        canManageTeam: false,
        canCreateTeam: false,
        canDeleteTeam: false,
        canViewCatalog: true,
        canManageCatalog: false,
        canSeedCatalog: false,
        canSyncCatalog: false,
        canViewAuditLogs: false,
        canManageUsers: false,
        canPromoteUsers: false,
        canManageNotificationCategories: false,
        canManageOwnNotificationSettings: true,
    },
}

export function usePermissions(role: Role | string | undefined | null): Permissions {
    return useMemo(() => {
        const r = (role as Role) || 'User'
        console.log(`🛡️ [Permissions] Calculating for role: ${r}`)
        return rolePermissions[r] || rolePermissions['User']
    }, [role])
}

// Helper to check if a role is at least a certain level
export function isAtLeastRole(currentRole: Role | string | undefined, requiredRole: Role): boolean {
    const roleHierarchy: Array<Role> = ['User', 'Auditor', 'Executive', 'Manager', 'Admin']
    const currentIndex = roleHierarchy.indexOf(currentRole as Role)
    const requiredIndex = roleHierarchy.indexOf(requiredRole)
    return currentIndex >= requiredIndex
}
