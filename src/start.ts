import { createStart } from '@tanstack/react-start'
import { clerkMiddleware } from '@clerk/tanstack-react-start/server'
import { ENV } from './lib/env'

export const startInstance = createStart(() => ({
  // @ts-ignore - Middleware type mismatch in current TanStack Start version
  requestMiddleware: [clerkMiddleware()],
}))

export default startInstance
