import type { Notification } from '@/../product/sections/notifications-and-alerts/types'
import {
  AlertTriangle,
  Bell,
  Users,
  Shield,
  Mail,
  MailOpen,
  X,
  Clock
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface NotificationCardProps {
  notification: Notification
  onMarkAsRead?: () => void
  onMarkAsUnread?: () => void
  onDismiss?: () => void
}

export function NotificationCard({
  notification,
  onMarkAsRead,
  onMarkAsUnread,
  onDismiss,
}: NotificationCardProps) {
  const getTypeIcon = (type: string) => {
    const icons = {
      'expiration-alert': AlertTriangle,
      'renewal-reminder': Bell,
      'team-member-alert': Users,
      'compliance-warning': Shield,
    }
    const Icon = icons[type as keyof typeof icons] || Bell
    return Icon
  }

  const getTypeColor = (type: string) => {
    const colors = {
      'expiration-alert': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
      'renewal-reminder': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      'team-member-alert': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
      'compliance-warning': 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
    }
    return colors[type as keyof typeof colors] || colors['renewal-reminder']
  }

  const getSeverityBadge = (severity: string) => {
    const badges = {
      critical: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    }
    return badges[severity as keyof typeof badges] || badges.info
  }

  const Icon = getTypeIcon(notification.type)
  const typeColor = getTypeColor(notification.type)

  return (
    <div
      className={`relative bg-white dark:bg-slate-900 border rounded-xl overflow-hidden transition-all hover:shadow-lg ${
        notification.isRead
          ? 'border-slate-200 dark:border-slate-800'
          : 'border-blue-300 dark:border-blue-700 shadow-md shadow-blue-500/10'
      }`}
    >
      {/* Unread Indicator */}
      {!notification.isRead && (
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
      )}

      <div className="p-5 pl-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`flex-shrink-0 p-2.5 rounded-lg ${typeColor}`}>
            <Icon className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <h3 className={`font-semibold mb-1 ${
                  notification.isRead
                    ? 'text-slate-700 dark:text-slate-300'
                    : 'text-slate-900 dark:text-slate-100'
                }`}>
                  {notification.title}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getSeverityBadge(notification.severity)}`}>
                    {notification.severity}
                  </span>
                  {notification.daysUntilExpiration !== undefined && (
                    <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Clock className="w-3 h-3" />
                      {notification.daysUntilExpiration} days
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {notification.isRead ? (
                  <button
                    onClick={onMarkAsUnread}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Mark as unread"
                  >
                    <Mail className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </button>
                ) : (
                  <button
                    onClick={onMarkAsRead}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Mark as read"
                  >
                    <MailOpen className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </button>
                )}
                <button
                  onClick={onDismiss}
                  className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
                  title="Dismiss"
                >
                  <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              {notification.description}
            </p>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span>
                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
              </span>
              {notification.certificationName && (
                <>
                  <span>•</span>
                  <span className="font-medium">{notification.certificationName}</span>
                </>
              )}
              {notification.teamName && (
                <>
                  <span>•</span>
                  <span className="font-medium">{notification.teamName}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
