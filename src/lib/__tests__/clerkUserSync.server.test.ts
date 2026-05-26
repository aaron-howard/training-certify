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
  })
})
