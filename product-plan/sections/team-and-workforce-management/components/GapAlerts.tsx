import { AlertTriangle, TrendingDown } from 'lucide-react'
import type {
  Certification,
  Team,
  TeamMetrics,
} from '@/../product/sections/team-and-workforce-management/types'

interface GapAlertsProps {
  teams: Array<Team>
  teamMetrics: Array<TeamMetrics>
  certifications: Array<Certification>
}

export function GapAlerts({
  teams,
  teamMetrics,
  certifications,
}: GapAlertsProps) {
  // Build alerts from team metrics
  interface Alert {
    teamId: string
    teamName: string
    type: 'gap' | 'expired' | 'expiring'
    severity: 'high' | 'medium' | 'low'
    message: string
    certificationNames: Array<string>
  }

  const alerts: Array<Alert> = []

  teamMetrics.forEach((metrics) => {
    const team = teams.find((t) => t.id === metrics.teamId)
    if (!team) return

    // High gap count
    if (metrics.gapCount > 5) {
      alerts.push({
        teamId: team.id,
        teamName: team.name,
        type: 'gap',
        severity: 'high',
        message: `${metrics.gapCount} competency gaps identified`,
        certificationNames: metrics.topGaps,
      })
    } else if (metrics.gapCount > 0) {
      alerts.push({
        teamId: team.id,
        teamName: team.name,
        type: 'gap',
        severity: 'medium',
        message: `${metrics.gapCount} competency gap${metrics.gapCount > 1 ? 's' : ''}`,
        certificationNames: metrics.topGaps,
      })
    }

    // Expired certifications
    if (metrics.expired > 0) {
      alerts.push({
        teamId: team.id,
        teamName: team.name,
        type: 'expired',
        severity: 'high',
        message: `${metrics.expired} expired certification${metrics.expired > 1 ? 's' : ''}`,
        certificationNames: [],
      })
    }

    // Expiring soon
    const expiringSoon = metrics.expiringIn30Days + metrics.expiringIn60Days
    if (expiringSoon > 3) {
      alerts.push({
        teamId: team.id,
        teamName: team.name,
        type: 'expiring',
        severity: 'medium',
        message: `${expiringSoon} certifications expiring within 60 days`,
        certificationNames: [],
      })
    } else if (expiringSoon > 0) {
      alerts.push({
        teamId: team.id,
        teamName: team.name,
        type: 'expiring',
        severity: 'low',
        message: `${expiringSoon} certification${expiringSoon > 1 ? 's' : ''} expiring soon`,
        certificationNames: [],
      })
    }
  })

  // Sort by severity
  const severityOrder = { high: 0, medium: 1, low: 2 }
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  if (alerts.length === 0) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full mb-4">
          <TrendingDown className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100 mb-2">
          All Clear!
        </h3>
        <p className="text-emerald-700 dark:text-emerald-300">
          No critical gaps or expiring certifications at this time.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Competency Gaps & Alerts
        </h2>
        <span className="ml-auto px-3 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-sm font-semibold rounded-full">
          {alerts.length} alert{alerts.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, idx) => (
          <AlertCard key={idx} alert={alert} />
        ))}
      </div>
    </div>
  )
}

interface AlertCardProps {
  alert: {
    teamId: string
    teamName: string
    type: 'gap' | 'expired' | 'expiring'
    severity: 'high' | 'medium' | 'low'
    message: string
    certificationNames: Array<string>
  }
}

function AlertCard({ alert }: AlertCardProps) {
  const severityConfig = {
    high: {
      bg: 'bg-rose-50 dark:bg-rose-950/20',
      border: 'border-rose-200 dark:border-rose-800',
      badge: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300',
      icon: 'text-rose-600 dark:text-rose-400',
    },
    medium: {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      border: 'border-amber-200 dark:border-amber-800',
      badge:
        'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
      icon: 'text-amber-600 dark:text-amber-400',
    },
    low: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      border: 'border-blue-200 dark:border-blue-800',
      badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
      icon: 'text-blue-600 dark:text-blue-400',
    },
  }

  const config = severityConfig[alert.severity]

  const typeLabels = {
    gap: 'Competency Gap',
    expired: 'Expired',
    expiring: 'Expiring Soon',
  }

  return (
    <div
      className={`${config.bg} ${config.border} border rounded-lg p-4 transition-all hover:shadow-md`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-5 h-5 mt-0.5 ${config.icon}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {alert.teamName}
            </span>
            <span
              className={`${config.badge} px-2 py-0.5 text-xs font-semibold rounded`}
            >
              {typeLabels[alert.type]}
            </span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {alert.message}
          </p>
          {alert.certificationNames.length > 0 && (
            <div className="mt-2 space-y-1">
              {alert.certificationNames.map((name, idx) => (
                <div
                  key={idx}
                  className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5"
                >
                  <span className="w-1 h-1 bg-current rounded-full opacity-50" />
                  {name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
