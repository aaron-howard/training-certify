/**
 * Test setup file for Vitest
 * Configures global test environment, mocks, and utilities.
 * Ensures test isolation (cache cleared, mocks reset) so tests can run in parallel.
 */

import { afterEach, beforeAll, vi } from 'vitest'

// Mock Clerk auth and client globally so API tests don't hit real Clerk
vi.mock('@clerk/tanstack-react-start/server', () => ({
  auth: vi.fn(),
  clerkClient: {
    users: {
      getUser: vi
        .fn()
        .mockResolvedValue({ id: 'test-user', emailAddresses: [] }),
    },
  },
}))

// Avoid loading Vercel Blob client in unit tests (can hang or require network)
vi.mock('@vercel/blob', () => ({
  put: vi.fn().mockResolvedValue({ url: 'https://example.test/mock-blob' }),
}))

beforeAll(() => {
  process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  process.env.CLERK_SECRET_KEY =
    process.env.CLERK_SECRET_KEY ?? 'sk_test_00000000000000000000000000000000'
  process.env.VITE_CLERK_PUBLISHABLE_KEY =
    process.env.VITE_CLERK_PUBLISHABLE_KEY ??
    'pk_test_00000000000000000000000000000000'
})

afterEach(() => {
  vi.clearAllMocks()
  // Clear in-memory cache so tests don't leak state when running in parallel
  import('../lib/cache.server').then(
    (m) => {
      // Guard for mocked cache in tests (m.cache may lack clear)
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- cache may be mocked
      if (m?.cache?.clear != null && typeof m.cache.clear === 'function')
        m.cache.clear()
    },
    () => {},
  )
})

declare global {
  var testUtils: Record<string, any>
}

global.testUtils = {}
