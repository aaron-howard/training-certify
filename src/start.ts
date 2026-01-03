import { createStart } from '@tanstack/react-start'
import { clerkMiddleware } from '@clerk/tanstack-react-start/server'
import { ENV } from './lib/env'

export const startInstance = createStart(() => ({
  // @ts-ignore - Middleware type mismatch between TanStack Start and Clerk
  requestMiddleware: [
    clerkMiddleware({
      publishableKey: ENV.CLERK_PUBLISHABLE_KEY,
      secretKey: ENV.CLERK_SECRET_KEY,
    }),
  ],
}))

export default startInstance
