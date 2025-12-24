import type { CertificationCatalogProps } from '@/../product/sections/certification-catalog/types'
import { useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { CertificationCard } from './CertificationCard'
import { FilterPanel } from './FilterPanel'

export function CertificationBrowse({
  certifications,
  vendors,
  onViewDetails,
  onAddToProfile,
  onMarkAsGoal,
  onViewHolders,
  onSearch,
  onFilter,
}: CertificationCatalogProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    onSearch?.(value)
  }

  const handleFilterChange = (
    vendor: string,
    category: string,
    difficulty: string
  ) => {
    setSelectedVendor(vendor)
    setSelectedCategory(category)
    setSelectedDifficulty(difficulty)

    onFilter?.({
      vendor: vendor === 'all' ? undefined : vendor,
      category: category === 'all' ? undefined : (category as any),
      difficulty: difficulty === 'all' ? undefined : (difficulty as any),
    })
  }

  // Filter certifications based on search and filters
  const filteredCertifications = certifications.filter((cert) => {
    const matchesSearch =
      !searchTerm ||
      cert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesVendor =
      selectedVendor === 'all' || cert.vendorId === selectedVendor
    const matchesCategory =
      selectedCategory === 'all' || cert.category === selectedCategory
    const matchesDifficulty =
      selectedDifficulty === 'all' || cert.difficulty === selectedDifficulty

    return matchesSearch && matchesVendor && matchesCategory && matchesDifficulty
  })

  // Get unique values for filters
  const uniqueVendors = Array.from(
    new Set(certifications.map((c) => c.vendorId))
  ).map((id) => {
    const cert = certifications.find((c) => c.vendorId === id)
    return { id, name: cert?.vendorName || '' }
  })

  const uniqueCategories = Array.from(
    new Set(certifications.map((c) => c.category))
  )
  const uniqueDifficulties = Array.from(
    new Set(certifications.map((c) => c.difficulty))
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Certification Catalog
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Discover and track professional certifications from leading vendors
              </p>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {filteredCertifications.length} of {certifications.length} certifications
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search certifications by name, vendor, or category..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-shadow"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                showFilters
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <FilterPanel
              vendors={uniqueVendors}
              categories={uniqueCategories}
              difficulties={uniqueDifficulties}
              selectedVendor={selectedVendor}
              selectedCategory={selectedCategory}
              selectedDifficulty={selectedDifficulty}
              onFilterChange={handleFilterChange}
            />
          )}
        </div>
      </div>

      {/* Certifications Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredCertifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              No certifications found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertifications.map((certification) => (
              <CertificationCard
                key={certification.id}
                certification={certification}
                onViewDetails={() => onViewDetails?.(certification.id)}
                onAddToProfile={() => onAddToProfile?.(certification.id)}
                onMarkAsGoal={() => onMarkAsGoal?.(certification.id)}
                onViewHolders={() => onViewHolders?.(certification.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
