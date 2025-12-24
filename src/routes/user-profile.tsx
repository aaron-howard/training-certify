import { createFileRoute } from '@tanstack/react-router'
import { UserProfile } from '@clerk/tanstack-react-start'

export const Route = createFileRoute('/user-profile')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <UserProfile path="/user-profile" routing="path" />
    </div>
  )
}
