import React, { useState } from 'react'
import { MainNav } from './MainNav'
import { UserMenu } from './UserMenu'
import { Menu, X } from 'lucide-react'

export interface NavigationItem {
  label: string
  href: string
  icon?: React.ReactNode
  isActive?: boolean
}

export interface User {
  name: string
  email?: string
  avatarUrl?: string
}

export interface AppShellProps {
  children: React.ReactNode
  navigationItems: NavigationItem[]
  user?: User
  onNavigate?: (href: string) => void
  onLogout?: () => void
  onProfileClick?: () => void
  onHelpClick?: () => void
  onSettingsClick?: () => void
}

export function AppShell({
  children,
  navigationItems,
  user,
  onNavigate,
  onLogout,
  onProfileClick,
  onHelpClick,
  onSettingsClick,
}: AppShellProps) {
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
            <div className="font-semibold text-lg text-slate-900 dark:text-slate-100">
              Training-Certify
            </div>
          </div>

          {/* Right: User menu */}
          {user && (
            <UserMenu
              user={user}
              onLogout={onLogout}
              onProfileClick={onProfileClick}
              onHelpClick={onHelpClick}
              onSettingsClick={onSettingsClick}
            />
          )}
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:block fixed top-16 left-0 bottom-0 w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
        <MainNav items={navigationItems} onNavigate={onNavigate} />
      </aside>

      {/* Sidebar - Mobile Overlay */}
      {isMobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-slate-900/50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="lg:hidden fixed top-16 left-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto z-50">
            <MainNav
              items={navigationItems}
              onNavigate={(href) => {
                onNavigate?.(href)
                setIsMobileMenuOpen(false)
              }}
            />
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="pt-16 lg:pl-60">
        {children}
      </main>
    </div>
  )
}
