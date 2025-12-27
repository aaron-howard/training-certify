import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { getDb } from '../db/db.server'
import { certifications } from '../db/schema'
import { eq } from 'drizzle-orm'

export const Route = createFileRoute('/api/catalog')({
  server: {
    handlers: {
      GET: async () => {
        try {
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
              level: c.difficulty
            }))
          })
        } catch (error) {
          console.error('Failed to fetch catalog:', error)
          return json({ error: 'Failed to fetch catalog' }, { status: 500 })
        }
      },
      DELETE: async ({ request }) => {
        try {
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
          console.log(`🗑️ [API] Deleted certification: ${id}`)
          return json({ success: true, deletedId: id })
        } catch (error) {
          console.error('Failed to delete certification:', error)
          return json({ error: 'Failed to delete certification' }, { status: 500 })
        }
      },
      POST: async ({ request }) => {
        try {
          const data = await request.json()
          const db = await getDb()
          if (!db) {
            return json({ error: 'Database not available' }, { status: 500 })
          }

          // Validate required fields
          if (!data.id || !data.name || !data.vendorName) {
            return json({ error: 'id, name, and vendorName are required' }, { status: 400 })
          }

          const result = await db.insert(certifications).values({
            id: data.id,
            name: data.name,
            vendorId: data.vendorId || data.vendorName.toLowerCase().replace(/\s/g, '-'),
            vendorName: data.vendorName,
            category: data.category || 'Cloud',
            difficulty: data.difficulty || 'Intermediate',
            description: data.description || null
          }).returning()

          console.log(`✅ [API] Added certification: ${result[0].id}`)
          return json(result[0], { status: 201 })
        } catch (error: any) {
          if (error.code === '23505') {
            return json({ error: 'Certification with this ID already exists' }, { status: 409 })
          }
          console.error('Failed to add certification:', error)
          return json({ error: 'Failed to add certification' }, { status: 500 })
        }
      }
    }
  }
})
