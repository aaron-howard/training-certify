import { useState } from 'react'
import { Bell, Settings as SettingsIcon } from 'lucide-react'
import { NotificationCard } from './NotificationCard'
import { NotificationSettings } from './NotificationSettings'
import type { NotificationsAlertsProps } from '@/../product/sections/notifications-and-alerts/types'

export function NotificationsDashboard({
  notifications,
  settings,
  onMarkAsRead,
  onMarkAsUnread,
  onDismiss,
  onFilter,
  onUpdateFrequency,
  onUpdateChannels,
  onUpdatePreferences,
}: NotificationsAlertsProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'dismissed'>('all')
  const [showSettings, setShowSettings] = useState(false)

  const handleFilterChange = (filter: 'all' | 'unread' | 'dismissed') => {
    setActiveFilter(filter)
    onFilter?.(filter)
  }

  // Filter notifications based on active filter
  const filteredNotifications = notifications.filter((notif) => {
    if (activeFilter === 'unread') return !notif.isRead && !notif.isDismissed
    if (activeFilter === 'dismissed') return notif.isDismissed
    return !notif.isDismissed // 'all' shows only non-dismissed
  })

  // Calculate counts for filters
  const unreadCount = notifications.filter((n) => !n.isRead && !n.isDismissed).length
  const dismissedCount = notifications.filter((n) => n.isDismissed).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Notifications & Alerts
                </h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Stay on top of certification renewals and compliance
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                showSettings
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <SettingsIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All
              {activeFilter !== 'all' && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-slate-200 dark:bg-slate-700 rounded">
                  {notifications.filter((n) => !n.isDismissed).length}
                </span>
              )}
            </button>
            <button
              onClick={() => handleFilterChange('unread')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeFilter === 'unread'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 text-xs rounded ${
                  activeFilter === 'unread'
                    ? 'bg-blue-500 text-white'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => handleFilterChange('dismissed')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeFilter === 'dismissed'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Dismissed
              {dismissedCount > 0 && activeFilter !== 'dismissed' && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-slate-200 dark:bg-slate-700 rounded">
                  {dismissedCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Settings Panel */}
        {showSettings && (
          <NotificationSettings
            settings={settings}
            onUpdateFrequency={onUpdateFrequency}
            onUpdateChannels={onUpdateChannels}
            onUpdatePreferences={onUpdatePreferences}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* Notifications Feed */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                <Bell className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {activeFilter === 'unread' && 'All caught up!'}
                {activeFilter === 'dismissed' && 'No dismissed notifications'}
                {activeFilter === 'all' && 'No notifications yet'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {activeFilter === 'unread' && "You've read all your notifications."}
                {activeFilter === 'dismissed' && "Dismissed notifications will appear here."}
                {activeFilter === 'all' && "You'll see notifications about certification renewals and alerts here."}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={() => onMarkAsRead?.(notification.id)}
                onMarkAsUnread={() => onMarkAsUnread?.(notification.id)}
                onDismiss={() => onDismiss?.(notification.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
