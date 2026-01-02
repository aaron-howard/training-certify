import {
  AlertCircle,
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Plus,
  RefreshCw,
  Star,
  Users,
} from 'lucide-react'
import type { CertificationDetailProps } from '@/../product/sections/certification-catalog/types'

export function CertificationDetail({
  certification,
  onBack,
  onAddToProfile,
  onMarkAsGoal,
  onViewHolders,
}: CertificationDetailProps) {
  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      Beginner:
        'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      Intermediate:
        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      Advanced:
        'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      Expert:
        'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    }
    return colors[difficulty as keyof typeof colors] || colors.Intermediate
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      Cloud:
        'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      Security:
        'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      Networking:
        'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      Data: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      'Project Management':
        'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    }
    return colors[category as keyof typeof colors] || colors.Cloud
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900">
      {/* Header with Back Button */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Catalog</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-900 dark:to-blue-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 mb-6 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                {certification.vendorName}
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                {certification.name}
              </h1>
              <div className="flex flex-wrap gap-2 mb-6">
                <span
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg border ${getCategoryColor(certification.category)}`}
                >
                  {certification.category}
                </span>
                <span
                  className={`px-3 py-1.5 text-sm font-semibold rounded-lg border ${getDifficultyColor(certification.difficulty)}`}
                >
                  {certification.difficulty}
                </span>
                <span className="px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Valid for {certification.validityPeriod}
                </span>
              </div>

              {/* Holder Count */}
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Users className="w-5 h-5" />
                <span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {certification.holderCount}
                  </span>{' '}
                  {certification.holderCount === 1
                    ? 'team member holds'
                    : 'team members hold'}{' '}
                  this certification
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 lg:min-w-[200px]">
              <button
                onClick={() => onAddToProfile?.(certification.id)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/30"
              >
                <Plus className="w-5 h-5" />
                Add to Profile
              </button>
              <button
                onClick={() => onMarkAsGoal?.(certification.id)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all"
              >
                <Star className="w-5 h-5" />
                Set as Goal
              </button>
              <button
                onClick={() => onViewHolders?.(certification.id)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-all"
              >
                <Users className="w-5 h-5" />
                View Holders
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Overview
                </h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {certification.description}
              </p>
            </div>

            {/* Intended Audience */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Intended Audience
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {certification.intendedAudience.map((audience, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg"
                  >
                    {audience}
                  </span>
                ))}
              </div>
            </div>

            {/* Prerequisites */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Prerequisites & Requirements
                </h2>
              </div>

              {certification.prerequisites.required.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                    Required
                  </h3>
                  <ul className="space-y-2">
                    {certification.prerequisites.required.map((req, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-600 dark:text-slate-400">
                          {req}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {certification.prerequisites.recommended.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                    Recommended
                  </h3>
                  <ul className="space-y-2">
                    {certification.prerequisites.recommended.map(
                      (rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-600 dark:text-slate-400">
                            {rec}
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Renewal Requirements */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Renewal Requirements
                </h2>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Renewal cycle:{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {certification.renewalRequirements.cycle}
                </span>
              </p>
              <ul className="space-y-2">
                {certification.renewalRequirements.options.map(
                  (option, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600 dark:text-slate-400">
                        {option}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>

          {/* Right Column - Exam Info */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 border border-blue-500 dark:border-blue-600 rounded-2xl p-6 shadow-xl text-white sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Award className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold">Exam Details</h2>
              </div>

              <div className="space-y-4">
                <div className="pb-4 border-b border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-200" />
                    <span className="text-sm font-medium text-blue-200">
                      Format
                    </span>
                  </div>
                  <p className="text-white font-medium">
                    {certification.examInfo.format}
                  </p>
                </div>

                <div className="pb-4 border-b border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-200" />
                    <span className="text-sm font-medium text-blue-200">
                      Duration
                    </span>
                  </div>
                  <p className="text-white font-medium">
                    {certification.examInfo.duration}
                  </p>
                </div>

                <div className="pb-4 border-b border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-200" />
                    <span className="text-sm font-medium text-blue-200">
                      Questions
                    </span>
                  </div>
                  <p className="text-white font-medium">
                    {certification.examInfo.numberOfQuestions}
                  </p>
                </div>

                <div className="pb-4 border-b border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-200" />
                    <span className="text-sm font-medium text-blue-200">
                      Passing Score
                    </span>
                  </div>
                  <p className="text-white font-medium">
                    {certification.examInfo.passingScore}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-blue-200" />
                    <span className="text-sm font-medium text-blue-200">
                      Cost
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {certification.examInfo.cost}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
