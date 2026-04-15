import { useMemo } from 'react'
import { logger } from '../lib/logging.client-stub'
import { ROLE_PRIVILEGE_ORDER } from '../lib/roles'
import type { AppUserRole } from '../lib/roles'

/** Platform role — alias of `AppUserRole` from `src/lib/roles.ts`. */
export type Role = AppUserRole

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

const rolePermissions: Record<AppUserRole, Permissions> = {
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

export function usePermissions(
  role: Role | string | undefined | null,
): Permissions {
  return useMemo(() => {
    const r = (role ?? 'User') as AppUserRole
    logger.debug({ role: r }, 'Permissions calculated')
    const perms = rolePermissions[r] as Permissions | undefined
    return perms ?? rolePermissions.User
  }, [role])
}

// Helper to check if a role is at least a certain level
export function isAtLeastRole(
  currentRole: Role | string | undefined,
  requiredRole: Role,
): boolean {
  const currentIndex = ROLE_PRIVILEGE_ORDER.indexOf(currentRole as AppUserRole)
  const requiredIndex = ROLE_PRIVILEGE_ORDER.indexOf(requiredRole)
  if (currentIndex === -1 || requiredIndex === -1) return false
  return currentIndex >= requiredIndex
}
