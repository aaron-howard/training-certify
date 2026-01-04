import {
  createStartHandler,
  defaultRenderHandler,
} from '@tanstack/react-start/server'
import { createClerkHandler } from '@clerk/tanstack-react-start/server'
import { envReady } from './lib/env'
import { getRouter } from './router'
import { startInstance } from './start'
import { initSentry } from './lib/sentry.server'

// Initialize Sentry on server startup
initSentry()

export default createClerkHandler(
  createStartHandler({
    createRouter: getRouter,
    render: (ctx) => defaultRenderHandler(ctx),
  })(startInstance)
)
