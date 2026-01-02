import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { getDb } from '../db/db.server'
import { teamRequirements } from '../db/schema'

export const Route = createFileRoute('/api/team-requirements')({
    server: {
        handlers: {
            GET: async ({ request }) => {
                try {
                    const url = new URL(request.url)
                    const teamId = url.searchParams.get('teamId')
                    if (!teamId) return json({ error: 'Missing teamId' }, { status: 400 })

                    const db = await getDb()
                    if (!db) return json({ error: 'DB not available' }, { status: 500 })

                    const requirements = await db.select().from(teamRequirements).where(eq(teamRequirements.teamId, teamId))
                    return json(requirements)
                } catch (error) {
                    console.error('[API Team Requirements GET] Error:', error)
                    return json({ error: 'Failed' }, { status: 500 })
                }
            },
            POST: async ({ request }) => {
                try {
                    const data = await request.json()
                    const db = await getDb()
                    if (!db) return json({ error: 'DB not available' }, { status: 500 })

                    if (!data.teamId || !data.certificationId) {
                        return json({ error: 'Missing fields' }, { status: 400 })
                    }

                    // Upsert logic (Check if exists)
                    const existing = await db.select()
                        .from(teamRequirements)
                        .where(eq(teamRequirements.teamId, data.teamId))
                    // Note: ideally we also check certificationId but for now let's keep it simple
                    // If we want unique requirements per cert per team:
                    // .where(and(eq(...teamId), eq(...certificationId)))

                    // For now, let's just insert
                    const result = await db.insert(teamRequirements).values({
                        teamId: data.teamId,
                        certificationId: data.certificationId,
                        targetCount: data.targetCount || 1,
                    }).returning()

                    return json(result[0], { status: 201 })
                } catch (error) {
                    console.error('[API Team Requirements POST] Error:', error)
                    return json({ error: 'Failed' }, { status: 500 })
                }
            },
            DELETE: async ({ request }) => {
                try {
                    const url = new URL(request.url)
                    const id = url.searchParams.get('id')
                    if (!id) return json({ error: 'Missing id' }, { status: 400 })

                    const db = await getDb()
                    if (!db) return json({ error: 'DB not available' }, { status: 500 })

                    await db.delete(teamRequirements).where(eq(teamRequirements.id, id))
                    return json({ success: true })
                } catch (error) {
                    console.error('[API Team Requirements DELETE] Error:', error)
                    return json({ error: 'Failed' }, { status: 500 })
                }
            }
        }
    }
})
