import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../../api/client';
import toast from 'react-hot-toast';

interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
}

export default function AdminAirports() {
  const [items, setItems] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Airport | null>(null);
  const [form, setForm] = useState({ code: '', name: '', city: '', country: '', timezone: 'UTC' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get<Airport[]>('/admin/airports').then((res) => {
      if (res.success && res.data) setItems(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setForm({ code: '', name: '', city: '', country: '', timezone: 'UTC' });
    setEditing(null);
    setModal('add');
  };

  const openEdit = (a: Airport) => {
    setForm({ code: a.code, name: a.name, city: a.city, country: a.country, timezone: a.timezone ?? 'UTC' });
    setEditing(a);
    setModal('edit');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, code: form.code.toUpperCase().slice(0, 3) };
    const req = modal === 'add'
      ? api.post('/admin/airports', payload)
      : editing ? api.put(`/admin/airports/${editing.code}`, { name: form.name, city: form.city, country: form.country, timezone: form.timezone }) : Promise.resolve({ success: false });
    req.then((res) => {
      setSaving(false);
      if (res.success) {
        toast.success(modal === 'add' ? 'Airport added' : 'Airport updated');
        setModal(null);
        load();
      } else toast.error((res as any).error ?? 'Failed');
    });
  };

  const handleDelete = (a: Airport) => {
    if (!confirm(`Delete airport ${a.code}? This will fail if there are flights.`)) return;
    api.delete(`/admin/airports/${a.code}`).then((res) => {
      if (res.success) {
        toast.success('Airport deleted');
        load();
      } else toast.error(res.error ?? 'Delete failed');
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Airports</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Airport
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        {loading ? (
          <div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Code</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">City</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Country</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.code} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3 font-mono font-semibold">{a.code}</td>
                  <td className="px-4 py-3">{a.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{a.city}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{a.country}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(a)} className="rounded p-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-600"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(a)} className="rounded p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{modal === 'add' ? 'Add Airport' : 'Edit Airport'}</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">IATA Code (3 letters) *</label>
                <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase().slice(0, 3) }))} className="input-field" placeholder="e.g. DEL" required disabled={modal === 'edit'} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">City *</label>
                <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Country *</label>
                <input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Timezone</label>
                <input value={form.timezone} onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))} className="input-field" placeholder="e.g. Asia/Kolkata" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
                <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
