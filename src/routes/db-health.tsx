import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/db-health')({
  component: DbHealthPage,
})

function DbHealthPage() {
  const {
    data: health,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dbHealth'],
    queryFn: async () => {
      const { testDbConnection } = await import('../api/db-test.server')
      return testDbConnection()
    },
  })

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Database Health Check</h1>

      {isLoading && (
        <div className="text-slate-500">Connecting to database...</div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-900 rounded-lg border border-red-200">
          <h2 className="font-bold">Query Error</h2>
          <pre className="text-xs mt-2">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      {health && (
        <div
          className={`p-4 rounded-lg border ${health.success ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-red-50 text-red-900 border-red-200'}`}
        >
          <h2 className="font-bold">
            {health.success ? 'Connected Successfully' : 'Connection Failed'}
          </h2>
          {health.success ? (
            <p className="mt-2">Found {health.count} users in the database.</p>
          ) : (
            <p className="mt-2">Error: {health.error}</p>
          )}
        </div>
      )}

      <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h3 className="font-semibold mb-2">Environment Checklist</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
          <li>
            DATABASE_URL:{' '}
            {typeof process !== 'undefined' && process.env.DATABASE_URL
              ? '✅ Set'
              : '❌ Missing'}
          </li>
        </ul>
      </div>
    </div>
  )
}
