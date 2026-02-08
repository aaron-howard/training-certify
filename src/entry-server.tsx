import {
  createStartHandler,
  defaultRenderHandler,
} from '@tanstack/react-start/server'
import { initSentry } from './lib/sentry.server'
import { initLogging } from './lib/logging.server'

// Initialize logging first
initLogging()

// Initialize Sentry on server startup
initSentry()

export default createStartHandler(defaultRenderHandler)
