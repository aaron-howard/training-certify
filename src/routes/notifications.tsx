import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getNotifications } from '../api/others'
import { Info, AlertTriangle, MoreHorizontal } from 'lucide-react'

export const Route = createFileRoute('/notifications')({
    component: NotificationsPage,
    loader: async ({ context }) => {
        const { queryClient } = context as any
        await queryClient.ensureQueryData({
            queryKey: ['notifications'],
            queryFn: async () => {
                const res = await getNotifications()
                return res || []
            },
        })
    },
})

function NotificationsPage() {
    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await getNotifications()
            return res || []
        },
    })

    if (isLoading) return <div className="p-8">Loading notifications...</div>

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Notifications</h1>
                    <p className="text-slate-600 dark:text-slate-400">Stay updated on your certification status and team updates.</p>
                </div>
                <button className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">Mark all as read</button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-200 dark:divide-slate-800">
                {notifications.map((notif) => (
                    <div key={notif.id} className={`p-6 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors ${!notif.read ? 'border-l-4 border-l-blue-600' : ''}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.type === 'alert' ? 'bg-red-50 text-red-600 dark:bg-red-950/30' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/30'
                            }`}>
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
                                {!notif.read && <button className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider">Dismiss</button>}
                            </div>
                        </div>
                        <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                            <MoreHorizontal className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
