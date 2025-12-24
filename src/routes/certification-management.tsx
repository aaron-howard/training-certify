import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getUserCertifications } from '../api/certifications'
import { CertificationManagement } from '../components/sections/certification-management/CertificationManagement'

export const Route = createFileRoute('/certification-management')({
    component: CertificationManagementPage,
    loader: async ({ context }) => {
        // Error check: in case queryClient is not properly typing
        const { queryClient } = context as any
        await queryClient.ensureQueryData({
            queryKey: ['userCertifications'],
            queryFn: () => getUserCertifications(),
        })
    },
})

function CertificationManagementPage() {
    const { data: certs } = useQuery({
        queryKey: ['userCertifications'],
        queryFn: () => getUserCertifications(),
    })

    return (
        <CertificationManagement
            userCertifications={certs || []}
            onCreate={(data) => console.log('Create', data)}
            onEdit={(id, data) => console.log('Edit', id, data)}
            onDelete={(id) => console.log('Delete', id)}
            onView={(id) => console.log('View', id)}
        />
    )
}
