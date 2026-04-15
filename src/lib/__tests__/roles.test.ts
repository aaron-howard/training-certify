import { describe, expect, it } from 'vitest'
import {
  ALL_APP_ROLES,
  API_ROLE_SETS,
  USER_ROLES,
  assertAppUserRole,
  isAppUserRole,
} from '../roles'

describe('roles.ts', () => {
  it('USER_ROLES has five distinct platform roles', () => {
    expect(USER_ROLES).toHaveLength(5)
    expect(new Set(USER_ROLES).size).toBe(5)
  })

  it('isAppUserRole narrows correctly', () => {
    expect(isAppUserRole('Admin')).toBe(true)
    expect(isAppUserRole('SuperAdmin')).toBe(false)
  })

  it('assertAppUserRole throws on invalid', () => {
    expect(() => assertAppUserRole('nope')).toThrow(/Invalid platform role/)
  })

  it('ALL_APP_ROLES lists every role', () => {
    expect(ALL_APP_ROLES.length).toBe(USER_ROLES.length)
    for (const r of USER_ROLES) {
      expect(ALL_APP_ROLES).toContain(r)
    }
  })

  it('API_ROLE_SETS reference known roles only', () => {
    for (const r of API_ROLE_SETS.adminOnly) {
      expect(isAppUserRole(r)).toBe(true)
    }
    for (const r of API_ROLE_SETS.adminAuditorExecutive) {
      expect(isAppUserRole(r)).toBe(true)
    }
  })
})
