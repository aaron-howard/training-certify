import {
  createStartHandler,
  defaultRenderHandler,
} from '@tanstack/react-start/server'
import { envReady } from './lib/env'
import { getRouter } from './router'

export default createStartHandler({
  createRouter: getRouter,
  render: async (ctx) => {
    await envReady
    return defaultRenderHandler(ctx)
  },
})
