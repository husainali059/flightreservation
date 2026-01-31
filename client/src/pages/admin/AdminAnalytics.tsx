import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { api } from '../../api/client';

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: '#10b981',
  PENDING: '#f59e0b',
  CANCELLED: '#ef4444',
  CHECKED_IN: '#3b82f6',
  COMPLETED: '#8b5cf6',
};

const PAYMENT_COLORS: Record<string, string> = {
  SUCCEEDED: '#10b981',
  PENDING: '#f59e0b',
  FAILED: '#ef4444',
  REFUNDED: '#6b7280',
};

export default function AdminAnalytics() {
  const [data, setData] = useState<{
    metrics: {
      bookingsToday: number;
      bookingsWeek: number;
      bookingsMonth: number;
      totalBookings: number;
      revenueToday: number;
      revenueWeek: number;
      revenueMonth: number;
      totalRevenue: number;
      totalUsers: number;
      pendingRefunds: number;
      cancellationRate: number;
    };
    statusDistribution: { status: string; count: number }[];
    paymentDistribution: { status: string; count: number }[];
    recentBookings: any[];
    popularRoutes: { route: string; count: number }[];
    revenueByDay: { date: string; revenue: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>('/admin/analytics').then((res) => {
      if (res.success && res.data) setData(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 dark:border-primary-800 dark:border-t-primary-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
        Failed to load analytics.
      </div>
    );
  }

  const m = data.metrics;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics & Overview</h1>

      {/* Metrics cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Bookings (Today / Week / Month)</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {m.bookingsToday} / {m.bookingsWeek} / {m.bookingsMonth}
          </p>
          <p className="mt-1 text-xs text-slate-500">Total: {m.totalBookings}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Revenue</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            ${m.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Today: ${m.revenueToday.toFixed(0)} · Month: ${m.revenueMonth.toFixed(0)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Users</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{m.totalUsers}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cancellation Rate</p>
          <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{m.cancellationRate.toFixed(1)}%</p>
          <p className="mt-1 text-xs text-slate-500">Refunds: {m.pendingRefunds}</p>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Revenue (Last 7 Days)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-600" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v: number | undefined) => (v != null ? [`$${v.toFixed(2)}`, 'Revenue'] : null)} />
              <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status distribution */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Booking Status</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.statusDistribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry: { status?: string; name?: string; count?: number; value?: number }) => `${entry.status ?? entry.name}: ${entry.count ?? entry.value}`}
                >
                  {data.statusDistribution.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[_.status] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment distribution */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Payment Status</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.paymentDistribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry: { status?: string; name?: string; count?: number; value?: number }) => `${entry.status ?? entry.name}: ${entry.count ?? entry.value}`}
                >
                  {data.paymentDistribution.map((_, i) => (
                    <Cell key={i} fill={PAYMENT_COLORS[_.status] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Popular routes */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Popular Routes</h2>
          {data.popularRoutes.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400">No route data yet.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.popularRoutes} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-600" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="route" width={55} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent bookings */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Bookings</h2>
            <Link to="/admin/bookings" className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400">
              View all
            </Link>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {data.recentBookings.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400">No bookings yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-600">
                    <th className="py-2 text-left font-medium text-slate-600 dark:text-slate-400">PNR</th>
                    <th className="py-2 text-left font-medium text-slate-600 dark:text-slate-400">Passenger</th>
                    <th className="py-2 text-left font-medium text-slate-600 dark:text-slate-400">Amount</th>
                    <th className="py-2 text-left font-medium text-slate-600 dark:text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentBookings.map((b: any) => (
                    <tr key={b.id} className="border-b border-slate-100 dark:border-slate-700">
                      <td className="py-2 font-mono font-medium">
                        <Link to={`/admin/bookings?pnr=${b.pnr}`} className="text-primary-600 hover:underline dark:text-primary-400">
                          {b.pnr}
                        </Link>
                      </td>
                      <td className="py-2 text-slate-600 dark:text-slate-400">{b.passengerName}</td>
                      <td className="py-2 font-medium">${Number(b.totalAmount).toFixed(2)}</td>
                      <td className="py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          b.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          b.status === 'PENDING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
