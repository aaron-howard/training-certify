import { createStart } from '@tanstack/react-start'
import { clerkMiddleware } from '@clerk/tanstack-react-start/server'
// ENV is used via process.env in some places, but not explicitly here anymore

export const startInstance = createStart(() => ({
  // @ts-ignore - Middleware type mismatch in current TanStack Start version
  requestMiddleware: [clerkMiddleware()],
}))

export default startInstance
