import React, { useState } from 'react'
import { MainNav } from './MainNav'
import { UserMenu } from './UserMenu'
import { Menu, X } from 'lucide-react'

export interface NavigationItem {
    label: string
    href: string
}

export interface AppShellProps {
    children: React.ReactNode
}

const navigationItems: NavigationItem[] = [
    { label: 'Certification Management', href: '/certification-management' },
    { label: 'Team & Workforce Management', href: '/team-management' },
    { label: 'Compliance & Audit', href: '/compliance-audit' },
    { label: 'Certification Catalog', href: '/catalog' },
    { label: 'Notifications & Alerts', href: '/notifications' },
    { label: 'User Profile', href: '/user-profile' },
]

export function AppShell({ children }: AppShellProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Top Bar */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30">
                <div className="h-full px-4 flex items-center justify-between">
                    {/* Left: Mobile menu toggle + Logo */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? (
                                <X className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                            ) : (
                                <Menu className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                            )}
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">T</span>
                            </div>
                            <div className="font-semibold text-lg text-slate-900 dark:text-slate-100 hidden sm:block">
                                Training-Certify
                            </div>
                        </div>
                    </div>

                    {/* Right: User menu */}
                    <UserMenu />
                </div>
            </header>

            {/* Sidebar - Desktop */}
            <aside className="hidden lg:block fixed top-16 left-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
                <MainNav items={navigationItems} />
            </aside>

            {/* Sidebar - Mobile Overlay */}
            {isMobileMenuOpen && (
                <>
                    <div
                        className="lg:hidden fixed inset-0 bg-slate-900/50 z-40"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <aside className="lg:hidden fixed top-16 left-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto z-50">
                        <MainNav items={navigationItems} />
                    </aside>
                </>
            )}

            {/* Main Content */}
            <main className="pt-16 lg:pl-64 min-h-screen">
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    )
}
