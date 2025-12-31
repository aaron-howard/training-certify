import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, HelpCircle, LogOut, Settings, User as UserIcon } from 'lucide-react'
import type { User } from './AppShell'

export interface UserMenuProps {
  user: User
  onLogout?: () => void
  onProfileClick?: () => void
  onHelpClick?: () => void
  onSettingsClick?: () => void
}

export function UserMenu({
  user,
  onLogout,
  onProfileClick,
  onHelpClick,
  onSettingsClick,
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        {/* Avatar */}
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-700 text-white flex items-center justify-center text-sm font-medium">
            {getInitials(user.name)}
          </div>
        )}

        {/* Name (hidden on mobile) */}
        <span className="hidden md:block text-sm font-medium text-slate-700 dark:text-slate-300">
          {user.name}
        </span>

        {/* Chevron */}
        <ChevronDown
          className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {user.name}
            </div>
            {user.email && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {user.email}
              </div>
            )}
          </div>

          {/* Menu items */}
          <div className="py-1">
            {onProfileClick && (
              <button
                onClick={() => {
                  onProfileClick()
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <UserIcon className="w-4 h-4" />
                Profile / Account
              </button>
            )}

            {onHelpClick && (
              <button
                onClick={() => {
                  onHelpClick()
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                Help / Documentation
              </button>
            )}

            {onSettingsClick && (
              <button
                onClick={() => {
                  onSettingsClick()
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            )}
          </div>

          {/* Logout */}
          {onLogout && (
            <>
              <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
              <button
                onClick={() => {
                  onLogout()
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
