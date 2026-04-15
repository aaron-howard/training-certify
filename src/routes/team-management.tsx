import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/team-management')({
  component: lazyRouteComponent(
    () => import('../components/pages/TeamManagementRoutePage'),
    'TeamManagementRoutePage',
  ),
})
