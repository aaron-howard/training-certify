import { Award, Shield, TrendingUp, Users } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

const fetchExecutiveStats = async () => {
  const res = await fetch('/api/dashboard?role=Executive')
  if (!res.ok) throw new Error('Failed to fetch executive stats')
  return res.json()
}

export function ExecutiveDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['executiveStats'],
    queryFn: fetchExecutiveStats,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800"
          />
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Global Compliance',
      value: `${stats?.complianceRate || 0}%`,
      icon: Shield,
      color: 'blue',
      description: 'Across all departments',
      href: '/compliance-audit',
    },
    {
      title: 'Total Certifications',
      value: stats?.totalCerts || 0,
      icon: Award,
      color: 'emerald',
      description: 'Active credentials',
      href: '/catalog',
    },
    {
      title: 'Critical Gaps',
      value: stats?.criticalGaps || 0,
      icon: TrendingUp,
      color: 'rose',
      description: 'Teams below target',
      href: '/team-management',
    },
    {
      title: 'Total Workforce',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'amber',
      description: 'Monitored employees',
      href: '/team-management',
    },
  ]

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          Executive Overview
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
          High-level compliance monitoring and workforce competency tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <Link
            key={card.title}
            to={card.href}
            className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-blue-500/30 transition-all group overflow-hidden relative cursor-pointer"
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-${card.color}-50 dark:bg-${card.color}-950/30 text-${card.color}-600 group-hover:scale-110 transition-transform`}
            >
              <card.icon className="w-6 h-6" />
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">
              {card.value}
            </div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-1">
              {card.title}
            </div>
            <div className="text-xs text-slate-500">{card.description}</div>
            <div
              className={`absolute bottom-0 left-0 h-1 bg-${card.color}-600/50 w-0 group-hover:w-full transition-all duration-300`}
            />
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-6">
            Compliance by Vendor
          </h2>
          <div className="space-y-4">
            {stats?.vendorBreakdown?.map((vendor: any) => (
              <div key={vendor.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {vendor.name}
                  </span>
                  <span className="text-slate-500">{vendor.compliance}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${vendor.compliance}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-6">
            Upcoming Expirations
          </h2>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
            <p>
              Total certifications expiring in next 90 days:{' '}
              <span className="font-bold text-rose-600">
                {stats?.expiringSoon || 0}
              </span>
            </p>
            <p>
              Estimated Budget Impact:{' '}
              <span className="font-bold text-slate-900 dark:text-slate-50">
                {stats?.budgetImpact || '$0'}
              </span>
            </p>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link
                to="/compliance-audit"
                className="text-blue-600 font-semibold hover:underline"
              >
                View Detailed Audit Report →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
