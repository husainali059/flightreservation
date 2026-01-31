import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';

interface Booking {
  id: string;
  pnr: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  user?: { email: string };
  passengers: { firstName: string; lastName: string }[];
  segments?: { flight: { airline: { code: string }; origin: { code: string }; destination: { code: string }; flightNumber: string }; departureDate: string }[];
  payments?: { status: string; amount: number }[];
}

export default function AdminBookings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') ?? '';
  const pnr = searchParams.get('pnr') ?? '';
  const [data, setData] = useState<{ items: Booking[]; total: number; page: number; pageSize: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [pnrInput, setPnrInput] = useState(pnr);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (pnr) params.set('pnr', pnr);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    api.get<{ items: Booking[]; total: number; page: number; pageSize: number; totalPages: number }>(`/admin/bookings?${params.toString()}`).then((res) => {
      if (res.success && res.data) setData(res.data);
      setLoading(false);
    });
  }, [status, pnr, page, pageSize]);

  const applyFilters = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (pnrInput.trim()) next.set('pnr', pnrInput.trim());
      else next.delete('pnr');
      if (status) next.set('status', status);
      else next.delete('status');
      next.delete('page');
      return next;
    });
    setPage(1);
  };

  const statusStyle = (s: string) => {
    if (s === 'CONFIRMED') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (s === 'PENDING') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    if (s === 'CANCELLED') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bookings</h1>
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <input
          type="text"
          placeholder="Search by PNR"
          value={pnrInput}
          onChange={(e) => setPnrInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          className="input-field w-40"
        />
        <select value={status} onChange={(e) => setSearchParams((p) => { const n = new URLSearchParams(p); e.target.value ? n.set('status', e.target.value) : n.delete('status'); n.delete('page'); return n; })} className="input-field w-40">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="CHECKED_IN">Checked In</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <button onClick={applyFilters} className="btn-primary">Apply</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">PNR</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Passenger(s)</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Route</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">User</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Amount</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Date</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((b) => (
                <tr key={b.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3 font-mono font-bold">{b.pnr}</td>
                  <td className="px-4 py-3">{b.passengers?.map((p) => `${p.firstName} ${p.lastName}`).join(', ') ?? '-'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {b.segments?.[0] ? `${b.segments[0].flight.airline.code}${b.segments[0].flight.flightNumber} · ${b.segments[0].flight.origin.code} → ${b.segments[0].flight.destination.code}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{b.user?.email ?? '-'}</td>
                  <td className="px-4 py-3 font-medium">${b.totalAmount?.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${statusStyle(b.status)}`}>{b.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(b.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-slate-600 dark:text-slate-400">Total: {data.total} · Page {data.page} of {data.totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm disabled:opacity-50">Previous</button>
            <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="btn-secondary text-sm disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
