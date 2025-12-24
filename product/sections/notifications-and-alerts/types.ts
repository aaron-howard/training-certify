// =============================================================================
// Data Types
// =============================================================================

export interface Notification {
  id: string
  userId: string
  userName: string
  type: 'expiration-alert' | 'renewal-reminder' | 'team-member-alert' | 'compliance-warning'
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  timestamp: string
  isRead: boolean
  isDismissed: boolean
  // Optional fields for certification-related notifications
  certificationName?: string
  certificationId?: string
  userCertificationId?: string
  expirationDate?: string
  daysUntilExpiration?: number
  // Optional fields for team-related notifications
  teamMemberName?: string
  teamName?: string
  expiringCount?: number
  complianceRate?: number
}

export interface NotificationFrequency {
  firstAlert: number
  secondAlert: number
  thirdAlert: number
  finalAlert: number
}

export interface NotificationChannels {
  inApp: boolean
  email: boolean
  sms: boolean
}

export interface NotificationPreferences {
  teamAlerts: boolean
  complianceWarnings: boolean
  digestEnabled: boolean
  digestFrequency: 'daily' | 'weekly' | 'monthly'
}

export interface NotificationSettings {
  userId: string
  frequency: NotificationFrequency
  channels: NotificationChannels
  preferences: NotificationPreferences
}

// =============================================================================
// Component Props
// =============================================================================

export interface NotificationsAlertsProps {
  /** The list of notifications to display */
  notifications: Notification[]
  /** User's notification settings and preferences */
  settings: NotificationSettings
  /** Called when user marks a notification as read */
  onMarkAsRead?: (notificationId: string) => void
  /** Called when user marks a notification as unread */
  onMarkAsUnread?: (notificationId: string) => void
  /** Called when user dismisses/archives a notification */
  onDismiss?: (notificationId: string) => void
  /** Called when user applies filter (all, unread, dismissed) */
  onFilter?: (filter: 'all' | 'unread' | 'dismissed') => void
  /** Called when user updates notification frequency settings */
  onUpdateFrequency?: (frequency: NotificationFrequency) => void
  /** Called when user updates notification channel preferences */
  onUpdateChannels?: (channels: NotificationChannels) => void
  /** Called when user updates general notification preferences */
  onUpdatePreferences?: (preferences: NotificationPreferences) => void
}
