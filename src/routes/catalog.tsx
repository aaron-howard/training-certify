import { createFileRoute } from '@tanstack/react-router'
import {
  Download,
  Edit,
  ExternalLink,
  Plus,
  Search,
  Trash2,
  Upload,
  UserPlus,
  X,
} from 'lucide-react'
import { useUser } from '@clerk/tanstack-react-start'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { CertificationAssignmentModal } from '../components/catalog/CertificationAssignmentModal'
import { ensureUser } from '../api/users.server'
import { fetchWithCsrf } from '../lib/csrf.client'

interface CatalogCertification {
  id: string
  name: string
  vendor?: string
  vendorName?: string
  level?: string
  category?: string
  price?: string | number
  description?: string
  officialSiteUrl?: string
}

interface CatalogResponse {
  certifications: Array<CatalogCertification>
}

// API fetch functions (using traditional fetch instead of broken createServerFn)
const fetchCatalog = async (): Promise<CatalogResponse> => {
  const res = await fetch('/api/catalog?limit=200')
  if (!res.ok) {
    let message = 'Catalog is temporarily unavailable.'
    let requestId: string | undefined
    try {
      const body = await res.json()
      if (body?.error && typeof body.error === 'string') message = body.error
      if (body?.requestId) requestId = body.requestId
    } catch {
      // ignore
    }
    const err = new Error(message) as Error & { requestId?: string }
    if (requestId) err.requestId = requestId
    throw err
  }
  const result = await res.json()
  // API returns paginated { data: [...], pagination: {...} }
  // Normalize to the shape this component expects
  return {
    certifications: Array.isArray(result) ? result : (result.data ?? []),
  }
}

// Use server function so CSRF is handled by TanStack Start (no token needed)
const fetchEnsureUser = async (data: {
  id: string
  name: string
  email: string
  avatarUrl?: string
}) => ensureUser({ data })

export const Route = createFileRoute('/catalog')({
  component: CatalogPage,
  // Note: No SSR loader - fetch with relative URLs doesn't work server-side
})

