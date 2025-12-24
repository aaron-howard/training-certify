import type {
  NotificationSettings as Settings,
  NotificationFrequency,
  NotificationChannels,
  NotificationPreferences,
} from '@/../product/sections/notifications-and-alerts/types'
import { useState } from 'react'
import { X, Bell, Mail, Smartphone, Calendar } from 'lucide-react'

interface NotificationSettingsProps {
  settings: Settings
  onUpdateFrequency?: (frequency: NotificationFrequency) => void
  onUpdateChannels?: (channels: NotificationChannels) => void
  onUpdatePreferences?: (preferences: NotificationPreferences) => void
  onClose?: () => void
}

export function NotificationSettings({
  settings,
  onUpdateFrequency,
  onUpdateChannels,
  onUpdatePreferences,
  onClose,
}: NotificationSettingsProps) {
  const [frequency, setFrequency] = useState(settings.frequency)
  const [channels, setChannels] = useState(settings.channels)
  const [preferences, setPreferences] = useState(settings.preferences)

  const handleFrequencyChange = (field: keyof NotificationFrequency, value: number) => {
    const updated = { ...frequency, [field]: value }
    setFrequency(updated)
    onUpdateFrequency?.(updated)
  }

  const handleChannelToggle = (channel: keyof NotificationChannels) => {
    const updated = { ...channels, [channel]: !channels[channel] }
    setChannels(updated)
    onUpdateChannels?.(updated)
  }

  const handlePreferenceToggle = (pref: keyof NotificationPreferences) => {
    if (pref === 'digestFrequency') return
    const updated = { ...preferences, [pref]: !preferences[pref as 'teamAlerts' | 'complianceWarnings' | 'digestEnabled'] }
    setPreferences(updated)
    onUpdatePreferences?.(updated)
  }

  return (
    <div className="mb-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Notification Settings</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Frequency Settings */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Notification Frequency
            </h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Set when you want to be notified before certifications expire (in days)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'First Alert', key: 'firstAlert' as const },
              { label: 'Second Alert', key: 'secondAlert' as const },
              { label: 'Third Alert', key: 'thirdAlert' as const },
              { label: 'Final Alert', key: 'finalAlert' as const },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {label}
                </label>
                <input
                  type="number"
                  value={frequency[key]}
                  onChange={(e) => handleFrequencyChange(key, parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  min="1"
                  max="365"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">days before expiration</p>
              </div>
            ))}
          </div>
        </div>

        {/* Channel Preferences */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Notification Channels
            </h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Choose how you want to receive notifications
          </p>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={channels.inApp}
                onChange={() => handleChannelToggle('inApp')}
                className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 rounded"
              />
              <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <div className="flex-1">
                <div className="font-medium text-slate-900 dark:text-slate-100">In-App Notifications</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Show notifications within the application</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={channels.email}
                onChange={() => handleChannelToggle('email')}
                className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 rounded"
              />
              <Mail className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <div className="flex-1">
                <div className="font-medium text-slate-900 dark:text-slate-100">Email Notifications</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Receive alerts via email</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={channels.sms}
                onChange={() => handleChannelToggle('sms')}
                className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 rounded"
              />
              <Smartphone className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <div className="flex-1">
                <div className="font-medium text-slate-900 dark:text-slate-100">SMS Notifications</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Get text messages for critical alerts</div>
              </div>
            </label>
          </div>
        </div>

        {/* Additional Preferences */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Additional Preferences
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={preferences.teamAlerts}
                onChange={() => handlePreferenceToggle('teamAlerts')}
                className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 rounded"
              />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Receive team member certification alerts
              </span>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={preferences.complianceWarnings}
                onChange={() => handlePreferenceToggle('complianceWarnings')}
                className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 rounded"
              />
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Receive compliance threshold warnings
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
