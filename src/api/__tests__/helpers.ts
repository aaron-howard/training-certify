/**
 * Test helpers for API route integration tests
 * Provides utilities for mocking auth, database, and making test requests
 */

import { auth } from '@clerk/tanstack-react-start/server'
import { expect, vi } from 'vitest'
import { factories } from '../../test/factories'

/**
 * Mock Clerk auth for a specific user and role
 */
export function mockAuthForRole(
  role: string,
  authMock: typeof auth = auth,
  userId?: string,
) {
  const factory = (factories as any)[role.toLowerCase()]
  const user = factory
    ? factory(userId ? { id: userId } : {})
    : factories.user(userId ? { role, id: userId } : { role })

  vi.mocked(authMock).mockResolvedValue({ userId: user.id } as any)

  return user
}

/**
 * Sentinel for createMockDbWithSequence: use { __reject: error } as a response
 * to make that query's promise reject (e.g. duplicate key).
 */
export const REJECT = (error: unknown) => ({ __reject: error })

/**
 * Create a mock DB that returns a different result for each successive query execution.
 * Use for routes that run multiple queries (e.g. count then select for pagination).
 * To make a query reject, pass REJECT(error) as that position in the array.
 *
 * @param responses - Array of results; each awaited query gets the next entry (last one repeats)
 */
export function createMockDbWithSequence(responses: Array<any>) {
  let executionIndex = 0

  const getNextResponse = () => {
    const index = Math.min(executionIndex++, responses.length - 1)
    return responses[index]
  }

  const normalizeResponse = (raw: any) => {
    if (raw && typeof raw === 'object' && '__reject' in raw) return raw
    return Array.isArray(raw) ? raw : [raw]
  }

  const createQueryBuilder = () => {
    const queryBuilder: any = {
      then: (resolve: any, reject?: any) => {
        const response = getNextResponse()
        if (response && typeof response === 'object' && '__reject' in response)
          return Promise.reject(
            (response as { __reject: unknown }).__reject,
          ).then(resolve, reject)
        return Promise.resolve(normalizeResponse(response)).then(
          resolve,
          reject,
        )
      },
      catch: (reject: any) => {
        const response = getNextResponse()
        if (response && typeof response === 'object' && '__reject' in response)
          return Promise.reject(
            (response as { __reject: unknown }).__reject,
          ).catch(reject)
        return Promise.resolve(normalizeResponse(response)).catch(reject)
      },
      finally: (handler: any) => {
        const response = getNextResponse()
        if (response && typeof response === 'object' && '__reject' in response)
          return Promise.reject(
            (response as { __reject: unknown }).__reject,
          ).finally(handler)
        return Promise.resolve(normalizeResponse(response)).finally(handler)
      },
    }
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

  const createSelectBuilder = () => {
    const builder = createQueryBuilder()
    builder.from = vi.fn().mockReturnValue(builder)
    return builder
  }

  const createInsertBuilder = () => {
    const builder = createQueryBuilder()
    builder.values = vi.fn().mockReturnValue(builder)
    builder.onConflictDoNothing = vi.fn().mockReturnValue(builder)
    builder.onConflictDoUpdate = vi.fn().mockReturnValue(builder)
    return builder
  }

  const createUpdateBuilder = () => {
    const builder = createQueryBuilder()
    builder.set = vi.fn().mockReturnValue(builder)
    builder.where = vi.fn().mockReturnValue(builder)
    return builder
  }

  const mockDb: any = {
    select: vi.fn().mockImplementation(() => createSelectBuilder()),
    insert: vi.fn().mockReturnValue(createInsertBuilder()),
    update: vi.fn().mockReturnValue(createUpdateBuilder()),
    delete: vi.fn().mockReturnValue(createQueryBuilder()),
    execute: vi
      .fn()
      .mockImplementation(() => Promise.resolve(getNextResponse())),
    transaction: vi.fn(async (callback: (tx: any) => Promise<any>) => {
      return await callback(mockDb)
    }),
  }
  return mockDb
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
 * @param mockData - The data to return from database queries (since requireRole is mocked, this is the main data).
 *   For routes that run multiple queries (e.g. count then select), pass options.dbSequence instead.
 * @param options - Configuration options. Use dbSequence for pagination-style routes: first item is count result, second is data array.
 */
export async function setupTestMocks(
  user: any,
  mockData: any,
  options: {
    mockAuth?: boolean
    skipAuthMock?: boolean
    /** For routes that run count then select (e.g. GET /api/users). First response = [{ count: N }], second = data array. */
    dbSequence?: Array<any>
  } = {},
) {
  const { getDb, getDbOrThrow } = await import('../../db/db.server')
  const { requireRole } = await import('../../lib/auth.server')

  let mockDb: any
  if (options.dbSequence && options.dbSequence.length > 0) {
    mockDb = createMockDbWithSequence(options.dbSequence)
  } else if (options.skipAuthMock) {
    mockDb = setupAuthAndDataMock(user, mockData)
  } else {
    mockDb = createMockDb(mockData)
  }

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
