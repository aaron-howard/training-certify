/**
 * Graceful Shutdown Handler
 * Ensures clean shutdown of database connections and other resources
 */

import { closeDb } from '../db/db.server'
import { cache } from './cache.server'

let isShuttingDown = false

/**
 * Perform graceful shutdown
 */
async function gracefulShutdown(signal: string) {
    if (isShuttingDown) {
        console.log('⚠️  Shutdown already in progress...')
        return
    }

    isShuttingDown = true
    console.log(`\n🛑 ${signal} received, starting graceful shutdown...`)

    try {
        // 1. Stop accepting new requests (handled by server)
        console.log('📛 Stopping new request acceptance...')

        // 2. Clear cache
        console.log('🗑️  Clearing cache...')
        cache.clear()

        // 3. Close database connections
        console.log('💾 Closing database connections...')
        await closeDb()

        // 4. Log completion
        console.log('✅ Graceful shutdown complete')

        // Exit successfully
        process.exit(0)
    } catch (error) {
        console.error('❌ Error during shutdown:', error)
        process.exit(1)
    }
}

/**
 * Initialize graceful shutdown handlers
 * Call this at application startup
 */
export function initGracefulShutdown() {
    // Handle SIGTERM (Docker, Kubernetes)
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        console.error('❌ Uncaught Exception:', error)
        gracefulShutdown('UNCAUGHT_EXCEPTION')
    })

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
        gracefulShutdown('UNHANDLED_REJECTION')
    })

    console.log('✅ Graceful shutdown handlers initialized')
}
