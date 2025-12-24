import { createFileRoute, Link } from '@tanstack/react-router'
import { UserProfile } from '@clerk/tanstack-react-start'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/user-profile')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 py-10">
      <div className="flex items-center px-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
      <div className="flex flex-col items-center justify-center">
        <UserProfile path="/user-profile" routing="path" />
      </div>
    </div>
  )
}
