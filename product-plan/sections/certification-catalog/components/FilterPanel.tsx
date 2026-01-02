interface FilterPanelProps {
  vendors: Array<{ id: string; name: string }>
  categories: Array<string>
  difficulties: Array<string>
  selectedVendor: string
  selectedCategory: string
  selectedDifficulty: string
  onFilterChange: (vendor: string, category: string, difficulty: string) => void
}

export function FilterPanel({
  vendors,
  categories,
  difficulties,
  selectedVendor,
  selectedCategory,
  selectedDifficulty,
  onFilterChange,
}: FilterPanelProps) {
  return (
    <div className="mt-4 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Vendor Filter */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Vendor
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="vendor"
                value="all"
                checked={selectedVendor === 'all'}
                onChange={(e) =>
                  onFilterChange(
                    e.target.value,
                    selectedCategory,
                    selectedDifficulty,
                  )
                }
                className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                All Vendors
              </span>
            </label>
            {vendors.map((vendor) => (
              <label
                key={vendor.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="vendor"
                  value={vendor.id}
                  checked={selectedVendor === vendor.id}
                  onChange={(e) =>
                    onFilterChange(
                      e.target.value,
                      selectedCategory,
                      selectedDifficulty,
                    )
                  }
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {vendor.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Category
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                value="all"
                checked={selectedCategory === 'all'}
                onChange={(e) =>
                  onFilterChange(
                    selectedVendor,
                    e.target.value,
                    selectedDifficulty,
                  )
                }
                className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                All Categories
              </span>
            </label>
            {categories.map((category) => (
              <label
                key={category}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="category"
                  value={category}
                  checked={selectedCategory === category}
                  onChange={(e) =>
                    onFilterChange(
                      selectedVendor,
                      e.target.value,
                      selectedDifficulty,
                    )
                  }
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {category}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Difficulty Filter */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Difficulty
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="difficulty"
                value="all"
                checked={selectedDifficulty === 'all'}
                onChange={(e) =>
                  onFilterChange(
                    selectedVendor,
                    selectedCategory,
                    e.target.value,
                  )
                }
                className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                All Levels
              </span>
            </label>
            {difficulties.map((difficulty) => (
              <label
                key={difficulty}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="difficulty"
                  value={difficulty}
                  checked={selectedDifficulty === difficulty}
                  onChange={(e) =>
                    onFilterChange(
                      selectedVendor,
                      selectedCategory,
                      e.target.value,
                    )
                  }
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {difficulty}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Clear Filters */}
      {(selectedVendor !== 'all' ||
        selectedCategory !== 'all' ||
        selectedDifficulty !== 'all') && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => onFilterChange('all', 'all', 'all')}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}
