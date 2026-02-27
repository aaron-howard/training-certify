import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { generateCSRFToken } from '../lib/csrf.server'
import { requireRateLimit } from '../lib/rateLimit.server'
import { handleApiError, withApiMetrics } from '../lib/api-helpers.server'

/**
 * GET /api/csrf
 *
 * Returns a CSRF token for use with mutation API requests (POST, PATCH, DELETE).
 * Client should send it in the X-CSRF-Token header.
 *
 * **Rate limited** to avoid token farming.
 */
export const Route = createFileRoute('/api/csrf')({
  server: {
    handlers: {
      GET: async ({ request }) =>
        withApiMetrics('GET', '/api/csrf', async () => {
          try {
            const clientId =
              request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
              request.headers.get('x-real-ip') ||
              'anonymous'
            await requireRateLimit(`csrf:${clientId}`, {
              windowMs: 60_000,
              maxRequests: 30,
            })

            const token = generateCSRFToken()
            return json({ token })
          } catch (error) {
            return handleApiError(error, 'GET /api/csrf')
          }
        }),
    },
  },
})
