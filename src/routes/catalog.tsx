import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'

export const Route = createFileRoute('/catalog')({
  component: lazyRouteComponent(
    () => import('../components/pages/CatalogRoutePage'),
    'CatalogRoutePage',
  ),
})
