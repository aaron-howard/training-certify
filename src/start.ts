import { createStart } from '@tanstack/react-start'
import { clerkMiddleware } from '@clerk/tanstack-react-start/server'

export default createStart({
    requestMiddleware: [clerkMiddleware()],
})
