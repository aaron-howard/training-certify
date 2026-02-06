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
 * Mock database with chainable query builder that properly handles Drizzle ORM patterns
 * Handles patterns like: db.select().from(table) and db.insert(table).values(data)
 */
export function createMockDb(mockData: any = {}) {
  const response = Array.isArray(mockData) ? mockData : [mockData]

  // Create a thenable query builder that can be chained
  const createQueryBuilder = (result: any = response) => {
    const queryBuilder: any = {
      // Make it awaitable by implementing thenable interface
      then: (resolve: any, reject?: any) => {
        // Return a promise that resolves with the result
        const promise = Promise.resolve(result)
        return promise.then(resolve, reject)
      },
      catch: (reject: any) => {
        return Promise.resolve(result).catch(reject)
      },
      finally: (handler: any) => {
        return Promise.resolve(result).finally(handler)
      },
    }

    // Chainable methods that return the builder itself
    const chainableMethods = [
      'where',
      'limit',
      'offset',
      'orderBy',
      'groupBy',
      'values',
      'set',
      'returning',
      'onConflictDoNothing',
      'onConflictDoUpdate',
      'innerJoin',
      'leftJoin',
      'rightJoin',
    ]

    chainableMethods.forEach((method) => {
      queryBuilder[method] = vi.fn().mockReturnValue(queryBuilder)
    })

    return queryBuilder
  }

  // For select queries: db.select().from(table)
  const createSelectBuilder = () => {
    const builder = createQueryBuilder()
    // from() is called on the result of select()
    builder.from = vi.fn().mockReturnValue(builder)
    return builder
  }

  // For insert queries: db.insert(table).values(data)
  const createInsertBuilder = () => {
    const builder = createQueryBuilder()
    builder.values = vi.fn().mockReturnValue(builder)
    builder.onConflictDoNothing = vi.fn().mockReturnValue(builder)
    builder.onConflictDoUpdate = vi.fn().mockReturnValue(builder)
    return builder
  }

  // For update queries: db.update(table).set(data).where(condition)
  const createUpdateBuilder = () => {
    const builder = createQueryBuilder()
    builder.set = vi.fn().mockReturnValue(builder)
    builder.where = vi.fn().mockReturnValue(builder)
    return builder
  }

  const mockDb: any = {
    select: vi.fn().mockReturnValue(createSelectBuilder()),
    insert: vi.fn().mockReturnValue(createInsertBuilder()),
    update: vi.fn().mockReturnValue(createUpdateBuilder()),
    delete: vi.fn().mockReturnValue(createQueryBuilder()),
    execute: vi.fn().mockResolvedValue(response),
    transaction: vi.fn(async (callback) => {
      return await callback(mockDb)
    }),
  }

  return mockDb
}

/**
 * Setup a mock DB that returns different values for auth and data queries
 * This handles the pattern where auth checks happen first, then data queries
 * First select().from() call returns auth user, subsequent calls return data
 */
export function setupAuthAndDataMock(authUser: any, data: any) {
  const authResponse = Array.isArray(authUser) ? authUser : [authUser]
  const dataResponse = Array.isArray(data) ? data : [data]

  let queryExecutionCount = 0

  // Create select builder that returns auth on first execution, data on subsequent executions
  const createSelectBuilder = () => {
    const builder: any = {
      then: (resolve: any, reject?: any) => {
        queryExecutionCount++
        // First query execution is auth check (in requireRole -> getAuthenticatedUser)
        // Subsequent executions are data queries
        const result = queryExecutionCount === 1 ? authResponse : dataResponse
        const promise = Promise.resolve(result)
        return promise.then(resolve, reject)
      },
      catch: (reject: any) => {
        return Promise.resolve(dataResponse).catch(reject)
      },
      finally: (handler: any) => {
        return Promise.resolve(dataResponse).finally(handler)
      },
    }

    // Chainable methods
    const chainableMethods = [
      'where',
      'limit',
      'offset',
      'orderBy',
      'groupBy',
      'innerJoin',
      'leftJoin',
      'rightJoin',
    ]

    chainableMethods.forEach((method) => {
      builder[method] = vi.fn().mockReturnValue(builder)
    })

    // from() returns the builder itself (chaining: select().from())
    builder.from = vi.fn().mockReturnValue(builder)

    return builder
  }

  // Insert/update builders always return data response
  const createInsertBuilder = () => {
    const builder: any = {
      then: (resolve: any) => Promise.resolve(dataResponse).then(resolve),
      catch: (reject: any) => Promise.resolve(dataResponse).catch(reject),
      finally: (handler: any) => Promise.resolve(dataResponse).finally(handler),
    }
    builder.values = vi.fn().mockReturnValue(builder)
    builder.returning = vi.fn().mockReturnValue(builder)
    builder.onConflictDoNothing = vi.fn().mockReturnValue(builder)
    builder.onConflictDoUpdate = vi.fn().mockReturnValue(builder)
    return builder
  }

  const createUpdateBuilder = () => {
    const builder: any = {
      then: (resolve: any) => Promise.resolve(dataResponse).then(resolve),
      catch: (reject: any) => Promise.resolve(dataResponse).catch(reject),
      finally: (handler: any) => Promise.resolve(dataResponse).finally(handler),
    }
    builder.set = vi.fn().mockReturnValue(builder)
    builder.where = vi.fn().mockReturnValue(builder)
    builder.returning = vi.fn().mockReturnValue(builder)
    return builder
  }

  const mockDb: any = {
    select: vi.fn().mockReturnValue(createSelectBuilder()),
    insert: vi.fn().mockReturnValue(createInsertBuilder()),
    update: vi.fn().mockReturnValue(createUpdateBuilder()),
    delete: vi.fn().mockReturnValue(createSelectBuilder()), // Delete uses select pattern
    execute: vi.fn().mockResolvedValue(dataResponse),
    transaction: vi.fn(async (callback) => {
      return await callback(mockDb)
    }),
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

/**
 * Setup database and auth mocks for a test
 * This ensures both getDb() and getDbOrThrow() are mocked, and requireRole returns the correct session
 *
 * @param user - The user to mock authentication for
 * @param mockData - The data to return from database queries (since requireRole is mocked, this is the main data)
 * @param options - Configuration options
 */
export async function setupTestMocks(
  user: any,
  mockData: any,
  options: { mockAuth?: boolean; skipAuthMock?: boolean } = {},
) {
  const { getDb, getDbOrThrow } = await import('../../db/db.server')
  const { requireRole } = await import('../../lib/auth.server')

  // If requireRole is mocked (default), we don't need auth queries
  // So create a mock that just returns the data directly
  const mockDb = options.skipAuthMock
    ? setupAuthAndDataMock(user, mockData) // Use auth/data sequence if auth isn't mocked
    : createMockDb(mockData) // Just return data directly if auth is mocked

  vi.mocked(getDb).mockResolvedValue(mockDb)
  vi.mocked(getDbOrThrow).mockResolvedValue(mockDb)

  if (options.mockAuth !== false) {
    vi.mocked(requireRole).mockResolvedValue({
      userId: user.id,
      role: user.role,
      email: user.email,
    })
  }

  return { mockDb, getDb, getDbOrThrow, requireRole }
}
