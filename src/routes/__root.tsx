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
import { useEffect } from 'react'
import { AppShell } from '../components/shell/AppShell'
import { ENV } from '../lib/env'
import { initSentry } from '../lib/sentry.server'
import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

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
      // Use fetch API instead of broken createServerFn
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          name:
            `${user.firstName} ${user.lastName}`.trim() ||
            user.username ||
            'User',
          email: user.emailAddresses[0]?.emailAddress || '',
          avatarUrl: user.imageUrl,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log('👤 [Client] User synced with DB:', data.role)
        })
        .catch((err) => {
          console.error('❌ [Client] Sync failed:', err)
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
