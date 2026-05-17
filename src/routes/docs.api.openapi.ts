import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createFileRoute } from '@tanstack/react-router'

/**
 * Serves the OpenAPI specification file
 *
 * This route serves the OpenAPI YAML file for Swagger UI and API documentation tools.
 * Accessible at /docs/api/openapi.yaml
 */
export const Route = createFileRoute('/docs/api/openapi')({
  server: {
    handlers: {
      GET: () => {
        try {
          // Read the OpenAPI spec file
          const openApiPath = join(process.cwd(), 'docs', 'api', 'openapi.yaml')
          const content = readFileSync(openApiPath, 'utf-8')

          return new Response(content, {
            headers: {
              'Content-Type': 'application/x-yaml',
              'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
            },
          })
        } catch (error) {
          const { logError } = require('../lib/logging.server')
          logError(
            error,
            { route: 'GET /docs/api/openapi.yaml' },
            'Failed to read OpenAPI spec file',
          )
          return new Response('OpenAPI specification not found', {
            status: 404,
            headers: {
              'Content-Type': 'text/plain',
            },
          })
        }
      },
    },
  },
})
