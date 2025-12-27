import { createFileRoute, Link } from '@tanstack/react-router'
import { Award, Users, Shield, BookOpen, ChevronRight } from 'lucide-react'
import { useUser } from '@clerk/tanstack-react-start'
import { useQuery } from '@tanstack/react-query'

// Use fetch API instead of server imports
const fetchDashboardStats = async () => {
  const res = await fetch('/api/dashboard')
  if (!res.ok) return { activeCerts: 0, expiringSoon: 0, complianceRate: 0 }
  return res.json()
}

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

function DashboardPage() {
  const { user, isLoaded } = useUser()

  const { data: stats = { activeCerts: 0, expiringSoon: 0, complianceRate: 0 } } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
  })

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          Welcome back, <Link to="/user-profile" className="text-blue-600 dark:text-blue-400 hover:underline">{isLoaded && user ? user.firstName : 'Friend'}</Link>
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
          Everything looks great. You have {stats.expiringSoon} certifications expiring soon and {stats.complianceRate}% team compliance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/certification-management"
          className="group p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-500/50 transition-all"
        >
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/30 rounded-xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
            <Award className="w-8 h-8" />
          </div>
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">My Certifications</h2>
              <p className="text-slate-500 dark:text-slate-400">Track and manage your individual professional credentials.</p>
            </div>
            <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link
          to="/team-management"
          className="group p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-emerald-500/50 transition-all"
        >
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 transition-transform">
            <Users className="w-8 h-8" />
          </div>
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">Team Management</h2>
              <p className="text-slate-500 dark:text-slate-400">Monitor competency and manage certification compliance across teams.</p>
            </div>
            <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-emerald-500 transform group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/compliance-audit" className="bg-slate-50 dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors flex items-center gap-4">
          <Shield className="w-6 h-6 text-slate-400" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">Compliance & Audit</span>
        </Link>
        <Link to="/catalog" className="bg-slate-50 dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors flex items-center gap-4">
          <BookOpen className="w-6 h-6 text-slate-400" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">Cert Catalog</span>
        </Link>
        <Link to="/certification-management" className="bg-slate-50 dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors flex items-center gap-4">
          <Award className="w-6 h-6 text-slate-400" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">Active Certs: {stats.activeCerts}</span>
        </Link>
      </div>
    </div>
  )
}
