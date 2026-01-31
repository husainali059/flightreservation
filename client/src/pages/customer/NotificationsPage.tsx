import { useEffect, useState } from 'react';
import { customerAPI } from '../../api/customerAPI';
import type { UserNotification } from '../../types/customer';
import { Bell, Check, CheckCheck } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customerAPI.getNotifications({ limit: 50 }).then((r) => {
      if (r.success && r.data) {
        setNotifications(r.data.notifications ?? []);
        setUnreadCount(r.data.unreadCount ?? 0);
      }
      setLoading(false);
    });
  }, []);

  const markRead = (id: string) => {
    customerAPI.markNotificationRead(id).then(() => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    });
  };

  const markAllRead = () => {
    customerAPI.markAllNotificationsRead().then(() => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 dark:border-primary-800 dark:border-t-primary-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
          Notifications
        </h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Bell className="h-16 w-16 text-slate-300 dark:text-slate-600" />
          <p className="mt-4 text-slate-600 dark:text-slate-400">No notifications.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`card flex items-start justify-between gap-4 p-4 ${
                !n.read ? 'border-primary-200 bg-primary-50/50 dark:border-primary-800 dark:bg-primary-900/10' : ''
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900 dark:text-white">{n.title}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{n.message}</p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              {!n.read && (
                <button
                  type="button"
                  onClick={() => markRead(n.id)}
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <Check className="h-4 w-4" />
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
