import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
} from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import {
  ClerkProvider,
  RedirectToSignIn,
  useAuth,
  useUser,
} from '@clerk/tanstack-react-start'
import { createServerFn } from '@tanstack/react-start'
import { useEffect } from 'react'
import { AppShell } from '../components/shell/AppShell'
import { ENV } from '../lib/env'
import { logger } from '../lib/logging.client-stub'
import { initSentry } from '../lib/sentry.server'
import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

// Server function to sync user - handles CSRF automatically via TanStack Start
const syncUser = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { id: string; name: string; email: string; avatarUrl?: string }) =>
      data,
  )
  .handler(async ({ data }) => {
    const { getVerifiedAuth } = await import('../lib/auth.server')
    const { getDbOrThrow } = await import('../db/db.server')
    const { users } = await import('../db/schema')
    const { eq } = await import('drizzle-orm')
    const { ForbiddenError } = await import('../lib/errors')

    const authenticatedId = await getVerifiedAuth()

    // Security: User can only sync themselves unless they're an admin
    if (authenticatedId !== data.id) {
      const db = await getDbOrThrow()
      const requester = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, authenticatedId))
        .limit(1)

      if (!requester.length || requester[0].role !== 'Admin') {
        throw new ForbiddenError(
          'You can only sync your own user record unless you are an Admin',
        )
      }
    }

    const db = await getDbOrThrow()
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.id, data.id))
      .limit(1)

    if (existing.length > 0) {
      return existing[0]
    }

    const result = await db
      .insert(users)
      .values({
        id: data.id,
        name: data.name,
        email: data.email,
        avatarUrl: data.avatarUrl,
        role: 'User',
      })
      .returning()

    return result[0]
  })

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Training-Certify Platform',
      },
      {
        name: 'description',
        content:
          'Enterprise certification tracking and compliance management platform.',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        href: '/favicon.ico',
      },
    ],
  }),

  shellComponent: RootDocument,
  component: RootComponent,
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold">404 - Page Not Found</h2>
      <p className="text-slate-600 mt-2">
        The section you are looking for does not exist.
      </p>
      <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">
        Go to Dashboard
      </Link>
    </div>
  ),
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-8 text-center bg-red-50 text-red-900 rounded-lg border border-red-200">
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <pre className="mt-4 text-xs overflow-auto text-left p-4 bg-white rounded border">
        {error.message}
      </pre>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Reload Page
      </button>
    </div>
  ),
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const queryClient = router.options.context.queryClient

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ClerkProvider publishableKey={ENV.CLERK_PUBLISHABLE_KEY}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </ClerkProvider>
        <Scripts />
      </body>
    </html>
  )
}

function RootComponent() {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()

  // Initialize Sentry on client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initSentry()
    }
  }, [])

  const router = useRouter()
  const path = router.state.location.pathname

  const isAuthPage = path.startsWith('/sign-in') || path.startsWith('/sign-up')

  useEffect(() => {
    if (isSignedIn && user) {
      // Use server function which handles CSRF automatically via TanStack Start
      syncUser({
        data: {
          id: user.id,
          name:
            `${user.firstName} ${user.lastName}`.trim() ||
            user.username ||
            'User',
          email: user.emailAddresses[0]?.emailAddress || '',
          avatarUrl: user.imageUrl,
        },
      })
        .then((data) => {
          logger.info({ role: data.role }, 'User synced with DB')
        })
        .catch((err) => {
          logger.error(
            { error: err instanceof Error ? err.message : String(err) },
            'Sync failed',
          )
        })
    }
  }, [isSignedIn, user])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    )
  }

  if (!isSignedIn && !isAuthPage) {
    return <RedirectToSignIn />
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
