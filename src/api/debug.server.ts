import { createServerFn } from '@tanstack/react-start'
import { logger } from '../lib/logging.server'

export const checkRpc = createServerFn({ method: 'GET' }).handler(() => {
  logger.info({}, 'RPC check succeeded')
  return { message: 'RPC is working', timestamp: Date.now() }
})
