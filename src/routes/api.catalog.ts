import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { getDb } from '../db/db.server'
import { certifications } from '../db/schema'
import { requireRole } from '../lib/auth.server'

export const Route = createFileRoute('/api/catalog')({
  server: {
    handlers: {
      GET: async () => {
        try {
          await requireRole([
            'Admin',
            'Manager',
            'Auditor',
            'Executive',
            'User',
          ])

          const db = await getDb()
          if (!db) {
            return json({ error: 'Database not available' }, { status: 500 })
          }

          const result = await db.select().from(certifications)
          return json({
            certifications: result.map((c) => ({
              id: c.id,
              name: c.name,
              vendor: c.vendorName,
              level: c.difficulty,
              price: c.price,
              category: c.category,
              description: c.description,
            })),
          })
        } catch (error: any) {
          console.error('Failed to fetch catalog:', error)
          return json(
            { error: 'Forbidden or internal error', details: error.message },
            { status: error.message.includes('Forbidden') ? 403 : 500 },
          )
        }
      },
      DELETE: async ({ request }) => {
        try {
          await requireRole(['Admin'])

          const url = new URL(request.url)
          const id = url.searchParams.get('id')

          if (!id) {
            return json({ error: 'Missing id parameter' }, { status: 400 })
          }

          const db = await getDb()
          if (!db) {
            return json({ error: 'Database not available' }, { status: 500 })
          }

          await db.delete(certifications).where(eq(certifications.id, id))
          return json({ success: true, deletedId: id })
        } catch (error: any) {
          console.error('Failed to delete certification:', error)
          return json(
            { error: 'Forbidden or internal error', details: error.message },
            { status: error.message.includes('Forbidden') ? 403 : 500 },
          )
        }
      },
      POST: async ({ request }) => {
        try {
          await requireRole(['Admin'])

          const data = await request.json()
          const db = await getDb()
          if (!db) {
            return json({ error: 'Database not available' }, { status: 500 })
          }

          if (!data.id || !data.name || !data.vendorName) {
            return json(
              { error: 'id, name, and vendorName are required' },
              { status: 400 },
            )
          }

          const result = await db
            .insert(certifications)
            .values({
              id: data.id,
              name: data.name,
              vendorId:
                data.vendorId ||
                data.vendorName.toLowerCase().replace(/\s/g, '-'),
              vendorName: data.vendorName,
              category: data.category || 'Cloud',
              difficulty: data.difficulty || 'Intermediate',
              price: data.price || null,
              description: data.description || null,
            })
            .returning()

          return json(result[0], { status: 201 })
        } catch (error: any) {
          if (error.code === '23505') {
            return json(
              { error: 'Certification with this ID already exists' },
              { status: 409 },
            )
          }
          console.error('Failed to add certification:', error)
          return json(
            { error: 'Forbidden or internal error', details: error.message },
            { status: error.message.includes('Forbidden') ? 403 : 500 },
          )
        }
      },
    },
  },
})
