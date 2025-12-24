import { useState, useMemo } from 'react'
import type {
    UserCertification,
    CertificationStatus
} from '../../../types'
import { Search, Plus, ChevronDown, Calendar, AlertCircle, CheckCircle2, XCircle, Edit, Trash2, FileText } from 'lucide-react'

export interface CertificationManagementProps {
    userCertifications: UserCertification[]
    onCreate?: (data: any) => void
    onEdit?: (id: string, data: any) => void
    onDelete?: (id: string) => void
    onView?: (id: string) => void
}

export function CertificationManagement({
    userCertifications,
    onCreate,
    onEdit,
    onDelete,
    onView,
}: CertificationManagementProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<CertificationStatus | 'all'>('all')
    const [sortBy, setSortBy] = useState<'expiration' | 'name'>('expiration')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

    const normalizedCertifications = useMemo(() => {
        // Deduplicate and enrich with dynamic status
        const unique = Array.from(new Map(userCertifications.map(c => [c.id, c])).values())

        return unique.map(cert => {
            if (!cert.expirationDate) return cert

            const expDate = new Date(cert.expirationDate)
            const daysRemaining = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

            let status = cert.status
            if (daysRemaining <= 0) {
                status = 'expired'
            } else if (daysRemaining <= 30) {
                status = 'expiring'
            } else if (daysRemaining <= 90) { // Catching the "soon" cases better
                status = 'expiring-soon'
            }

            return { ...cert, status, daysUntilExpiration: daysRemaining }
        })
    }, [userCertifications])

    const filteredCertifications = useMemo(() => {
        let filtered = [...normalizedCertifications]

        if (searchQuery) {
            filtered = filtered.filter(cert =>
                cert.certificationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cert.vendorName.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        if (statusFilter !== 'all') {
            if (statusFilter === 'expiring') {
                // Filter for both expiring and expiring-soon
                filtered = filtered.filter(cert => cert.status === 'expiring' || cert.status === 'expiring-soon')
            } else {
                filtered = filtered.filter(cert => cert.status === statusFilter)
            }
        }

        filtered.sort((a, b) => {
            if (sortBy === 'expiration') {
                const dateA = a.expirationDate ? new Date(a.expirationDate).getTime() : 0
                const dateB = b.expirationDate ? new Date(b.expirationDate).getTime() : 0
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
        return {
            all: normalizedCertifications.length,
            active: normalizedCertifications.filter(c => c.status === 'active').length,
            expiring: normalizedCertifications.filter(c => c.status === 'expiring' || c.status === 'expiring-soon').length,
            expired: normalizedCertifications.filter(c => c.status === 'expired').length,
        }
    }, [normalizedCertifications])

    const handleSort = (field: 'expiration' | 'name') => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(field)
            setSortOrder('asc')
        }
    }

    return (
        <div className="max-w-7xl mx-auto">
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
                        onClick={() => onCreate?.({
                            certificationName: 'New Certification',
                            vendorName: 'Vendor',
                            certificationNumber: 'NEW-123',
                            issueDate: new Date().toISOString().split('T')[0],
                            expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        })}
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
                        {(['all', 'active', 'expiring', 'expired'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2.5 rounded-lg font-medium transition-all ${statusFilter === status
                                    ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-sm'
                                    : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                                    }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                <span className="ml-2 text-sm opacity-75">
                                    ({statusCounts[status]})
                                </span>
                            </button>
                        ))}
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
                                        <ChevronDown className={`w-4 h-4 transition-transform ${sortBy === 'name' && sortOrder === 'desc' ? 'rotate-180' : ''}`} />
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
                                        <ChevronDown className={`w-4 h-4 transition-transform ${sortBy === 'expiration' && sortOrder === 'desc' ? 'rotate-180' : ''}`} />
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
                                    onView={onView}
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
                        onView={onView}
                    />
                ))}

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
        </div>
    )
}

function CertificationRow({
    certification,
    onEdit,
    onDelete,
    onView,
}: {
    certification: UserCertification
    onEdit?: (id: string, data: any) => void
    onDelete?: (id: string) => void
    onView?: (id: string) => void
}) {
    const daysUntilExpiration = certification.expirationDate
        ? Math.ceil((new Date(certification.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
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
                        {certification.expirationDate ? new Date(certification.expirationDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        }) : 'Never'}
                    </div>
                    <div className={`text-sm mt-0.5 ${certification.status === 'expired'
                        ? 'text-red-600 dark:text-red-400'
                        : certification.status === 'expiring'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}>
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
                    >
                        <FileText className="w-4 h-4" />
                    </button>
                    <div className="relative">
                        <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => alert(`Uploaded: ${e.target.files?.[0]?.name}`)}
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
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete?.(certification.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    )
}

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
        ? Math.ceil((new Date(certification.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
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
                        {certification.expirationDate ? new Date(certification.expirationDate).toLocaleDateString() : 'Never'}
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
        active: { icon: CheckCircle2, label: 'Active', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900' },
        expiring: { icon: AlertCircle, label: 'Expiring', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900' },
        'expiring-soon': { icon: AlertCircle, label: 'Expiring Soon', className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900' },
        expired: { icon: XCircle, label: 'Expired', className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900' },
    }
    const badge = config[status] || config.active
    const { icon: Icon, label, className } = badge
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${className}`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
        </span>
    )
}
