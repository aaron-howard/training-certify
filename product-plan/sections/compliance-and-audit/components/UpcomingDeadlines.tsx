import { AlertTriangle, Clock } from 'lucide-react'

interface UpcomingDeadlinesProps {
  expiringSoon: {
    next30Days: number
    next60Days: number
    next90Days: number
  }
}

export function UpcomingDeadlines({ expiringSoon }: UpcomingDeadlinesProps) {
  const total =
    expiringSoon.next30Days + expiringSoon.next60Days + expiringSoon.next90Days

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Upcoming Deadlines
        </h3>
      </div>

      {total === 0 ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4">
            <Clock className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-emerald-700 dark:text-emerald-300 font-medium">
            All certifications current
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            No upcoming expirations
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <DeadlineCard
            label="Next 30 Days"
            count={expiringSoon.next30Days}
            severity="high"
          />
          <DeadlineCard
            label="31-60 Days"
            count={expiringSoon.next60Days}
            severity="medium"
          />
          <DeadlineCard
            label="61-90 Days"
            count={expiringSoon.next90Days}
            severity="low"
          />

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                {total}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Total certifications expiring within 90 days
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface DeadlineCardProps {
  label: string
  count: number
  severity: 'high' | 'medium' | 'low'
}

function DeadlineCard({ label, count, severity }: DeadlineCardProps) {
  const severityConfig = {
    high: {
      bg: 'bg-rose-50 dark:bg-rose-950/20',
      border: 'border-rose-200 dark:border-rose-800',
      text: 'text-rose-700 dark:text-rose-300',
      icon: 'text-rose-600 dark:text-rose-400',
    },
    medium: {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-300',
      icon: 'text-amber-600 dark:text-amber-400',
    },
    low: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-300',
      icon: 'text-blue-600 dark:text-blue-400',
    },
  }

  const config = severityConfig[severity]

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-4 h-4 ${config.icon}`} />
          <span className={`text-sm font-medium ${config.text}`}>{label}</span>
        </div>
        <div className={`text-2xl font-bold ${config.text}`}>{count}</div>
      </div>
    </div>
  )
}
