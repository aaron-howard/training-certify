import {
  captureError as sentryCaptureError,
  captureMessage as sentryCaptureMessage,
} from './sentry.server'

/**
 * Initialize monitoring services
 * Call this at application startup
 */
export function initMonitoring() {
  console.log('🔧 Initializing monitoring services...')

  // Check for Sentry DSN
  if (process.env.SENTRY_DSN) {
    console.log('✅ Sentry error tracking enabled')
    // Sentry initialization would go here
    // import * as Sentry from '@sentry/node'
    // Sentry.init({ dsn: process.env.SENTRY_DSN, ... })
  } else {
    console.log('⚠️  Sentry DSN not configured - error tracking disabled')
  }

  // Initialize metrics collection
  initMetrics()

  console.log('✅ Monitoring initialized')
}

/**
 * Capture an error with context
 */
export function captureError(error: Error, context?: Record<string, any>) {
  // Log to console
  console.error('❌ Error captured:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  })

  // Send to Sentry
  sentryCaptureError(error, context)
}

/**
 * Capture a message
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>,
) {
  const emoji = level === 'error' ? '❌' : level === 'warning' ? '⚠️' : 'ℹ️'
  console.log(`${emoji} ${message}`, context || '')

  // Send to Sentry
  sentryCaptureMessage(message, level)
}

/**
 * Simple metrics collector
 */
class MetricsCollector {
  private metrics = new Map<string, number>()
  private counters = new Map<string, number>()
  private histograms = new Map<string, Array<number>>()

  /**
   * Increment a counter metric
   */
  increment(metric: string, value = 1) {
    const current = this.counters.get(metric) || 0
    this.counters.set(metric, current + value)
  }

  /**
   * Set a gauge metric
   */
  gauge(metric: string, value: number) {
    this.metrics.set(metric, value)
  }

  /**
   * Record a histogram value
   */
  histogram(metric: string, value: number) {
    const values = this.histograms.get(metric) || []
    values.push(value)
    // Keep only last 1000 values
    if (values.length > 1000) {
      values.shift()
    }
    this.histograms.set(metric, values)
  }

  /**
   * Get all metrics in Prometheus format
   */
  getPrometheusMetrics(): string {
    const lines: Array<string> = []

    // Counters
    for (const [name, value] of this.counters.entries()) {
      lines.push(`# TYPE ${name} counter`)
      lines.push(`${name} ${value}`)
    }

    // Gauges
    for (const [name, value] of this.metrics.entries()) {
      lines.push(`# TYPE ${name} gauge`)
      lines.push(`${name} ${value}`)
    }

    // Histograms (simplified - just avg, min, max)
    for (const [name, values] of this.histograms.entries()) {
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0)
        const avg = sum / values.length
        const min = Math.min(...values)
        const max = Math.max(...values)

        lines.push(`# TYPE ${name} histogram`)
        lines.push(`${name}_sum ${sum}`)
        lines.push(`${name}_count ${values.length}`)
        lines.push(`${name}_avg ${avg}`)
        lines.push(`${name}_min ${min}`)
        lines.push(`${name}_max ${max}`)
      }
    }

    return lines.join('\n')
  }

  /**
   * Get metrics as JSON
   */
  getMetrics() {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.metrics),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([name, values]) => [
          name,
          {
            count: values.length,
            sum: values.reduce((a, b) => a + b, 0),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
          },
        ]),
      ),
    }
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear()
    this.counters.clear()
    this.histograms.clear()
  }
}

// Singleton metrics instance
export const metrics = new MetricsCollector()

/**
 * Initialize metrics collection
 */
function initMetrics() {
  // Record system metrics periodically
  setInterval(() => {
    const memUsage = process.memoryUsage()
    metrics.gauge('process_memory_heap_used_bytes', memUsage.heapUsed)
    metrics.gauge('process_memory_heap_total_bytes', memUsage.heapTotal)
    metrics.gauge('process_memory_rss_bytes', memUsage.rss)
    metrics.gauge('process_uptime_seconds', process.uptime())
  }, 10000) // Every 10 seconds
}

/**
 * Middleware to track request metrics
 */
export function trackRequestMetrics(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
) {
  metrics.increment(
    `http_requests_total{method="${method}",path="${path}",status="${statusCode}"}`,
  )
  metrics.histogram(
    `http_request_duration_ms{method="${method}",path="${path}"}`,
    duration,
  )
}