function CatalogPage() {
  const { user } = useUser()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('name') // name, vendor, level
  const [vendorFilter, setVendorFilter] = useState('All')
  const [difficultyFilter, setDifficultyFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [selectedCert, setSelectedCert] = useState<CatalogCertification | null>(
    null,
  )
  const [assigningCert, setAssigningCert] =
    useState<CatalogCertification | null>(null)
  const [editingCert, setEditingCert] = useState<CatalogCertification | null>(
    null,
  )
  const [editForm, setEditForm] = useState({
    difficulty: 'Associate',
    category: 'Cloud',
    price: '',
    description: '',
    officialSiteUrl: '',
  })
  const [newCert, setNewCert] = useState({
    id: '',
    name: '',
    vendorName: '',
    difficulty: 'Associate',
    price: '',
    category: 'Cloud',
    description: '',
    officialSiteUrl: '',
  })

  // Sync/Get User Role (no retry on 5xx to avoid console/network spam)
  const { data: dbUser } = useQuery({
    queryKey: ['dbUser', user?.id],
    queryFn: async () => {
      if (!user) return null
      return fetchEnsureUser({
        id: user.id,
        name: user.fullName || 'User',
        email: user.emailAddresses[0]?.emailAddress || '',
        avatarUrl: user.imageUrl,
      })
    },
    enabled: !!user,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const {
    data: catalog,
    isLoading,
    error,
    refetch: refetchCatalog,
    isRefetching,
  } = useQuery<CatalogResponse>({
    queryKey: ['catalog'],
    queryFn: fetchCatalog,
    retry: false,
    refetchOnWindowFocus: false,
  })

  // Get permissions based on role
  const isAdmin = dbUser?.role === 'Admin'
  const isManager = dbUser?.role === 'Manager' || isAdmin

  // List of unique vendors for filtering
  const vendors = useMemo<Array<string>>(() => {
    if (!catalog?.certifications) return ['All']
    const uniqueVendors = Array.from(
      new Set(
        catalog.certifications.map((c: CatalogCertification) => c.vendor),
      ),
    ).filter((v): v is string => !!v)
    return ['All', ...uniqueVendors.sort()]
  }, [catalog?.certifications])

  // List of unique categories for filtering
  const categories = useMemo<Array<string>>(() => {
    if (!catalog?.certifications) return ['All']
    const uniqueCategories = Array.from(
      new Set(
        catalog.certifications.map((c: CatalogCertification) => c.category),
      ),
    ).filter((c): c is string => !!c)
    return ['All', ...uniqueCategories.sort()]
  }, [catalog?.certifications])

  // Filter and Sort certifications
  const filteredCertifications = useMemo(() => {
    if (!catalog?.certifications) return []

    let processed = [...catalog.certifications]

    // 1. Text Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      processed = processed.filter(
        (cert: CatalogCertification) =>
          cert.name.toLowerCase().includes(query) ||
          cert.vendor?.toLowerCase().includes(query) ||
          cert.level?.toLowerCase().includes(query),
      )
    }

    // 2. Vendor Filter
    if (vendorFilter !== 'All') {
      processed = processed.filter(
        (cert: CatalogCertification) => cert.vendor === vendorFilter,
      )
    }

    // 3. Difficulty Filter
    if (difficultyFilter !== 'All') {
      processed = processed.filter(
        (cert: CatalogCertification) => cert.level === difficultyFilter,
      )
    }

    // 4. Category Filter
    if (categoryFilter !== 'All') {
      processed = processed.filter(
        (cert: CatalogCertification) => cert.category === categoryFilter,
      )
    }

    // 4. Sorting
    processed.sort((a: CatalogCertification, b: CatalogCertification) => {
      const vendorA = a.vendor ?? ''
      const vendorB = b.vendor ?? ''

      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'vendor') return vendorA.localeCompare(vendorB)
      if (sortBy === 'level') {
        const ranks: Record<string, number> = {
          Foundational: 1,
          Associate: 2,
          Professional: 3,
          Expert: 4,
        }
        return (ranks[a.level ?? ''] || 0) - (ranks[b.level ?? ''] || 0)
      }
      return 0
    })

    return processed
  }, [
    catalog?.certifications,
    searchQuery,
    sortBy,
    vendorFilter,
    difficultyFilter,
    categoryFilter,
  ])

  // Mutations

  const deleteMutation = useMutation({
    mutationFn: async (vars: { id: string }) => {
      const res = await fetchWithCsrf(
        `/api/catalog?action=delete&id=${vars.id}`,
        { method: 'DELETE' },
      )
      if (!res.ok) throw new Error('Failed to delete')
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalog'] }),
  })

  const addCertMutation = useMutation({
    mutationFn: async (certData: {
      id: string
      name: string
      vendorName: string
      difficulty: string
      price: string
      category: string
      description: string
      officialSiteUrl?: string
    }) => {
      const vendorId =
        certData.vendorName
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '') || 'vendor'
      const res = await fetchWithCsrf('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...certData,
          vendorId,
          officialSiteUrl: certData.officialSiteUrl || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to add certification')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      setShowAddModal(false)
      setNewCert({
        id: '',
        name: '',
        vendorName: '',
        difficulty: 'Associate',
        price: '',
        category: 'Cloud',
        description: '',
        officialSiteUrl: '',
      })
      alert('Certification added successfully!')
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unknown error'
      alert(`Add failed: ${message}`)
    },
  })

  const handleDelete = (id: string) => {
    if (confirm('Delete this certification from the catalog?')) {
      deleteMutation.mutate({ id })
    }
  }

  const openEditModal = (cert: CatalogCertification) => {
    setEditingCert(cert)
    setEditForm({
      difficulty: cert.level || 'Associate',
      category: cert.category || 'Cloud',
      price: String(cert.price ?? ''),
      description: cert.description ?? '',
      officialSiteUrl: cert.officialSiteUrl ?? '',
    })
  }

  const difficultyToSchema = (
    level: string,
  ): 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' => {
    const map: Record<
      string,
      'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
    > = {
      Foundational: 'Beginner',
      Associate: 'Intermediate',
      Professional: 'Advanced',
      Expert: 'Expert',
    }
    return map[level] ?? 'Intermediate'
  }

  const updateCertMutation = useMutation({
    mutationFn: async (vars: { id: string; updates: typeof editForm }) => {
      const res = await fetchWithCsrf('/api/catalog', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: vars.id,
          difficulty: difficultyToSchema(vars.updates.difficulty),
          category: vars.updates.category,
          price: vars.updates.price || null,
          description: vars.updates.description || null,
          officialSiteUrl: vars.updates.officialSiteUrl || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update certification')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      setEditingCert(null)
      alert('Certification updated successfully!')
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unknown'
      alert(`Update failed: ${message}`)
    },
  })

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetchWithCsrf('/api/catalog?action=import', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Import failed')
      }
      return res.json() as Promise<{
        success: boolean
        updated: number
        skipped: number
        errors?: Array<{ row: number; message: string }>
      }>
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      setShowImportModal(false)
      const msg = `Import complete. Updated: ${data.updated}, Skipped: ${data.skipped}${
        data.errors?.length ? `. ${data.errors.length} row(s) had errors.` : ''
      }`
      alert(msg)
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unknown'
      alert(`Import failed: ${message}`)
    },
  })

  if (isLoading) return <div className="p-8">Loading catalog...</div>

  if (error) {
    const requestId = (error as Error & { requestId?: string }).requestId
    return (
      <div className="p-8 max-w-md">
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-6">
          <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
            Catalog unavailable
          </h2>
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
            {error.message}
          </p>
          {requestId && (
            <div className="mt-4 p-3 rounded-lg bg-amber-100/80 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-100 space-y-2">
              <p className="font-semibold">Debug: find this error in Vercel</p>
              <p className="font-mono break-all">
                Request ID: <strong>{requestId}</strong>
              </p>
              <p>
                In Vercel → your project → <strong>Logs</strong> (Runtime Logs),
                use the search box and paste exactly:
              </p>
              <p className="font-mono bg-amber-200/60 dark:bg-amber-800/40 px-2 py-1 rounded break-all select-all">
                requestId={requestId}
              </p>
              <p>
                Or search for:{' '}
                <span className="font-mono">TRAINING_CERTIFY_500</span> and
                match the Request ID above.
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() => refetchCatalog()}
            disabled={isRefetching}
            className="mt-4 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
          >
            {isRefetching ? 'Retrying…' : 'Try again'}
          </button>
        </div>
      </div>
    )
  }

  if (!catalog) {
    return (
      <div className="p-8 text-slate-600 dark:text-slate-400">
        Catalog unavailable at the moment.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Certification Catalog
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Browse official certifications from top vendors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="catalog-search"
                type="text"
                placeholder="Search certifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              {vendors.map((v) => (
                <option key={v} value={v} className="dark:bg-slate-900">
                  {v === 'All' ? 'All Vendors' : v}
                </option>
              ))}
            </select>

            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All" className="dark:bg-slate-900">
                All Levels
              </option>
              <option value="Foundational" className="dark:bg-slate-900">
                Foundational
              </option>
              <option value="Associate" className="dark:bg-slate-900">
                Associate
              </option>
              <option value="Professional" className="dark:bg-slate-900">
                Professional
              </option>
              <option value="Expert" className="dark:bg-slate-900">
                Expert
              </option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="dark:bg-slate-900">
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name" className="dark:bg-slate-900">
                Sort by Name
              </option>
              <option value="vendor" className="dark:bg-slate-900">
                Sort by Vendor
              </option>
              <option value="level" className="dark:bg-slate-900">
                Sort by Difficulty
              </option>
            </select>
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(
                        '/api/catalog?format=csv&limit=10000',
                        { credentials: 'include' },
                      )
                      if (!res.ok) {
                        const text = await res.text()
                        alert(
                          `Export failed (${res.status}): ${text.slice(0, 200) || res.statusText}`,
                        )
                        return
                      }
                      const blob = await res.blob()
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `catalog-${new Date().toISOString().split('T')[0]}.csv`
                      a.click()
                      URL.revokeObjectURL(url)
                    } catch (e) {
                      alert(
                        `Export failed: ${e instanceof Error ? e.message : String(e)}`,
                      )
                    }
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium border border-slate-200 dark:border-slate-700"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium border border-slate-200 dark:border-slate-700"
                >
                  <Upload className="w-4 h-4" /> Import CSV
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" /> Add New
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCertifications.map((cert) => (
          <div
            key={cert.id}
            className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative"
          >
            {isAdmin && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEditModal(cert)}
                  className="p-1.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-blue-600"
                  aria-label="Edit certification"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(cert.id)}
                  className="p-1.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                {cert.vendor?.charAt(0)}
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                {cert.category || 'Cloud'}
              </span>
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
              {cert.name}
            </h3>
            <p className="text-sm text-slate-500 mb-6">{cert.vendor}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCert(cert)}
                className="flex-1 py-2 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                Details
              </button>
              {isManager && (
                <button
                  onClick={() => setAssigningCert(cert)}
                  className="flex-1 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Assign
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Add New Certification
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                addCertMutation.mutate(newCert)
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Certification ID
                </label>
                <input
                  type="text"
                  value={newCert.id}
                  onChange={(e) =>
                    setNewCert({ ...newCert, id: e.target.value })
                  }
                  placeholder="e.g., az-500"
                  required
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newCert.name}
                  onChange={(e) =>
                    setNewCert({ ...newCert, name: e.target.value })
                  }
                  placeholder="e.g., Azure Security Engineer Associate"
                  required
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Vendor
                </label>
                <input
                  type="text"
                  value={newCert.vendorName}
                  onChange={(e) =>
                    setNewCert({ ...newCert, vendorName: e.target.value })
                  }
                  placeholder="e.g., Microsoft"
                  required
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Difficulty
                </label>
                <select
                  value={newCert.difficulty}
                  onChange={(e) =>
                    setNewCert({ ...newCert, difficulty: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Foundational">Foundational</option>
                  <option value="Associate">Associate</option>
                  <option value="Professional">Professional</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={newCert.category}
                  onChange={(e) =>
                    setNewCert({ ...newCert, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="AI & Machine Learning">
                    AI & Machine Learning
                  </option>
                  <option value="Business Applications">
                    Business Applications
                  </option>
                  <option value="Cloud">Cloud</option>
                  <option value="Collaboration">Collaboration</option>
                  <option value="Data & Analytics">Data & Analytics</option>
                  <option value="Database">Database</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Governance & Compliance">
                    Governance & Compliance
                  </option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="IT Service Management">
                    IT Service Management
                  </option>
                  <option value="Networking">Networking</option>
                  <option value="Operating Systems">Operating Systems</option>
                  <option value="Project Management">Project Management</option>
                  <option value="Security">Security</option>
                  <option value="Software Development">
                    Software Development
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description / Requirements
                </label>
                <textarea
                  value={newCert.description}
                  onChange={(e) =>
                    setNewCert({ ...newCert, description: e.target.value })
                  }
                  placeholder="Enter exam requirements or description..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Price
                </label>
                <input
                  type="text"
                  value={newCert.price}
                  onChange={(e) =>
                    setNewCert({ ...newCert, price: e.target.value })
                  }
                  placeholder="e.g., $165"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Official site URL
                </label>
                <input
                  type="url"
                  value={newCert.officialSiteUrl}
                  onChange={(e) =>
                    setNewCert({ ...newCert, officialSiteUrl: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addCertMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 text-sm font-medium transition-colors"
                >
                  {addCertMutation.isPending
                    ? 'Adding...'
                    : 'Add Certification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Import CSV
              </h2>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportFile(null)
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Upload a CSV with columns: id, name, vendor, level, category,
              price, description, officialSiteUrl. Rows with an existing id will
              be updated.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (importFile) importMutation.mutate(importFile)
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  CSV file
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-300"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false)
                    setImportFile(null)
                  }}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!importFile || importMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 text-sm font-medium transition-colors"
                >
                  {importMutation.isPending ? 'Importing...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingCert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Edit Certification
              </h2>
              <button
                onClick={() => setEditingCert(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {editingCert.name} — Code: <strong>{editingCert.id}</strong>
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                updateCertMutation.mutate({
                  id: editingCert.id,
                  updates: editForm,
                })
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Difficulty
                </label>
                <select
                  value={editForm.difficulty}
                  onChange={(e) =>
                    setEditForm({ ...editForm, difficulty: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Foundational">Foundational</option>
                  <option value="Associate">Associate</option>
                  <option value="Professional">Professional</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm({ ...editForm, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="AI & Machine Learning">
                    AI & Machine Learning
                  </option>
                  <option value="Business Applications">
                    Business Applications
                  </option>
                  <option value="Cloud">Cloud</option>
                  <option value="Collaboration">Collaboration</option>
                  <option value="Data & Analytics">Data & Analytics</option>
                  <option value="Database">Database</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Governance & Compliance">
                    Governance & Compliance
                  </option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="IT Service Management">
                    IT Service Management
                  </option>
                  <option value="Networking">Networking</option>
                  <option value="Operating Systems">Operating Systems</option>
                  <option value="Project Management">Project Management</option>
                  <option value="Security">Security</option>
                  <option value="Software Development">
                    Software Development
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Exam Price
                </label>
                <input
                  type="text"
                  value={editForm.price}
                  onChange={(e) =>
                    setEditForm({ ...editForm, price: e.target.value })
                  }
                  placeholder="e.g., $165 or Contact Vendor"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Details & Requirements
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  placeholder="Exam requirements or description..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Official site URL
                </label>
                <input
                  type="url"
                  value={editForm.officialSiteUrl}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      officialSiteUrl: e.target.value,
                    })
                  }
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCert(null)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateCertMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 text-sm font-medium transition-colors"
                >
                  {updateCertMutation.isPending ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 font-bold shrink-0">
                    {selectedCert.vendor?.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 leading-tight">
                      {selectedCert.name}
                    </h2>
                    <p className="text-sm text-slate-500">
                      {selectedCert.vendor}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCert(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                    Difficulty
                  </p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {selectedCert.level}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                    Category
                  </p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {selectedCert.category || 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                    Exam Price
                  </p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedCert.price || 'Contact Vendor'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">
                    Code
                  </p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase">
                    {selectedCert.id}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                  Details & Requirements
                </h3>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
                  {selectedCert.description ? (
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                      {selectedCert.description}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">
                      No specific requirements listed for this certification
                      yet.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex gap-3">
              <button
                onClick={() => setSelectedCert(null)}
                className="flex-1 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              {selectedCert.officialSiteUrl ? (
                <a
                  href={selectedCert.officialSiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  Official Site <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <span
                  className="flex-1 px-4 py-2 bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2 cursor-not-allowed"
                  title="No official site URL configured"
                >
                  Official Site <ExternalLink className="w-4 h-4" />
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      {assigningCert && dbUser?.id && (
        <CertificationAssignmentModal
          cert={assigningCert}
          managerId={dbUser.id}
          onClose={() => setAssigningCert(null)}
        />
      )}
    </div>
  )
}
