import {
  createStartHandler,
  defaultRenderHandler,
} from '@tanstack/react-start/server'
import { createClerkHandler } from '@clerk/tanstack-react-start/server'
import { envReady } from './lib/env'
import { getRouter } from './router'
import { startInstance } from './start'

export default createClerkHandler(
  createStartHandler({
    createRouter: getRouter,
    render: (ctx) => defaultRenderHandler(ctx),
  })(startInstance)
)
