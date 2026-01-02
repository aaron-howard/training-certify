import { useMemo, useState } from 'react'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Edit,
  FileText,
  Plus,
  Search,
  Shield,
  Trash2,
  X,
  XCircle,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { CertificationStatus, UserCertification } from '../../../types'

export interface CertificationManagementProps {
  userCertifications: Array<UserCertification>
  onCreate?: (data: any) => void
  onEdit?: (id: string, data: any) => void
  onDelete?: (id: string) => void
  onView?: (id: string) => void
  onUploadProof?: (id: string, file: File) => void
}

export function CertificationManagement({
  userCertifications,
  onCreate,
  onEdit,
  onDelete,
  onView,
  onUploadProof,
}: CertificationManagementProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<CertificationStatus | 'all'>(
    'all',
  )
  const [sortBy, setSortBy] = useState<'expiration' | 'name'>('expiration')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewingCertId, setViewingCertId] = useState<string | null>(null)
  const [editingCert, setEditingCert] = useState<UserCertification | null>(null)

  // Form state for new certification
  const [formData, setFormData] = useState({
    certificationId: '',
    certificationNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
  })

  // Fetch catalog for the selection dropdown
  const { data: catalogData } = useQuery({
    queryKey: ['catalog'],
    queryFn: async () => {
      const res = await fetch('/api/catalog')
      if (!res.ok) return { certifications: [] }
      return res.json()
    },
  })

  // Fetch detailed cert info when viewing
  const { data: detailedCert, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['certDetails', viewingCertId],
    queryFn: async () => {
      if (!viewingCertId) return null
      const res = await fetch(`/api/certifications?id=${viewingCertId}`)
      if (!res.ok) return null
      return res.json()
    },
    enabled: !!viewingCertId,
  })

  const catalog = catalogData?.certifications || []

  const normalizedCertifications = useMemo(() => {
    // ... existing normalizedCertifications logic
    // Deduplicate and enrich with dynamic status
    const unique = Array.from(
      new Map(userCertifications.map((c) => [c.id, c])).values(),
    )

    return unique.map((cert) => {
      if (!cert.expirationDate) return cert

      const expDate = new Date(cert.expirationDate)
      const daysRemaining = Math.ceil(
        (expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      )

      let status = cert.status
      if (daysRemaining <= 0) {
        status = 'expired'
      } else if (daysRemaining <= 30) {
        status = 'expiring'
      } else if (daysRemaining <= 90) {
        // Catching the "soon" cases better
        status = 'expiring-soon'
      }

      return { ...cert, status, daysUntilExpiration: daysRemaining }
    })
  }, [userCertifications])

  const filteredCertifications = useMemo(() => {
    // ... existing filteredCertifications logic
    let filtered = [...normalizedCertifications]

    if (searchQuery) {
      filtered = filtered.filter(
        (cert) =>
          cert.certificationName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          cert.vendorName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'expiring') {
        // Filter for both expiring and expiring-soon
        filtered = filtered.filter(
          (cert) =>
            cert.status === 'expiring' || cert.status === 'expiring-soon',
        )
      } else {
        filtered = filtered.filter((cert) => cert.status === statusFilter)
      }
    }

    filtered.sort((a, b) => {
      if (sortBy === 'expiration') {
        const dateA = a.expirationDate
          ? new Date(a.expirationDate).getTime()
          : 0
        const dateB = b.expirationDate
          ? new Date(b.expirationDate).getTime()
          : 0
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
      } else {
        const nameA = a.certificationName.toLowerCase()
        const nameB = b.certificationName.toLowerCase()
        return sortOrder === 'asc'
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA)
      }
    })

    return filtered
  }, [normalizedCertifications, searchQuery, statusFilter, sortBy, sortOrder])

  const statusCounts = useMemo(() => {
    // ... existing statusCounts logic
    return {
      all: normalizedCertifications.length,
      active: normalizedCertifications.filter((c) => c.status === 'active')
        .length,
      expiring: normalizedCertifications.filter(
        (c) => c.status === 'expiring' || c.status === 'expiring-soon',
      ).length,
      expired: normalizedCertifications.filter((c) => c.status === 'expired')
        .length,
    }
  }, [normalizedCertifications])

  const handleSort = (field: 'expiration' | 'name') => {
    // ... existing handleSort logic
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const handleViewDetails = (id: string) => {
    setViewingCertId(id)
    onView?.(id)
  }

  return (
    <div className="max-w-7xl mx-auto">
      // ... existing JSX starts here
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              My Certifications
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Track and manage your professional certifications
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
          >
            <Plus className="w-5 h-5" />
            Add Certification
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {statusCounts.all}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Total
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-900 p-4 shadow-sm">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {statusCounts.active}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Active
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-900 p-4 shadow-sm">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {statusCounts.expiring}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Expiring Soon
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-red-200 dark:border-red-900 p-4 shadow-sm">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {statusCounts.expired}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Expired
            </div>
          </div>
        </div>
      </div>
      {/* Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="certification-search"
                name="certification-search"
                type="text"
                placeholder="Search by certification name or vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-50 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-shadow"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'active', 'expiring', 'expired'] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                    statusFilter === status
                      ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  <span className="ml-2 text-sm opacity-75">
                    ({statusCounts[status]})
                  </span>
                </button>
              ),
            )}
          </div>
        </div>
      </div>
      {/* Desktop Table */}
      <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="text-left px-6 py-4">
                  <button
                    onClick={() => handleSort('name')}
                    className="inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Certification
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${sortBy === 'name' && sortOrder === 'desc' ? 'rotate-180' : ''}`}
                    />
                  </button>
                </th>
                <th className="text-left px-6 py-4 font-semibold text-slate-900 dark:text-slate-50">
                  Status
                </th>
                <th className="text-left px-6 py-4">
                  <button
                    onClick={() => handleSort('expiration')}
                    className="inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Expiration
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${sortBy === 'expiration' && sortOrder === 'desc' ? 'rotate-180' : ''}`}
                    />
                  </button>
                </th>
                <th className="text-left px-6 py-4 font-semibold text-slate-900 dark:text-slate-50">
                  Certification Number
                </th>
                <th className="text-right px-6 py-4 font-semibold text-slate-900 dark:text-slate-50">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredCertifications.map((cert) => (
                <CertificationRow
                  key={cert.id}
                  certification={cert}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onView={handleViewDetails}
                  onUploadProof={onUploadProof}
                />
              ))}
            </tbody>
          </table>
        </div>

        {filteredCertifications.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400">
              {searchQuery || statusFilter !== 'all'
                ? 'No certifications found matching your filters'
                : 'No certifications yet. Add your first certification to get started.'}
            </p>
          </div>
        )}
      </div>
      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {filteredCertifications.map((cert) => (
          <CertificationCard
            key={cert.id}
            certification={cert}
            onEdit={onEdit}
            onView={handleViewDetails}
          />
        ))}
        // ... existing mobile card empty state
        {filteredCertifications.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-8 text-center">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400">
              {searchQuery || statusFilter !== 'all'
                ? 'No certifications found matching your filters'
                : 'No certifications yet. Add your first certification to get started.'}
            </p>
          </div>
        )}
      </div>
      {/* Details Modal */}
      {viewingCertId && (
        <ViewDetailsModal
          isOpen={!!viewingCertId}
          onClose={() => setViewingCertId(null)}
          cert={detailedCert}
          loading={isLoadingDetails}
        />
      )}
      {/* Add Certification Modal */}
      // ... existing Add Modal
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Add Certification
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
                const selected = catalog.find(
                  (c: any) => c.id === formData.certificationId,
                )
                if (selected) {
                  onCreate?.({
                    ...formData,
                    certificationName: selected.name,
                    vendorName: selected.vendor,
                  })
                  setShowAddModal(false)
                  setFormData({
                    certificationId: '',
                    certificationNumber: '',
                    issueDate: new Date().toISOString().split('T')[0],
                    expirationDate: new Date(
                      Date.now() + 365 * 24 * 60 * 60 * 1000,
                    )
                      .toISOString()
                      .split('T')[0],
                  })
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Select Certification
                </label>
                <select
                  value={formData.certificationId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      certificationId: e.target.value,
                    })
                  }
                  required
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm"
                >
                  <option value="">Select from catalog...</option>
                  {catalog.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.vendor}: {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Certification Number
                </label>
                <input
                  type="text"
                  value={formData.certificationNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      certificationNumber: e.target.value,
                    })
                  }
                  placeholder="e.g., AWS-123456"
                  required
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, issueDate: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expirationDate: e.target.value,
                      })
                    }
                    required
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4 text-sm">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Add Certification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {editingCert && (
        <EditCertificationModal
          isOpen={!!editingCert}
          onClose={() => setEditingCert(null)}
          cert={editingCert}
          onSave={(updates) => {
            onEdit?.(editingCert.id, updates)
            setEditingCert(null)
          }}
        />
      )}
    </div>
  )
}

