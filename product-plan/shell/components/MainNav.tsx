import React from 'react'
import {
  Award,
  Bell,
  BookOpen,
  Shield,
  Users
} from 'lucide-react'
import type { NavigationItem } from './AppShell'

export interface MainNavProps {
  items: Array<NavigationItem>
  onNavigate?: (href: string) => void
}

// Map section labels to icons
const iconMap: Record<string, React.ReactNode> = {
  'Certification Management': <Award className="w-5 h-5" />,
  'Team & Workforce Management': <Users className="w-5 h-5" />,
  'Compliance & Audit': <Shield className="w-5 h-5" />,
  'Certification Catalog': <BookOpen className="w-5 h-5" />,
  'Notifications & Alerts': <Bell className="w-5 h-5" />,
}

export function MainNav({ items, onNavigate }: MainNavProps) {
  return (
    <nav className="p-4">
      <ul className="space-y-1">
        {items.map((item) => {
          const icon = item.icon || iconMap[item.label]

          return (
            <li key={item.href}>
              <button
                onClick={() => onNavigate?.(item.href)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${
                    item.isActive
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }
                `}
              >
                {icon && (
                  <span className={item.isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}>
                    {icon}
                  </span>
                )}
                <span>{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
