/**
 * Environment validation — production fail-fast for CSRF and Blob tokens
 */

import { describe, expect, it } from 'vitest'
import { parseEnv } from '../env'

const REQUIRED = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/testdb',
  CLERK_SECRET_KEY: 'sk_test_abcdefghijklmnopqrstuvwxyz',
  VITE_CLERK_PUBLISHABLE_KEY: 'pk_test_abcdefghijklmnopqrstuvwxyz',
}

describe('env validation (parseEnv)', () => {
  it('allows development without CSRF_SECRET or BLOB_READ_WRITE_TOKEN', () => {
    const env = parseEnv({
      ...REQUIRED,
      NODE_ENV: 'development',
    })
    expect(env.NODE_ENV).toBe('development')
    expect(env.CSRF_SECRET).toBeUndefined()
    expect(env.BLOB_READ_WRITE_TOKEN).toBeUndefined()
  })

  it('requires CSRF_SECRET and BLOB_READ_WRITE_TOKEN in production', () => {
    expect(() =>
      parseEnv({
        ...REQUIRED,
        NODE_ENV: 'production',
      }),
    ).toThrow()
  })

  it('accepts production when CSRF_SECRET and BLOB_READ_WRITE_TOKEN are set', () => {
    const env = parseEnv({
      ...REQUIRED,
      NODE_ENV: 'production',
      CSRF_SECRET: 'a'.repeat(32),
      BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_test_token',
    })
    expect(env.NODE_ENV).toBe('production')
    expect(env.CSRF_SECRET).toHaveLength(32)
    expect(env.BLOB_READ_WRITE_TOKEN).toBe('vercel_blob_rw_test_token')
  })

  it('rejects production CSRF_SECRET shorter than 32 characters', () => {
    expect(() =>
      parseEnv({
        ...REQUIRED,
        NODE_ENV: 'production',
        CSRF_SECRET: 'too-short',
        BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_test_token',
      }),
    ).toThrow()
  })

  it('allows test env without production secrets', () => {
    const env = parseEnv({
      ...REQUIRED,
      NODE_ENV: 'test',
    })
    expect(env.NODE_ENV).toBe('test')
  })
})
