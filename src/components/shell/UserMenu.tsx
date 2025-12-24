import { UserButton, useUser, SignInButton, SignedIn, SignedOut, SignOutButton } from '@clerk/tanstack-react-start'
import { HelpCircle, Settings, User, LogOut } from 'lucide-react'
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
                <div className="flex items-center gap-2">
                    <Link
                        to="/user-profile"
                        className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        aria-label="Profile"
                        title="Profile"
                    >
                        <User className="w-5 h-5" />
                    </Link>
                    <button
                        className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        aria-label="Help"
                        title="Help"
                    >
                        <HelpCircle className="w-5 h-5" />
                    </button>
                    <button
                        className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        aria-label="Settings"
                        title="Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>

                    <SignOutButton>
                        <button
                            className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            aria-label="Logout"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </SignOutButton>

                    <div className="ml-2 pl-4 border-l border-slate-200 dark:border-slate-800 flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {user?.fullName}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                {user?.primaryEmailAddress?.emailAddress}
                            </div>
                        </div>
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </SignedIn>
        </div>
    )
}
