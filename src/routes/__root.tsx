import { HeadContent, Scripts, createRootRouteWithContext, Outlet, useRouter, Link } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ClerkProvider } from '@clerk/tanstack-react-start'
import { QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from '../components/shell/AppShell'

import appCss from '../styles.css?url'

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
        content: 'Enterprise certification tracking and compliance management platform.',
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
      <p className="text-slate-600 mt-2">The section you are looking for does not exist.</p>
      <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">Go to Dashboard</Link>
    </div>
  ),
  errorComponent: ({ error }: { error: Error }) => (
    <div className="p-8 text-center bg-red-50 text-red-900 rounded-lg border border-red-200">
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <pre className="mt-4 text-xs overflow-auto text-left p-4 bg-white rounded border">{error.message}</pre>
      <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
        Reload Page
      </button>
    </div>
  ),
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const queryClient = router.options.context?.queryClient ?? new QueryClient()

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
          <QueryClientProvider client={queryClient}>
            {children}
            <TanStackDevtools
              config={{
                position: 'bottom-right',
              }}
              plugins={[
                {
                  name: 'Tanstack Router',
                  render: <TanStackRouterDevtoolsPanel />,
                },
              ]}
            />
          </QueryClientProvider>
        </ClerkProvider>
        <Scripts />
      </body>
    </html>
  )
}

function RootComponent() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