function CertificationRow({
  certification,
  onEdit,
  onDelete,
  onView,
  onUploadProof,
}: {
  certification: UserCertification
  onEdit?: (id: string, data: any) => void
  onDelete?: (id: string) => void
  onView?: (id: string) => void
  onUploadProof?: (id: string, file: File) => void
}) {
  // ... existing CertificationRow logic
  const daysUntilExpiration = certification.expirationDate
    ? Math.ceil(
        (new Date(certification.expirationDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : null

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors group">
      <td className="px-6 py-4">
        <div>
          <div className="font-medium text-slate-900 dark:text-slate-50 mb-0.5">
            {certification.certificationName}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {certification.vendorName}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={certification.status} />
      </td>
      <td className="px-6 py-4">
        <div>
          <div className="text-slate-900 dark:text-slate-50">
            {certification.expirationDate
              ? new Date(certification.expirationDate).toLocaleDateString(
                  'en-US',
                  {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  },
                )
              : 'Never'}
          </div>
          <div
            className={`text-sm mt-0.5 ${
              certification.status === 'expired'
                ? 'text-red-600 dark:text-red-400'
                : certification.status === 'expiring'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {certification.status === 'expired'
              ? `Expired ${daysUntilExpiration ? Math.abs(daysUntilExpiration) : 0} days ago`
              : daysUntilExpiration !== null
                ? `${daysUntilExpiration} days remaining`
                : 'No expiration'}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <code className="text-sm font-mono text-slate-700 dark:text-slate-300">
          {certification.certificationNumber}
        </code>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onView?.(certification.id)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
            title="View Details"
          >
            <FileText className="w-4 h-4" />
          </button>
          <div className="relative">
            <input
              id={`proof-upload-${certification.id}`}
              name="proof-upload"
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onUploadProof?.(certification.id, file)
              }}
            />
            <button
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
              title="Upload Proof"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => onEdit?.(certification.id, certification)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete?.(certification.id)}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

function ViewDetailsModal({
  isOpen,
  onClose,
  cert,
  loading,
}: {
  isOpen: boolean
  onClose: () => void
  cert: any
  loading: boolean
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Certification Details
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500">
            Loading details...
          </div>
        ) : cert ? (
          <div className="space-y-8">
            {/* Summary Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Certification
                </label>
                <p className="text-slate-900 dark:text-slate-50 font-medium">
                  {cert.certificationName}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Vendor
                </label>
                <p className="text-slate-900 dark:text-slate-50 font-medium">
                  {cert.vendorName}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Number
                </label>
                <p className="text-slate-900 dark:text-slate-50 font-mono text-sm">
                  {cert.certificationNumber || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Issue Date
                </label>
                <p className="text-slate-900 dark:text-slate-50">
                  {cert.issueDate
                    ? new Date(cert.issueDate).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Expiry Date
                </label>
                <p className="text-slate-900 dark:text-slate-50">
                  {cert.expirationDate
                    ? new Date(cert.expirationDate).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Status
                </label>
                <div className="mt-1">
                  <StatusBadge status={cert.status} />
                </div>
              </div>
            </div>

            {/* Proofs Section */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                Evidence & Proofs
              </h3>

              {cert.proofs && cert.proofs.length > 0 ? (
                <ul className="space-y-3">
                  {cert.proofs.map((proof: any) => (
                    <li
                      key={proof.id}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                            {proof.fileName}
                          </p>
                          <p className="text-xs text-slate-500">
                            Uploaded{' '}
                            {new Date(proof.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <a
                        href={proof.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 hover:underline font-medium"
                      >
                        View
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 bg-slate-50 dark:bg-slate-950 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">
                    No proof documents uploaded yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-red-500">
            Error loading certification data.
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-lg font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function EditCertificationModal({
  isOpen,
  onClose,
  cert,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  cert: UserCertification
  onSave: (data: any) => void
}) {
  const [formData, setFormData] = useState({
    certificationNumber: cert.certificationNumber || '',
    issueDate: cert.issueDate
      ? new Date(cert.issueDate).toISOString().split('T')[0]
      : '',
    expirationDate: cert.expirationDate
      ? new Date(cert.expirationDate).toISOString().split('T')[0]
      : '',
    status: cert.status,
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Edit Certification
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <h3 className="font-medium text-slate-900 dark:text-slate-50">
            {cert.certificationName}
          </h3>
          <p className="text-sm text-slate-500">{cert.vendorName}</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSave(formData)
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as any })
              }
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm"
            >
              <option value="active">Active</option>
              <option value="expiring">Expiring</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Certification Number
            </label>
            <input
              type="text"
              value={formData.certificationNumber}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  certificationNumber: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Issue Date
              </label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) =>
                  setFormData({ ...formData, issueDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                value={formData.expirationDate}
                onChange={(e) =>
                  setFormData({ ...formData, expirationDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4 text-sm">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
// ... CertificationCard remains largely similar, but wire up onView to its handlers too if desired

function CertificationCard({
  certification,
  onEdit,
  onView,
}: {
  certification: UserCertification
  onEdit?: (id: string, data: any) => void
  onView?: (id: string) => void
}) {
  const daysUntilExpiration = certification.expirationDate
    ? Math.ceil(
        (new Date(certification.expirationDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : null

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-slate-900 dark:text-slate-50 mb-1">
            {certification.certificationName}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            {certification.vendorName}
          </p>
        </div>
        <StatusBadge status={certification.status} />
      </div>

      <div className="space-y-3 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-slate-600 dark:text-slate-400">Expires:</span>
          <span className="text-slate-900 dark:text-slate-50 font-medium">
            {certification.expirationDate
              ? new Date(certification.expirationDate).toLocaleDateString()
              : 'Never'}
          </span>
        </div>
        {daysUntilExpiration !== null && (
          <div className="text-xs text-slate-500 ml-6">
            {certification.status === 'expired'
              ? `${Math.abs(daysUntilExpiration)} days overdue`
              : `${daysUntilExpiration} days remaining`}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onView?.(certification.id)}
          className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium transition-colors"
        >
          View
        </button>
        <button
          onClick={() => onEdit?.(certification.id, certification)}
          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Edit
        </button>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: CertificationStatus }) {
  const config: Record<string, any> = {
    active: {
      icon: CheckCircle2,
      label: 'Active',
      className:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900',
    },
    expiring: {
      icon: AlertCircle,
      label: 'Expiring',
      className:
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900',
    },
    'expiring-soon': {
      icon: AlertCircle,
      label: 'Expiring Soon',
      className:
        'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900',
    },
    expired: {
      icon: XCircle,
      label: 'Expired',
      className:
        'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900',
    },
  }
  const badge = config[status] || config.active
  const { icon: Icon, label, className } = badge
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  )
}
