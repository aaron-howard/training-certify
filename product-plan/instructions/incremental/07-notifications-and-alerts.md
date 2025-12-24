# Milestone 7: Notifications & Alerts

## Objective

Implement the Notifications & Alerts section, providing users with a centralized dashboard to view and manage certification-related notifications, configure alert preferences, and customize notification delivery.

## Overview

This section provides:
- Notification feed with filtering (all, unread, dismissed)
- Notification cards with actions (mark read/unread, dismiss)
- Settings panel for frequency and channel preferences

## Tasks

### 1. Review Section Specification

Read `sections/notifications-and-alerts/spec.md` and `sections/notifications-and-alerts/README.md` to understand requirements.

### 2. Review Sample Data and Types

- Check `sections/notifications-and-alerts/sample-data.json` for example data
- Review `sections/notifications-and-alerts/types.ts` for interfaces

### 3. Implement Components

Copy the components from `sections/notifications-and-alerts/components/`:

- `NotificationsDashboard.tsx` — Main dashboard with feed and filter tabs
- `NotificationCard.tsx` — Individual notification cards
- `NotificationSettings.tsx` — Settings panel for preferences

Place in `src/components/notifications/` or similar.

### 4. Update Import Paths

Update imports to reference your global data model:

```typescript
import type { Notification } from '@/types'
```

### 5. Wire Up to Routing

Add the component to your routes:

```typescript
import { NotificationsDashboard } from './components/notifications/NotificationsDashboard'

<Route
  path="/notifications"
  element={
    <NotificationsDashboard
      notifications={mockNotifications}
      settings={mockSettings}
      onMarkAsRead={(id) => handleMarkAsRead(id)}
      onMarkAsUnread={(id) => handleMarkAsUnread(id)}
      onDismiss={(id) => handleDismiss(id)}
      onUpdateFrequency={(freq) => handleUpdateFrequency(freq)}
      onUpdateChannels={(channels) => handleUpdateChannels(channels)}
      onUpdatePreferences={(prefs) => handleUpdatePreferences(prefs)}
    />
  }
/>
```

### 6. Implement Notification State Management

Wire up state for notifications:

```typescript
const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)

const handleMarkAsRead = (id: string) => {
  setNotifications(prev =>
    prev.map(notif =>
      notif.id === id ? { ...notif, isRead: true } : notif
    )
  )
}

const handleMarkAsUnread = (id: string) => {
  setNotifications(prev =>
    prev.map(notif =>
      notif.id === id ? { ...notif, isRead: false } : notif
    )
  )
}

const handleDismiss = (id: string) => {
  setNotifications(prev =>
    prev.map(notif =>
      notif.id === id ? { ...notif, isDismissed: true } : notif
    )
  )
}
```

### 7. Implement Settings Persistence

Save settings changes to backend or local storage:

```typescript
const handleUpdateFrequency = (frequency: NotificationFrequency) => {
  // Save to backend API
  await updateNotificationSettings({ frequency })

  // Or save to local storage
  localStorage.setItem('notificationFrequency', JSON.stringify(frequency))
}
```

### 8. Implement Real-time Notifications (Optional)

If implementing real-time notifications:

```typescript
// Example with WebSocket or polling
useEffect(() => {
  const interval = setInterval(async () => {
    const newNotifications = await fetchNotifications()
    setNotifications(newNotifications)
  }, 30000) // Poll every 30 seconds

  return () => clearInterval(interval)
}, [])
```

### 9. Add Notification Badge to Shell

Update the shell navigation to show unread count:

```typescript
// In MainNav or AppShell
const unreadCount = notifications.filter(n => !n.isRead && !n.isDismissed).length

<NavLink to="/notifications">
  Notifications
  {unreadCount > 0 && (
    <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
      {unreadCount}
    </span>
  )}
</NavLink>
```

### 10. Run Tests

Review `sections/notifications-and-alerts/tests.md`. Manually test:

- View all notifications in feed
- Filter by unread notifications
- Filter by dismissed notifications
- Mark notification as read
- Mark notification as unread
- Dismiss a notification
- Open settings panel
- Update notification frequency (alert intervals)
- Update notification channels (email, in-app, SMS)
- Update additional preferences
- Verify unread badge shows correct count

## Deliverables

- ✅ Notifications dashboard implemented
- ✅ Filtering (all, unread, dismissed) working
- ✅ Mark as read/unread actions functional
- ✅ Dismiss action working
- ✅ Settings panel implemented
- ✅ Frequency and channel settings persist
- ✅ Unread badge in navigation (optional)

## Acceptance Criteria

- [ ] Feed displays all notifications chronologically
- [ ] Filter tabs show correct counts
- [ ] Clicking "Unread" shows only unread notifications
- [ ] Clicking "Dismissed" shows dismissed notifications
- [ ] Mark as read changes notification appearance
- [ ] Dismiss removes notification from "All" view
- [ ] Settings panel opens when clicking Settings button
- [ ] Frequency settings allow customization of alert intervals
- [ ] Channel settings toggle email, in-app, SMS
- [ ] Settings changes are persisted
- [ ] Layout is responsive on all screen sizes

## Project Complete! 🎉

Congratulations! You've implemented all 7 milestones of Training-Certify:

1. ✅ Foundation — Project setup and design system
2. ✅ Application Shell — Navigation and layout
3. ✅ Certification Management — Core tracking
4. ✅ Team & Workforce Management — Competency dashboard
5. ✅ Compliance & Audit — Audit trail and reporting
6. ✅ Certification Catalog — Vendor directory
7. ✅ Notifications & Alerts — Notification center

## Next Steps

- Conduct end-to-end testing across all sections
- Implement backend API integration
- Set up authentication and user management
- Deploy to staging/production
- Gather user feedback and iterate
