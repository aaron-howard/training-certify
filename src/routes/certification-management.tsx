import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getUserCertifications, createCertification, updateCertification, deleteCertification } from '../api/certifications.server'
import { CertificationManagement } from '../components/sections/certification-management/CertificationManagement'
import { useUser } from '@clerk/tanstack-react-start'

export const Route = createFileRoute('/certification-management')({
    component: CertificationManagementPage,
    loader: async ({ context }) => {
        const { queryClient } = context as any
        await queryClient.ensureQueryData({
            queryKey: ['userCertifications'],
            queryFn: async () => {
                const data = await getUserCertifications()
                return data ?? []
            },
        })
    },
})

function CertificationManagementPage() {
    const queryClient = useQueryClient()
    const { user } = useUser()

    const { data: certs } = useQuery({
        queryKey: ['userCertifications'],
        queryFn: async () => {
            const res = await getUserCertifications()
            return res ?? []
        },
    })

    const createMutation = useMutation({
        mutationFn: createCertification,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userCertifications'] }),
    })

    const updateMutation = useMutation({
        mutationFn: updateCertification,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userCertifications'] }),
    })

    const deleteMutation = useMutation({
        mutationFn: deleteCertification,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userCertifications'] }),
    })

    const handleCreate = (data: any) => {
        createMutation.mutate({
            data: {
                ...data,
                userId: user?.id || 'unknown'
            }
        })
    }

    const handleEdit = (id: string, updates: any) => {
        updateMutation.mutate({
            data: { id, updates }
        })
    }

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this certification?')) {
            deleteMutation.mutate({ data: id })
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
