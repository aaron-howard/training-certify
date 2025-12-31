import { CheckCircle2, Clock, Minus, Shield, TrendingDown, TrendingUp } from 'lucide-react'
import type { ComplianceMetrics } from '@/../product/sections/compliance-and-audit/types'

interface ComplianceMetricsOverviewProps {
  metrics: ComplianceMetrics
  onViewTeamCompliance?: (teamId: string) => void
}

export function ComplianceMetricsOverview({ metrics, onViewTeamCompliance }: ComplianceMetricsOverviewProps) {
  const getTrendIcon = () => {
    if (metrics.trend === 'up') return <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
    if (metrics.trend === 'down') return <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
    return <Minus className="w-5 h-5 text-slate-600 dark:text-slate-400" />
  }

  const getTrendColor = () => {
    if (metrics.trend === 'up') return 'text-emerald-600 dark:text-emerald-400'
    if (metrics.trend === 'down') return 'text-rose-600 dark:text-rose-400'
    return 'text-slate-600 dark:text-slate-400'
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-lg">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
        <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        Compliance Status Overview
      </h2>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Overall Compliance"
          value={`${metrics.overallCompliancePercentage.toFixed(1)}%`}
          icon={<Shield className="w-6 h-6" />}
          trend={getTrendIcon()}
          color="blue"
        />
        <MetricCard
          label="Total Certifications"
          value={metrics.totalCertifications.toString()}
          icon={<CheckCircle2 className="w-6 h-6" />}
          color="emerald"
        />
        <MetricCard
          label="Verified"
          value={`${metrics.verifiedCertifications}/${metrics.totalCertifications}`}
          icon={<CheckCircle2 className="w-6 h-6" />}
          color="emerald"
        />
        <MetricCard
          label="Pending Verification"
          value={metrics.pendingVerifications.toString()}
          icon={<Clock className="w-6 h-6" />}
          color="amber"
        />
      </div>

      {/* Team Compliance Breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Team Compliance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {metrics.complianceByTeam.map(team => (
            <button
              key={team.teamId}
              onClick={() => onViewTeamCompliance?.(team.teamId)}
              className="group bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 rounded-xl p-4 transition-all text-left"
            >
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">{team.teamName}</div>
              <div className={`text-2xl font-bold ${getComplianceColor(team.compliancePercentage)}`}>
                {team.compliancePercentage.toFixed(1)}%
              </div>
              <div className="mt-2 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${getComplianceBarColor(team.compliancePercentage)}`}
                  style={{ width: `${team.compliancePercentage}%` }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string
  icon: React.ReactNode
  trend?: React.ReactNode
  color: 'blue' | 'emerald' | 'amber'
}

function MetricCard({ label, value, icon, trend, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400',
  }

  return (
    <div className={`${colorClasses[color]} border rounded-xl p-5 relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
        <div className="absolute inset-0 bg-current rounded-full transform translate-x-8 -translate-y-8" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          {icon}
          {trend && <div>{trend}</div>}
        </div>
        <div className="text-sm font-medium opacity-80 mb-1">{label}</div>
        <div className="text-3xl font-bold">{value}</div>
      </div>
    </div>
  )
}

function getComplianceColor(percentage: number): string {
  if (percentage >= 90) return 'text-emerald-600 dark:text-emerald-400'
  if (percentage >= 75) return 'text-blue-600 dark:text-blue-400'
  if (percentage >= 60) return 'text-amber-600 dark:text-amber-400'
  return 'text-rose-600 dark:text-rose-400'
}

function getComplianceBarColor(percentage: number): string {
  if (percentage >= 90) return 'bg-emerald-500 dark:bg-emerald-600'
  if (percentage >= 75) return 'bg-blue-500 dark:bg-blue-600'
  if (percentage >= 60) return 'bg-amber-500 dark:bg-amber-600'
  return 'bg-rose-500 dark:bg-rose-600'
}
