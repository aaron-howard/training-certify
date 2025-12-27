import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CertificationManagement } from '../components/sections/certification-management/CertificationManagement'
import { useUser } from '@clerk/tanstack-react-start'

// Use fetch API instead of server imports
const fetchUserCertifications = async (userId: string) => {
    const res = await fetch(`/api/certifications?userId=${userId}`)
    if (!res.ok) return []
    return res.json()
}

const createCertification = async (data: any) => {
    const res = await fetch('/api/certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to create certification')
    return res.json()
}

const deleteCertification = async (id: string) => {
    const res = await fetch(`/api/certifications?id=${id}`, {
        method: 'DELETE'
    })
    if (!res.ok) throw new Error('Failed to delete certification')
    return res.json()
}

export const Route = createFileRoute('/certification-management')({
    component: CertificationManagementPage,
})

function CertificationManagementPage() {
    const queryClient = useQueryClient()
    const { user } = useUser()

    const { data: certs } = useQuery({
        queryKey: ['userCertifications', user?.id],
        queryFn: async () => {
            if (!user?.id) return []
            return fetchUserCertifications(user.id)
        },
        enabled: !!user?.id
    })

    const createMutation = useMutation({
        mutationFn: createCertification,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userCertifications'] }),
    })

    const deleteMutation = useMutation({
        mutationFn: deleteCertification,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userCertifications'] }),
    })

    const handleCreate = (data: any) => {
        createMutation.mutate({
            ...data,
            userId: user?.id || 'unknown'
        })
    }

    const handleEdit = (id: string, updates: any) => {
        // TODO: Implement update
        console.log('Edit', id, updates)
    }

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this certification?')) {
            deleteMutation.mutate(id)
        }
    }

    return (
        <CertificationManagement
            userCertifications={certs || []}
            onCreate={handleCreate}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={(id) => console.log('View', id)}
        />
    )
}
