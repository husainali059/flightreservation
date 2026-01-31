import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

interface Booking {
  id: string;
  pnr: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  passengers: { firstName: string; lastName: string }[];
  segments?: { flight: { airline: { code: string }; origin: { code: string }; destination: { code: string } }; departureDate: string }[];
}

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    const q = filter ? `?status=${filter}` : '';
    api.get<Booking[]>(`/bookings${q}`).then((res) => {
      if (res.success && res.data) setBookings(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    });
  }, [filter]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString();

  const statusStyle = (s: string) => {
    if (s === 'CONFIRMED') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (s === 'PENDING') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    if (s === 'CANCELLED') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">My Bookings</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {['', 'CONFIRMED', 'PENDING', 'CANCELLED', 'CHECKED_IN'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setFilter(s)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              filter === s
                ? 'bg-primary-600 text-white dark:bg-primary-500'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>
      {loading && (
        <div className="mt-10 flex justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 dark:border-primary-800 dark:border-t-primary-400" />
        </div>
      )}
      {!loading && bookings.length === 0 && (
        <div className="card mt-6 p-8 text-center">
          <p className="text-slate-600 dark:text-slate-400">No bookings yet.</p>
          <Link to="/search" className="mt-4 inline-block font-medium text-primary-600 hover:underline dark:text-primary-400">
            Search flights
          </Link>
        </div>
      )}
      {!loading && bookings.length > 0 && (
        <div className="mt-6 space-y-4">
          {bookings.map((b) => (
            <Link key={b.id} to={`/bookings/${b.pnr}`} className="card card-hover block p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="font-mono text-lg font-bold text-slate-900 dark:text-white">{b.pnr}</span>
                  <span className={`ml-3 rounded-lg px-2.5 py-0.5 text-xs font-semibold ${statusStyle(b.status)}`}>
                    {b.status}
                  </span>
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  {b.segments?.[0] && (
                    <span>{b.segments[0].flight.airline.code} · {b.segments[0].flight.origin.code} → {b.segments[0].flight.destination.code}</span>
                  )}
                  {b.passengers?.length > 0 && (
                    <span className="ml-2">· {b.passengers.length} passenger(s)</span>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900 dark:text-white">${b.totalAmount.toFixed(2)}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{formatDate(b.createdAt)}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
