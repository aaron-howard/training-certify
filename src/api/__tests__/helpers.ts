/**
 * Test helpers for API route integration tests
 * Provides utilities for mocking auth, database, and making test requests
 */

import { expect, vi } from 'vitest'
import { factories } from '../../test/factories'

/**
 * Mock Clerk auth for a specific user and role
 */
export async function mockAuthForRole(
  role: string,
  authMock?: any,
  userId?: string,
) {
  const factory = (factories as any)[role.toLowerCase()]
  const user = factory
    ? factory(userId ? { id: userId } : {})
    : factories.user(userId ? { role, id: userId } : { role })

  if (authMock) {
    vi.mocked(authMock).mockResolvedValue({ userId: user.id } as any)
  } else {
    // Fallback to internal import
    const { auth } = await import('@clerk/tanstack-react-start/server')
    if (vi.isMockFunction(auth)) {
      vi.mocked(auth).mockResolvedValue({ userId: user.id } as any)
    }
  }

  return user
}

/**
 * Mock database with chainable query builder
 */
export function createMockDb(mockData: any = {}) {
  const response = Array.isArray(mockData) ? mockData : [mockData]

  const mockDb: any = {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    offset: vi.fn(),
    orderBy: vi.fn(),
    groupBy: vi.fn(),
    insert: vi.fn(),
    values: vi.fn(),
    returning: vi.fn(),
    update: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    onConflictDoNothing: vi.fn(),
    transaction: vi.fn((callback) => callback(mockDb)),
  }

  // This object represents a query in progress
  // It is thenable so it can be awaited to get the result
  const queryBuilder: any = {
    then: (resolve: any) => resolve(response),
    catch: () => { },
    finally: () => { },
  }

  // All methods on the query builder return the query builder itself
  // and they are all Vitest mocks so we can spy on them
  Object.keys(mockDb).forEach((key) => {
    if (key === 'transaction') return
    queryBuilder[key] = vi.fn().mockReturnValue(queryBuilder)
    // Also make the root mockDb methods return this queryBuilder
    mockDb[key].mockReturnValue(queryBuilder)
  })

  return mockDb
}

/**
 * Setup a mock DB that returns different values for auth and data
 */
export function setupAuthAndDataMock(authUser: any, data: any) {
  const authResponse = Array.isArray(authUser) ? authUser : [authUser]
  const dataResponse = Array.isArray(data) ? data : [data]

  const mockDb = createMockDb(dataResponse)

  // Custom behavior for auth check: the first call to limit() returns auth user
  // This override needs to stay on the queryBuilder returned by select().from()...
  // But our createMockDb returns the same queryBuilder for everything.
  // To support sequential distinct results, we can mock the .then of the query builder

  let callCount = 0
  const queryBuilder = mockDb.select() // Get the query builder
  queryBuilder.then = (resolve: any) => {
    callCount++
    if (callCount === 1) {
      resolve(authResponse)
    } else {
      resolve(dataResponse)
    }
  }

  return mockDb
}

/**
 * Create a mock request object
 */
export function createMockRequest(
  options: {
    method?: string
    url?: string
    body?: any
    headers?: Record<string, string>
  } = {},
) {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/test',
    body = null,
    headers = {},
  } = options

  return {
    method,
    url,
    headers: new Headers(headers),
    json: vi.fn().mockResolvedValue(body),
  } as any
}

/**
 * Assert that a response has the expected status and structure
 */
export async function assertResponse(
  response: any,
  expectedStatus: number,
  assertions?: (data: any) => void,
) {
  expect(response.status).toBe(expectedStatus)

  if (assertions && response.json) {
    const data = await response.json()
    assertions(data)
  }
}

/**
 * Clear all rate limiter state
 */
export function clearRateLimiter() {
  const { rateLimiter } = require('../../lib/rateLimit.server')
  if (rateLimiter && rateLimiter.clear) {
    rateLimiter.clear()
  }
}
