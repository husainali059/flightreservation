import { useState } from 'react';
import { Outlet, Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
  LayoutDashboard,
  Plane,
  Building2,
  MapPin,
  Users,
  BookOpen,
  Tag,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
} from 'lucide-react';

const sidebarGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/admin/flights', label: 'Flights', icon: Plane },
      { to: '/admin/airlines', label: 'Airlines', icon: Building2 },
      { to: '/admin/aircraft', label: 'Aircraft', icon: Plane },
      { to: '/admin/airports', label: 'Airports', icon: MapPin },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/admin/bookings', label: 'Bookings', icon: BookOpen },
      { to: '/admin/users', label: 'Users', icon: Users },
      { to: '/admin/promos', label: 'Promo Codes', icon: Tag },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(Boolean).slice(1); // skip 'admin'
  const labels: Record<string, string> = {
    '': 'Dashboard',
    flights: 'Flights',
    airlines: 'Airlines',
    aircraft: 'Aircraft',
    airports: 'Airports',
    bookings: 'Bookings',
    users: 'Users',
    promos: 'Promo Codes',
    settings: 'Settings',
    new: 'Add New',
    edit: 'Edit',
  };
  return (
    <nav className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
      <Link to="/admin" className="hover:text-primary-600 dark:hover:text-primary-400">Admin</Link>
      {pathnames.map((name, i) => (
        <span key={name}>
          <span className="mx-1">/</span>
          {i === pathnames.length - 1 ? (
            <span className="font-medium text-slate-900 dark:text-white">{labels[name] ?? name}</span>
          ) : (
            <Link to={`/admin/${pathnames.slice(0, i + 1).join('/')}`} className="hover:text-primary-600 dark:hover:text-primary-400">
              {labels[name] ?? name}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

export default function AdminLayout({ children }: { children?: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 z-50 flex h-[calc(100vh-4rem)] flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 transition-all duration-200 lg:static lg:top-0 lg:z-0 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
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
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.to === '/admin'}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                            isActive
                              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                              : 'text-slate-700 hover:bg-primary-50 hover:text-primary-700 dark:text-slate-300 dark:hover:bg-primary-900/30 dark:hover:text-primary-400'
                          }`
                        }
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        {sidebarOpen && <span>{item.label}</span>}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen((o) => !o)}
          className="hidden lg:flex items-center justify-center border-t border-slate-200 py-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700"
        >
          {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Breadcrumbs />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user?.email}
            </span>
            <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900/50 dark:text-primary-300">
              {user?.role}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50 dark:bg-slate-900">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
