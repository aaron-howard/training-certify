import { Eye, Plus, Star, Users } from 'lucide-react'
import type { Certification } from '@/../product/sections/certification-catalog/types'

interface CertificationCardProps {
  certification: Certification
  onViewDetails?: () => void
  onAddToProfile?: () => void
  onMarkAsGoal?: () => void
  onViewHolders?: () => void
}

export function CertificationCard({
  certification,
  onViewDetails,
  onAddToProfile,
  onMarkAsGoal,
  onViewHolders,
}: CertificationCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      Beginner: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
      Intermediate: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      Advanced: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
      Expert: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
    }
    return colors[difficulty as keyof typeof colors] || colors.Intermediate
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      Cloud: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      Security: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      Networking: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      Data: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      'Project Management': 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    }
    return colors[category as keyof typeof colors] || colors.Cloud
  }

  return (
    <div className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300">
      {/* Card Header with Vendor */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              {certification.vendorName}
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-2 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {certification.name}
            </h3>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <span className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${getCategoryColor(certification.category)}`}>
            {certification.category}
          </span>
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${getDifficultyColor(certification.difficulty)}`}>
            {certification.difficulty}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6">
        {/* Description Preview */}
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-4">
          {certification.description}
        </p>

        {/* Meta Information */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Validity Period</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {certification.validityPeriod}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Exam Cost</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {certification.examInfo.cost}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {certification.holderCount}
              </span>{' '}
              {certification.holderCount === 1 ? 'team member holds' : 'team members hold'} this certification
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onViewDetails}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-blue-500/30"
          >
            <Eye className="w-4 h-4" />
            Details
          </button>
          <button
            onClick={onAddToProfile}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={onMarkAsGoal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-all"
          >
            <Star className="w-4 h-4" />
            Set Goal
          </button>
          <button
            onClick={onViewHolders}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-all"
          >
            <Users className="w-4 h-4" />
            Holders
          </button>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500/20 dark:group-hover:border-blue-500/30 rounded-2xl pointer-events-none transition-colors" />
    </div>
  )
}
