import {
  createStartHandler,
  defaultRenderHandler,
} from '@tanstack/react-start/server'
import { initSentry } from './lib/sentry.server'

// Initialize Sentry on server startup
initSentry()

export default createStartHandler(defaultRenderHandler)
