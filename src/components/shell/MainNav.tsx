import React from 'react'
import { Link } from '@tanstack/react-router'
import { Award, Bell, BookOpen, Shield, User, Users } from 'lucide-react'

export interface NavigationItem {
  label: string
  href: string
}

export interface MainNavProps {
  items: Array<NavigationItem>
}

const iconMap: Record<string, React.ReactNode> = {
  'Certification Management': <Award className="w-5 h-5" />,
  'Team & Workforce Management': <Users className="w-5 h-5" />,
  'Compliance & Audit': <Shield className="w-5 h-5" />,
  'Certification Catalog': <BookOpen className="w-5 h-5" />,
  'Notifications & Alerts': <Bell className="w-5 h-5" />,
  'User Profile': <User className="w-5 h-5" />,
}

export function MainNav({ items }: MainNavProps) {
  return (
    <nav className="p-4">
      <ul className="space-y-1">
        {items.map((item) => {
          const icon = iconMap[item.label]

          return (
            <li key={item.href}>
              <Link
                to={item.href}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 [&.active]:bg-blue-50 dark:[&.active]:bg-blue-950 [&.active]:text-blue-700 dark:[&.active]:text-blue-300 group"
              >
                {icon && (
                  <span className="text-slate-500 dark:text-slate-400 group-[.active]:text-blue-600 group-[.active]:dark:text-blue-400">
                    {icon}
                  </span>
                )}
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
