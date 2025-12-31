import { AlertTriangle, Target, TrendingUp, Users } from 'lucide-react'
import { TeamMetricsCard } from './TeamMetricsCard'
import { CoverageHeatmap } from './CoverageHeatmap'
import { GapAlerts } from './GapAlerts'
import type { TeamWorkforceManagementProps } from '@/../product/sections/team-and-workforce-management/types'

/**
 * Competency Dashboard - Primary landing view for Team & Workforce Management
 *
 * Shows team-level metrics, certification coverage, gaps, and comparisons.
 * Designed for managers and executives to get strategic visibility into workforce competencies.
 *
 * Design tokens: blue (primary), emerald (secondary), slate (neutral)
 * Typography: Inter (heading & body), JetBrains Mono (mono)
 */
export function CompetencyDashboard({
  teams,
  teamMetrics,
  certifications,
  userCertifications,
  certificationRequirements,
  users,
  onViewTeamDetails,
  onCompareTeams,
  onViewWorkforcePlanning,
}: TeamWorkforceManagementProps) {
  // Calculate organization-wide metrics
  const totalCoverage = teamMetrics.length > 0
    ? teamMetrics.reduce((sum, tm) => sum + tm.coveragePercentage, 0) / teamMetrics.length
    : 0

  const totalExpiringSoon = teamMetrics.reduce(
    (sum, tm) => sum + tm.expiringIn30Days + tm.expiringIn60Days + tm.expiringIn90Days,
    0
  )

  const totalGaps = teamMetrics.reduce((sum, tm) => sum + tm.gapCount, 0)

  const totalCertifications = userCertifications.filter(uc => uc.status === 'active').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 dark:from-slate-950 dark:via-blue-950/30 dark:to-emerald-950/20 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
            Workforce Competency Overview
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Strategic visibility into team certifications, coverage, and capability gaps
          </p>
        </div>

        {/* Organization-wide metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={<Target className="w-6 h-6" />}
            label="Avg Coverage"
            value={`${totalCoverage.toFixed(1)}%`}
            trend={totalCoverage >= 75 ? 'positive' : totalCoverage >= 60 ? 'neutral' : 'negative'}
            color="blue"
          />
          <MetricCard
            icon={<Users className="w-6 h-6" />}
            label="Active Certifications"
            value={totalCertifications.toString()}
            trend="neutral"
            color="emerald"
          />
          <MetricCard
            icon={<AlertTriangle className="w-6 h-6" />}
            label="Expiring Soon"
            value={totalExpiringSoon.toString()}
            trend={totalExpiringSoon > 5 ? 'negative' : 'positive'}
            color="amber"
          />
          <MetricCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Competency Gaps"
            value={totalGaps.toString()}
            trend={totalGaps > 10 ? 'negative' : 'positive'}
            color="rose"
          />
        </div>

        {/* Team metrics cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Team Performance
            </h2>
            <button
              onClick={() => {
                const teamIds = teams.map(t => t.id)
                onCompareTeams?.(teamIds)
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Compare All Teams
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {teams.map((team) => {
              const metrics = teamMetrics.find(tm => tm.teamId === team.id)
              return (
                <TeamMetricsCard
                  key={team.id}
                  team={team}
                  metrics={metrics}
                  onViewDetails={() => onViewTeamDetails?.(team.id)}
                  onViewPlanning={() => onViewWorkforcePlanning?.(team.id)}
                />
              )
            })}
          </div>
        </div>

        {/* Coverage heatmap */}
        <CoverageHeatmap
          teams={teams}
          certifications={certifications}
          userCertifications={userCertifications}
          users={users}
          certificationRequirements={certificationRequirements}
        />

        {/* Gap alerts */}
        <GapAlerts
          teams={teams}
          teamMetrics={teamMetrics}
          certifications={certifications}
        />
      </div>
    </div>
  )
}

// Organization-wide metric card
interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string
  trend: 'positive' | 'neutral' | 'negative'
  color: 'blue' | 'emerald' | 'amber' | 'rose'
}

function MetricCard({ icon, label, value, trend, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400',
  }

  const trendIndicators = {
    positive: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
    neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    negative: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300',
  }

  return (
    <div className={`${colorClasses[color]} border rounded-xl p-6 relative overflow-hidden transition-all hover:shadow-lg`}>
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-current to-transparent rounded-full transform translate-x-12 -translate-y-12" />
      </div>
      <div className="relative z-10 space-y-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium opacity-80">{label}</span>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-3xl font-bold">{value}</span>
          <div className={`${trendIndicators[trend]} w-2 h-2 rounded-full`} />
        </div>
      </div>
    </div>
  )
}
