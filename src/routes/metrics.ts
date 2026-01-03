/**
 * Metrics endpoint for Prometheus scraping
 * Exposes application metrics in Prometheus format
 */

import { createFileRoute } from '@tanstack/react-router'
import { metrics } from '../lib/monitoring.server'

export const Route = createFileRoute('/metrics')({
    server: {
        handlers: {
            GET: () => {
                try {
                    const prometheusMetrics = metrics.getPrometheusMetrics()

                    return new Response(prometheusMetrics, {
                        status: 200,
                        headers: {
                            'Content-Type': 'text/plain; version=0.0.4',
                        },
                    })
                } catch (error: any) {
                    return new Response(`# Error generating metrics: ${error.message}`, {
                        status: 500,
                        headers: {
                            'Content-Type': 'text/plain',
                        },
                    })
                }
            },
        },
    },
})
