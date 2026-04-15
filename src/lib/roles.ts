/**
 * Canonical platform user roles (Postgres enum `role` / `users.role`).
 * Keep `roleEnum` in `src/db/schema.ts` aligned with `USER_ROLES`.
 */

export const USER_ROLES = [
  'Admin',
  'User',
  'Manager',
  'Executive',
  'Auditor',
] as const

export type AppUserRole = (typeof USER_ROLES)[number]

/** Non-empty tuple for Drizzle `pgEnum`. */
export const USER_ROLE_ENUM_VALUES = USER_ROLES as unknown as [
  AppUserRole,
  ...Array<AppUserRole>,
]

/** Default allow-list for authenticated API handlers (any logged-in platform role). */
export const ALL_APP_ROLES: ReadonlyArray<AppUserRole> = [...USER_ROLES]

/**
 * Ascending privilege for `isAtLeastRole` (index 0 = least privilege).
 * Not the same order as the DB enum — only used for comparisons.
 */
export const ROLE_PRIVILEGE_ORDER: ReadonlyArray<AppUserRole> = [
  'User',
  'Auditor',
  'Executive',
  'Manager',
  'Admin',
] as const

export function isAppUserRole(value: string): value is AppUserRole {
  return (USER_ROLES as ReadonlyArray<string>).includes(value)
}

export function assertAppUserRole(value: string): AppUserRole {
  if (!isAppUserRole(value)) {
    throw new Error(`Invalid platform role: ${value}`)
  }
  return value
}

/** Common `allowedRoles` presets for API routes. */
export const API_ROLE_SETS = {
  adminOnly: ['Admin'] as const satisfies ReadonlyArray<AppUserRole>,
  adminAuditorExecutive: ['Admin', 'Auditor', 'Executive'] as const,
  adminManager: ['Admin', 'Manager'] as const,
  certificationWrite: ['Admin', 'Manager', 'User'] as const,
  exportReaders: ['Admin', 'Manager', 'Auditor', 'Executive'] as const,
} as const
