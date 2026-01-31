import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function Header() {
  const { user, accessToken, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary-600 dark:text-primary-400"
        >
          <span className="text-2xl">✈</span>
          FlightReserve
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/search"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-primary-50 hover:text-primary-700 dark:text-slate-300 dark:hover:bg-primary-900/30 dark:hover:text-primary-400"
          >
            Search Flights
          </Link>
          {accessToken ? (
            <>
              {user?.role === 'CUSTOMER' && (
                <Link
                  to="/dashboard"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-primary-50 hover:text-primary-700 dark:text-slate-300 dark:hover:bg-primary-900/30 dark:hover:text-primary-400"
                >
                  Dashboard
                </Link>
              )}
              <Link
                to={user?.role === 'CUSTOMER' ? '/dashboard/bookings' : '/bookings'}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-primary-50 hover:text-primary-700 dark:text-slate-300 dark:hover:bg-primary-900/30 dark:hover:text-primary-400"
              >
                My Bookings
              </Link>
              <Link
                to={user?.role === 'CUSTOMER' ? '/dashboard/profile' : '/profile'}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-primary-50 hover:text-primary-700 dark:text-slate-300 dark:hover:bg-primary-900/30 dark:hover:text-primary-400"
              >
                {user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user?.email}
              </Link>
              {(user?.role === 'ADMIN' || user?.role === 'AGENT') && (
                <Link
                  to="/admin"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-amber-600 transition hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="btn-secondary text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary text-sm">
                Login
              </Link>
              <Link to="/register" className="btn-primary text-sm">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
