import { useEffect, useState } from 'react';
import { api } from '../../api/client';

interface User {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  profile?: { firstName: string; lastName: string; phone?: string };
}

export default function AdminUsers() {
  const [data, setData] = useState<{ items: User[]; total: number; page: number; pageSize: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (role) params.set('role', role);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    api.get<{ items: User[]; total: number; page: number; pageSize: number; totalPages: number }>(`/admin/users?${params.toString()}`).then((res) => {
      if (res.success && res.data) setData(res.data);
      setLoading(false);
    });
  }, [search, role, page, pageSize]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Users</h1>
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
          className="input-field max-w-xs"
        />
        <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className="input-field w-40">
          <option value="">All roles</option>
          <option value="CUSTOMER">Customer</option>
          <option value="ADMIN">Admin</option>
          <option value="AGENT">Agent</option>
        </select>
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
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Verified</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Joined</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((u) => (
                <tr key={u.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3 font-medium">{u.email}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${
                      u.role === 'ADMIN' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                      u.role === 'AGENT' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{u.emailVerified ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-slate-600 dark:text-slate-400">Total: {data.total}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm disabled:opacity-50">Previous</button>
            <span className="flex items-center px-2 text-slate-600 dark:text-slate-400">Page {page} of {data.totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="btn-secondary text-sm disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
