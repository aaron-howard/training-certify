import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/certification-management')({
  component: lazyRouteComponent(
    () => import('../components/pages/CertificationManagementRoutePage'),
    'CertificationManagementRoutePage',
  ),
})
