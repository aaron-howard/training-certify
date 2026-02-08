import {
  createStartHandler,
  defaultRenderHandler,
} from '@tanstack/react-start/server'
import { initSentry } from './lib/sentry.server'
import { initLogging } from './lib/logging.server'

// #region agent log
console.error(
  '[DEBUG:H2] entry-server.tsx: module loading, about to initLogging()',
)
// #endregion

// Initialize logging first
// #region agent log
try {
  initLogging()
  console.error('[DEBUG:H2] entry-server.tsx: initLogging() succeeded')
} catch (e) {
  console.error(
    '[DEBUG:H2] entry-server.tsx: initLogging() FAILED',
    e instanceof Error ? e.message : e,
  )
}
// #endregion

// Initialize Sentry on server startup
// #region agent log
try {
  initSentry()
  console.error('[DEBUG:H2] entry-server.tsx: initSentry() succeeded')
} catch (e) {
  console.error(
    '[DEBUG:H2] entry-server.tsx: initSentry() FAILED',
    e instanceof Error ? e.message : e,
  )
}
// #endregion

// #region agent log
console.error('[DEBUG:H2] entry-server.tsx: creating start handler')
// #endregion

export default createStartHandler(defaultRenderHandler)
