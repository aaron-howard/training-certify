import type {
  Team,
  Certification,
  UserCertification,
  User,
  CertificationRequirement,
} from '@/../product/sections/team-and-workforce-management/types'

interface CoverageHeatmapProps {
  teams: Team[]
  certifications: Certification[]
  userCertifications: UserCertification[]
  users: User[]
  certificationRequirements: CertificationRequirement[]
}

export function CoverageHeatmap({
  teams,
  certifications,
  userCertifications,
  users,
  certificationRequirements,
}: CoverageHeatmapProps) {
  // Get the top 8 most relevant certifications (those with requirements)
  const requiredCertIds = new Set(certificationRequirements.map(r => r.certificationId))
  const topCerts = certifications.filter(c => requiredCertIds.has(c.id)).slice(0, 8)

  // Calculate coverage for each team-certification combination
  const getCoverage = (teamId: string, certId: string): number => {
    const teamUsers = users.filter(u => u.teamIds.includes(teamId))
    if (teamUsers.length === 0) return 0

    const certifiedUsers = teamUsers.filter(u => {
      const hasCert = userCertifications.some(
        uc => uc.userId === u.id && uc.certificationId === certId && uc.status === 'active'
      )
      return hasCert
    })

    return (certifiedUsers.length / teamUsers.length) * 100
  }

  const getCoverageColor = (percentage: number): string => {
    if (percentage === 0) return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
    if (percentage < 25) return 'bg-rose-100 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800'
    if (percentage < 50) return 'bg-amber-100 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800'
    if (percentage < 75) return 'bg-emerald-100 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800'
    return 'bg-emerald-200 dark:bg-emerald-900 border-emerald-400 dark:border-emerald-700'
  }

  const getCoverageLabel = (percentage: number): string => {
    if (percentage === 0) return 'None'
    if (percentage < 25) return 'Low'
    if (percentage < 50) return 'Partial'
    if (percentage < 75) return 'Good'
    return 'Excellent'
  }

  if (topCerts.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Certification Coverage Matrix
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          No certification requirements defined yet. Set requirements to see coverage analysis.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 overflow-hidden">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Certification Coverage Matrix
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Team coverage across key certifications. Darker colors indicate higher coverage.
        </p>
      </div>

      {/* Heatmap - scrollable on mobile */}
      <div className="overflow-x-auto -mx-6 px-6">
        <div className="inline-block min-w-full">
          <div className="grid gap-2" style={{ gridTemplateColumns: `200px repeat(${topCerts.length}, minmax(100px, 1fr))` }}>
            {/* Header row */}
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm py-3" />
            {topCerts.map(cert => (
              <div
                key={cert.id}
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 py-3 px-2 text-center"
              >
                <div className="transform -rotate-45 origin-center whitespace-nowrap">
                  {cert.name.split(' ').slice(0, 3).join(' ')}
                </div>
              </div>
            ))}

            {/* Team rows */}
            {teams.map(team => (
              <>
                <div
                  key={`${team.id}-label`}
                  className="font-semibold text-slate-900 dark:text-slate-100 text-sm py-3 flex items-center"
                >
                  {team.name}
                </div>
                {topCerts.map(cert => {
                  const coverage = getCoverage(team.id, cert.id)
                  return (
                    <div
                      key={`${team.id}-${cert.id}`}
                      className={`${getCoverageColor(coverage)} border rounded-lg p-3 text-center transition-all hover:scale-105 hover:shadow-md cursor-default group relative`}
                    >
                      <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {coverage.toFixed(0)}%
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {getCoverageLabel(coverage)}
                      </div>

                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                        <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-xl">
                          <div className="font-semibold">{team.name}</div>
                          <div className="opacity-80">{cert.name}</div>
                          <div className="mt-1 font-bold">{coverage.toFixed(0)}% certified</div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900 dark:border-t-slate-100" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded" />
            <span className="text-slate-600 dark:text-slate-400">None (0%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-rose-100 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 rounded" />
            <span className="text-slate-600 dark:text-slate-400">Low (1-24%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded" />
            <span className="text-slate-600 dark:text-slate-400">Partial (25-49%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded" />
            <span className="text-slate-600 dark:text-slate-400">Good (50-74%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-200 dark:bg-emerald-900 border border-emerald-400 dark:border-emerald-700 rounded" />
            <span className="text-slate-600 dark:text-slate-400">Excellent (75-100%)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
