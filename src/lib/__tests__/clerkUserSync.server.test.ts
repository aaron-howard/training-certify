import { describe, expect, it, vi } from 'vitest'
import { upsertUserFromClerkProfile } from '../clerkUserSync.server'

function createMockDb() {
  return {
    select: vi.fn(),
    insert: vi.fn(),
    transaction: vi.fn(),
  }
}

describe('upsertUserFromClerkProfile', () => {
  it('rejects empty email before querying the database', async () => {
    const db = createMockDb()

    await expect(
      upsertUserFromClerkProfile(db as never, {
        id: 'user_new',
        name: 'New User',
        email: '',
      }),
    ).rejects.toThrow('A verified email address is required')

    expect(db.select).not.toHaveBeenCalled()
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('rejects whitespace-only email before querying the database', async () => {
    const db = createMockDb()

    await expect(
      upsertUserFromClerkProfile(db as never, {
        id: 'user_new',
        name: 'New User',
        email: '   ',
      }),
    ).rejects.toThrow('A verified email address is required')

    expect(db.select).not.toHaveBeenCalled()
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { upsertUserFromClerkProfile } from '../clerkUserSync.server'
import { factories } from '../../test/factories'

function createMockDb(sequence: {
  byId?: Array<unknown>
  byEmail?: Array<unknown>
  insertResult?: Array<unknown>
  afterMigrate?: Array<unknown>
}) {
  let selectCall = 0
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockImplementation(() => {
      selectCall += 1
      if (selectCall === 1) return Promise.resolve(sequence.byId ?? [])
      if (selectCall === 2) return Promise.resolve(sequence.byEmail ?? [])
      return Promise.resolve(sequence.afterMigrate ?? [])
    }),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi
      .fn()
      .mockResolvedValue(sequence.insertResult ?? [factories.user()]),
    transaction: vi.fn(),
  }
  return mockDb
}

describe('upsertUserFromClerkProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects empty email before querying the database', async () => {
    const db = createMockDb({})

    await expect(
      upsertUserFromClerkProfile(db as never, {
        id: 'user_b',
        name: 'User B',
        email: '',
      }),
    ).rejects.toThrow(/verified email address is required/i)

    expect(db.select).not.toHaveBeenCalled()
  })

  it('does not migrate by email when allowEmailMigration is false', async () => {
    const existing = factories.user({
      id: 'user_a',
      email: 'shared@example.com',
    })
    const db = createMockDb({ byId: [], byEmail: [existing] })

    await expect(
      upsertUserFromClerkProfile(
        db as never,
        {
          id: 'user_b',
          name: 'User B',
          email: 'shared@example.com',
        },
        { allowEmailMigration: false },
      ),
    ).rejects.toThrow(/already linked to another account/i)

    expect(db.transaction).not.toHaveBeenCalled()
  })

  it('returns existing row when clerk id already exists', async () => {
    const existing = factories.user({ id: 'user_a', email: 'a@example.com' })
    const db = createMockDb({ byId: [existing] })

    const result = await upsertUserFromClerkProfile(db as never, {
      id: 'user_a',
      name: 'User A',
      email: 'a@example.com',
    })

    expect(result).toBe(existing)
    expect(db.limit).toHaveBeenCalledTimes(1)
  })
})
