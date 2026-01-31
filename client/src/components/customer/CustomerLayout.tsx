import { useState, useEffect } from 'react';
import { Outlet, Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { customerAPI } from '../../api/customerAPI';
import {
  LayoutDashboard,
  Search,
  BookOpen,
  User,
  Gift,
  Heart,
  History,
  Bell,
  HelpCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Plane,
} from 'lucide-react';
import clsx from 'clsx';

const sidebarGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/search', label: 'Search Flights', icon: Search },
    ],
  },
  {
    label: 'Bookings',
    items: [
      { to: '/dashboard/bookings', label: 'My Bookings', icon: BookOpen },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/dashboard/profile', label: 'My Profile', icon: User },
      { to: '/dashboard/loyalty', label: 'Loyalty & Rewards', icon: Gift },
      { to: '/dashboard/wishlist', label: 'Saved Routes', icon: Heart },
      { to: '/dashboard/search-history', label: 'Search History', icon: History },
    ],
  },
  {
    label: 'Support',
    items: [
      { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
      { to: '/dashboard/help', label: 'Help & Support', icon: HelpCircle },
      { to: '/dashboard/settings', label: 'Settings', icon: Settings },
    ],
  },
];

function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  const pathnames = segments[0] === 'dashboard' ? segments.slice(1) : segments;
  const labels: Record<string, string> = {
    dashboard: 'Dashboard',
    search: 'Search Flights',
    bookings: 'My Bookings',
    profile: 'My Profile',
    loyalty: 'Loyalty & Rewards',
    wishlist: 'Saved Routes',
    'search-history': 'Search History',
    notifications: 'Notifications',
    help: 'Help & Support',
    settings: 'Settings',
    checkout: 'Checkout',
  };
  return (
    <nav className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
      <Link to="/dashboard" className="hover:text-primary-600 dark:hover:text-primary-400">
        Home
      </Link>
      {pathnames.length > 0 && <span className="mx-1">/</span>}
      {pathnames.map((name, i) => (
        <span key={name}>
          {i > 0 && <span className="mx-1">/</span>}
          {i === pathnames.length - 1 ? (
            <span className="font-medium text-slate-900 dark:text-white">
              {labels[name] ?? name.replace(/-/g, ' ')}
            </span>
          ) : (
            <Link
              to={`/dashboard/${pathnames.slice(0, i + 1).join('/')}`}
              className="hover:text-primary-600 dark:hover:text-primary-400"
            >
              {labels[name] ?? name.replace(/-/g, ' ')}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export default function CustomerLayout({ children }: { children?: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; read: boolean; createdAt: string }[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    customerAPI.getNotifications({ limit: 10 }).then((res) => {
      if (res.success && res.data) {
        setNotifications(res.data.notifications ?? []);
        setUnreadCount(res.data.unreadCount ?? 0);
      }
    });
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleMarkRead = (id: string) => {
    customerAPI.markNotificationRead(id).then(() => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={clsx(
          'fixed left-0 top-16 z-50 flex h-[calc(100vh-4rem)] flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 transition-all duration-200 lg:static lg:top-0 lg:z-0',
          sidebarOpen ? 'w-64' : 'w-20',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-1 flex-col overflow-y-auto py-4">
          {sidebarGroups.map((group) => (
            <div key={group.label} className="mb-4">
              {sidebarOpen && (
                <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5 px-2">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/dashboard' || item.to === '/dashboard/'}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                          isActive
                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                        )
                      }
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {sidebarOpen && <span>{item.label}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 p-2 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            {sidebarOpen && <span className="text-sm">Collapse</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="sticky top-16 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-700 dark:bg-slate-800/95 lg:top-0">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Breadcrumbs />
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/search"
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              <Plane className="h-4 w-4" />
              Search Flights
            </Link>
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((o) => !o)}
                className="relative rounded-xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    aria-hidden
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-20 mt-1 w-80 rounded-xl border border-slate-200 bg-white py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-center justify-between px-4 py-2">
                      <span className="font-semibold text-slate-900 dark:text-white">Notifications</span>
                      <Link
                        to="/notifications"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-sm text-primary-600 hover:underline dark:text-primary-400"
                      >
                        View all
                      </Link>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-slate-500">No notifications</p>
                      ) : (
                        notifications.slice(0, 5).map((n) => (
                          <div
                            key={n.id}
                            className={clsx(
                              'border-b border-slate-100 px-4 py-3 last:border-0 dark:border-slate-700',
                              !n.read && 'bg-primary-50/50 dark:bg-primary-900/10'
                            )}
                          >
                            <p className="font-medium text-slate-900 dark:text-white">{n.title}</p>
                            <p className="mt-0.5 truncate text-sm text-slate-600 dark:text-slate-400">{n.message}</p>
                            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                              <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                              {!n.read && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkRead(n.id)}
                                  className="text-primary-600 hover:underline dark:text-primary-400"
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4 dark:border-slate-700">
              <span className="hidden text-sm text-slate-600 dark:text-slate-400 sm:inline">
                {user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user?.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </header>
        <div className="p-4 lg:p-6">
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  );
}
