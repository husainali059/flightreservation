import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { customerAPI } from '../../api/customerAPI';
import SearchForm from '../../components/SearchForm';
import type { BookingSummary, SearchHistoryItem, SavedRouteItem } from '../../types/customer';
import {
  Plane,
  Gift,
  BookOpen,
  User,
  Heart,
  History,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';

function Countdown({ date }: { date: string }) {
  const dep = new Date(date);
  const now = new Date();
  const diff = dep.getTime() - now.getTime();
  if (diff <= 0) return <span className="text-slate-500">Departed</span>;
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  return (
    <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
      {days}d {hours}h left
    </span>
  );
}

export default function DashboardHome() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [loyalty, setLoyalty] = useState<{ pointsBalance: number } | null>(null);
  const [recentSearches, setRecentSearches] = useState<SearchHistoryItem[]>([]);
  const [savedRoutes, setSavedRoutes] = useState<SavedRouteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      customerAPI.getBookings().then((r) => (r.success && r.data ? setBookings(Array.isArray(r.data) ? r.data : []) : null)),
      customerAPI.getLoyaltyPoints().then((r) => (r.success && r.data ? setLoyalty(r.data) : null)),
      customerAPI.getSearchHistory(5).then((r) => (r.success && r.data ? setRecentSearches(Array.isArray(r.data) ? r.data : []) : null)),
      customerAPI.getSavedRoutes().then((r) => (r.success && r.data ? setSavedRoutes(Array.isArray(r.data) ? r.data : []) : null)),
    ]).finally(() => setLoading(false));
  }, []);

  const upcomingBookings = bookings
    .filter((b) => b.status === 'CONFIRMED' || b.status === 'PENDING')
    .filter((b) => {
      const seg = b.segments?.[0];
      if (!seg) return false;
      return new Date(seg.departureDate) >= new Date();
    })
    .sort((a, b) => {
      const da = a.segments?.[0]?.departureDate ?? '';
      const db = b.segments?.[0]?.departureDate ?? '';
      return da.localeCompare(db);
    })
    .slice(0, 3);

  const firstName = user?.profile?.firstName ?? 'Guest';

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 dark:border-primary-800 dark:border-t-primary-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Search flights, manage bookings, and track your loyalty points.
        </p>
      </div>

      {/* Quick search */}
      <section className="card p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">
          Quick search
        </h2>
        <SearchForm redirectToSearch />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming trips */}
        <section className="card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Upcoming trips
            </h2>
            <Link
              to="/dashboard/bookings"
              className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
            >
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {upcomingBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Plane className="h-12 w-12 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-slate-600 dark:text-slate-400">No upcoming trips</p>
              <Link to="/search" className="btn-primary mt-3">
                Search flights
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {upcomingBookings.map((b) => {
                const seg = b.segments?.[0];
                return (
                  <li key={b.id}>
                    <Link
                      to={`/dashboard/bookings/${b.pnr}`}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-primary-300 hover:bg-primary-50/50 dark:border-slate-700 dark:hover:border-primary-700 dark:hover:bg-primary-900/10"
                    >
                      <div className="flex items-center gap-4">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-lg font-bold text-primary-600 dark:bg-primary-900/50 dark:text-primary-400">
                          {seg?.flight?.airline?.code ?? '—'}
                        </span>
                        <div>
                          <p className="font-mono font-semibold text-slate-900 dark:text-white">
                            {seg?.flight?.origin?.code} → {seg?.flight?.destination?.code}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {seg?.departureDate && new Date(seg.departureDate).toLocaleDateString()} ·{' '}
                            {seg?.flight?.departureTime} – {seg?.flight?.arrivalTime}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Countdown date={seg?.departureDate ? `${seg.departureDate}T${seg?.flight?.departureTime}` : ''} />
                        <div className="flex gap-2">
                          <Link
                            to={`/dashboard/bookings/${b.pnr}`}
                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                          >
                            View details
                          </Link>
                          {b.status === 'CONFIRMED' && (
                            <span className="rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                              Web check-in
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Loyalty & Quick links */}
        <aside className="space-y-6">
          <div className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200">
              <Gift className="h-5 w-5 text-primary-600" />
              Loyalty points
            </h2>
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {loyalty?.pointsBalance ?? 0}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">points available</p>
            <Link
              to="/dashboard/loyalty"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
            >
              View history <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">
              Quick links
            </h2>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/dashboard/bookings"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <BookOpen className="h-5 w-5 text-slate-500" />
                  My Bookings
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/profile"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <User className="h-5 w-5 text-slate-500" />
                  My Profile
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/wishlist"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <Heart className="h-5 w-5 text-slate-500" />
                  Saved Routes
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/help"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <HelpCircle className="h-5 w-5 text-slate-500" />
                  Support
                </Link>
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Recent searches */}
      <section className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200">
            <History className="h-5 w-5" />
            Recent searches
          </h2>
          {recentSearches.length > 0 && (
            <Link
              to="/dashboard/search-history"
              className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
            >
              View all
            </Link>
          )}
        </div>
        {recentSearches.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">No recent searches. Start by searching for flights.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() =>
                  navigate(
                    `/search?origin=${s.origin}&destination=${s.destination}&departureDate=${s.departureDate}&tripType=${s.tripType}&adults=${s.adults}&cabinClass=${s.cabinClass}`
                  )
                }
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary-300 hover:bg-primary-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-primary-700 dark:hover:bg-primary-900/20"
              >
                <span className="font-mono">{s.origin} → {s.destination}</span>
                <span className="text-slate-500">{s.departureDate}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Saved routes / deals */}
      {savedRoutes.length > 0 && (
        <section className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200">
            <Heart className="h-5 w-5 text-rose-500" />
            Saved routes
          </h2>
          <div className="flex flex-wrap gap-3">
            {savedRoutes.slice(0, 5).map((r) => (
              <Link
                key={r.id}
                to={`/search?origin=${r.origin}&destination=${r.destination}`}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-primary-300 hover:bg-primary-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-primary-700 dark:hover:bg-primary-900/20"
              >
                {r.origin} → {r.destination}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
