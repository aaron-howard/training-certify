import {
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
} from 'lucide-react'
import type {
  Team,
  TeamMetrics,
} from '@/../product/sections/team-and-workforce-management/types'

interface TeamMetricsCardProps {
  team: Team
  metrics?: TeamMetrics
  onViewDetails?: () => void
  onViewPlanning?: () => void
}

export function TeamMetricsCard({
  team,
  metrics,
  onViewDetails,
  onViewPlanning,
}: TeamMetricsCardProps) {
  if (!metrics) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {team.name}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          No metrics available
        </p>
      </div>
    )
  }

  const getCoverageColor = (percentage: number) => {
    if (percentage >= 80) return 'emerald'
    if (percentage >= 60) return 'amber'
    return 'rose'
  }

  const coverageColor = getCoverageColor(metrics.coveragePercentage)

  const coverageColorClasses = {
    emerald:
      'from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-500',
    amber: 'from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-500',
    rose: 'from-rose-500 to-rose-600 dark:from-rose-400 dark:to-rose-500',
  }

  const coverageBgClasses = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30',
    amber: 'bg-amber-50 dark:bg-amber-950/30',
    rose: 'bg-rose-50 dark:bg-rose-950/30',
  }

  const totalExpiring =
    metrics.expiringIn30Days +
    metrics.expiringIn60Days +
    metrics.expiringIn90Days

  return (
    <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {team.name}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {team.description}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600 dark:text-slate-300">
              {team.memberCount} members
            </span>
          </div>
        </div>

        {/* Coverage badge */}
        <div
          className={`${coverageBgClasses[coverageColor]} px-4 py-2 rounded-lg`}
        >
          <div className="text-center">
            <div
              className={`text-2xl font-bold bg-gradient-to-r ${coverageColorClasses[coverageColor]} bg-clip-text text-transparent`}
            >
              {metrics.coveragePercentage.toFixed(0)}%
            </div>
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Coverage
            </div>
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <MetricItem
          icon={<CheckCircle2 className="w-4 h-4" />}
          label="Acquired"
          value={`${metrics.totalAcquired}/${metrics.totalRequired}`}
          color="emerald"
        />
        <MetricItem
          icon={<TrendingUp className="w-4 h-4" />}
          label="Gaps"
          value={metrics.gapCount.toString()}
          color="rose"
        />
        <MetricItem
          icon={<Clock className="w-4 h-4" />}
          label="Expiring"
          value={totalExpiring.toString()}
          color="amber"
        />
        <MetricItem
          icon={<AlertCircle className="w-4 h-4" />}
          label="Expired"
          value={metrics.expired.toString()}
          color="rose"
        />
      </div>

      {/* Top gaps */}
      {metrics.topGaps.length > 0 && (
        <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-lg">
          <div className="text-xs font-semibold text-rose-700 dark:text-rose-300 mb-2">
            Top Gaps:
          </div>
          <ul className="space-y-1">
            {metrics.topGaps.slice(0, 2).map((gap, idx) => (
              <li
                key={idx}
                className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1"
              >
                <span className="w-1 h-1 bg-rose-500 rounded-full" />
                {gap}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onViewDetails}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          View Details
        </button>
        <button
          onClick={onViewPlanning}
          className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors"
        >
          Workforce Plan
        </button>
      </div>
    </div>
  )
}

interface MetricItemProps {
  icon: React.ReactNode
  label: string
  value: string
  color: 'emerald' | 'amber' | 'rose'
}

function MetricItem({ icon, label, value, color }: MetricItemProps) {
  const colorClasses = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400',
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
      <div className={colorClasses[color]}>{icon}</div>
      <div className="flex-1">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {label}
        </div>
        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {value}
        </div>
      </div>
    </div>
  )
}
