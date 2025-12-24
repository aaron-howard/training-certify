import { UserButton, useUser, SignInButton, SignedIn, SignedOut } from '@clerk/tanstack-react-start'
import { Bell } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export function UserMenu() {
    const { user } = useUser()

    return (
        <div className="flex items-center gap-2">
            <SignedOut>
                <SignInButton mode="modal">
                    <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                        Sign In
                    </button>
                </SignInButton>
            </SignedOut>
            <SignedIn>
                <div className="flex items-center gap-4">
                    {/* Only keep one icon for notifications since it was specifically mentioned */}
                    <Link
                        to="/notifications"
                        className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative"
                        aria-label="Notifications"
                        title="Notifications"
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
                    </Link>

                    <div className="pl-4 border-l border-slate-200 dark:border-slate-800 flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {user?.fullName}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                {user?.primaryEmailAddress?.emailAddress}
                            </div>
                        </div>
                        <UserButton
                            afterSignOutUrl="/"
                            userProfileMode="navigation"
                            userProfileUrl="/user-profile"
                        />
                    </div>
                </div>
            </SignedIn>
        </div>
    )
}
