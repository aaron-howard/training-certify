import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/tanstack-react-start'
import { useState } from 'react'
import { AlertTriangle, Bell, BellOff, Info, MoreHorizontal, Settings, X } from 'lucide-react'

const fetchNotifications = async () => {
    const res = await fetch('/api/notifications')
    if (!res.ok) return []
    return res.json()
}

const fetchSettings = async () => {
    const res = await fetch('/api/notification-settings')
    if (!res.ok) return { categories: [], userPreferences: {} }
    return res.json()
}

export const Route = createFileRoute('/notifications')({
    component: NotificationsPage,
})

function NotificationsPage() {
    const { user } = useUser()
    const queryClient = useQueryClient()
    const [showSettings, setShowSettings] = useState(false)
    const [preferences, setPreferences] = useState<Record<string, boolean>>({})

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: fetchNotifications,
    })

    const { data: settings } = useQuery({
        queryKey: ['notificationSettings'],
        queryFn: fetchSettings,
        onSuccess: (data: any) => {
            setPreferences(data.userPreferences || {})
        }
    })

    // Mark all as read mutation
    const markAllReadMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/notification-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'markAllRead', userId: user?.id })
            })
            return res.json()
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
    })

    // Dismiss notification mutation
    const dismissMutation = useMutation({
        mutationFn: async (notificationId: string) => {
            const res = await fetch('/api/notification-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'dismiss', notificationId })
            })
            return res.json()
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
    })

    // Save preferences mutation  
    const savePreferencesMutation = useMutation({
        mutationFn: async (prefs: Record<string, boolean>) => {
            const res = await fetch('/api/notification-settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.id, preferences: prefs })
            })
            return res.json()
        },
        onSuccess: () => {
            setShowSettings(false)
            alert('Preferences saved!')
        }
    })

    if (isLoading) return <div className="p-8">Loading notifications...</div>

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Notifications</h1>
                    <p className="text-slate-600 dark:text-slate-400">Stay updated on your certification status and team updates.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowSettings(true)}
                        className="px-3 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                    >
                        <Settings className="w-4 h-4" /> Settings
                    </button>
                    <button
                        onClick={() => markAllReadMutation.mutate()}
                        className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline"
                    >
                        Mark all as read
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-200 dark:divide-slate-800">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No notifications yet.</div>
                ) : (
                    notifications.map((notif: any) => (
                        <div key={notif.id} className={`p-6 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors ${!notif.read ? 'border-l-4 border-l-blue-600' : ''}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'alert' ? 'bg-red-50 text-red-600 dark:bg-red-950/30' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/30'}`}>
                                {notif.type === 'alert' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`font-semibold ${!notif.read ? 'text-slate-900 dark:text-slate-50' : 'text-slate-600 dark:text-slate-400'}`}>
                                        {notif.title}
                                    </h3>
                                    <span className="text-xs text-slate-400">{notif.date}</span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">{notif.message}</p>
                                <div className="flex gap-4">
                                    <button className="text-xs font-bold text-blue-600 hover:underline uppercase tracking-wider">View Link</button>
                                    {!notif.read && (
                                        <button
                                            onClick={() => dismissMutation.mutate(notif.id)}
                                            className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider"
                                        >
                                            Dismiss
                                        </button>
                                    )}
                                </div>
                            </div>
                            <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                                <MoreHorizontal className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Notification Settings</h2>
                            <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Categories</h3>
                            {settings?.categories?.map((cat: any) => (
                                <div key={cat.id} className="flex items-center justify-between py-2">
                                    <div>
                                        <div className="font-medium text-slate-900 dark:text-slate-100">{cat.name}</div>
                                        <div className="text-xs text-slate-500">{cat.description}</div>
                                    </div>
                                    <button
                                        onClick={() => setPreferences({ ...preferences, [cat.id]: !preferences[cat.id] })}
                                        className={`p-2 rounded-lg transition-colors ${preferences[cat.id] !== false ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}
                                    >
                                        {preferences[cat.id] !== false ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                                    </button>
                                </div>
                            ))}
                            <hr className="border-slate-200 dark:border-slate-800" />
                            <div className="flex items-center justify-between py-2">
                                <div>
                                    <div className="font-medium text-slate-900 dark:text-slate-100">Email Notifications</div>
                                    <div className="text-xs text-slate-500">Receive notifications via email</div>
                                </div>
                                <button
                                    onClick={() => setPreferences({ ...preferences, emailEnabled: !preferences.emailEnabled })}
                                    className={`p-2 rounded-lg transition-colors ${preferences.emailEnabled !== false ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}
                                >
                                    {preferences.emailEnabled !== false ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                                </button>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => savePreferencesMutation.mutate(preferences)}
                                    disabled={savePreferencesMutation.isPending}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {savePreferencesMutation.isPending ? 'Saving...' : 'Save Preferences'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
