/**
 * Metrics endpoint for Prometheus scraping
 * Exposes application metrics in Prometheus format
 */

import { createFileRoute } from '@tanstack/react-router'
import { requireInternalOpsAuth } from '../lib/internalOpsAuth.server'
import { metrics } from '../lib/monitoring.server'
import { applySecurityHeaders } from '../lib/securityHeaders.server'

export const Route = createFileRoute('/metrics')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const denied = requireInternalOpsAuth(request)
        if (denied) return applySecurityHeaders(denied)

        try {
          const prometheusMetrics = metrics.getPrometheusMetrics()

          return applySecurityHeaders(
            new Response(prometheusMetrics, {
              status: 200,
              headers: {
                'Content-Type': 'text/plain; version=0.0.4',
              },
            }),
          )
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : 'Unknown error'
          return applySecurityHeaders(
            new Response(`# Error generating metrics: ${message}`, {
              status: 500,
              headers: {
                'Content-Type': 'text/plain',
              },
            }),
          )
        }
      },
    },
  },
})
