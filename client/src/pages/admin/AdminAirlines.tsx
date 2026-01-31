import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../../api/client';
import toast from 'react-hot-toast';

interface Airline {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
}

export default function AdminAirlines() {
  const [items, setItems] = useState<Airline[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Airline | null>(null);
  const [form, setForm] = useState({ name: '', code: '', logoUrl: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get<Airline[]>('/admin/airlines').then((res) => {
      if (res.success && res.data) setItems(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setForm({ name: '', code: '', logoUrl: '' });
    setEditing(null);
    setModal('add');
  };

  const openEdit = (a: Airline) => {
    setForm({ name: a.name, code: a.code, logoUrl: a.logoUrl ?? '' });
    setEditing(a);
    setModal('edit');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const req = modal === 'add'
      ? api.post('/admin/airlines', form)
      : editing ? api.put(`/admin/airlines/${editing.id}`, form) : Promise.resolve({ success: false });
    req.then((res) => {
      setSaving(false);
      if (res.success) {
        toast.success(modal === 'add' ? 'Airline added' : 'Airline updated');
        setModal(null);
        load();
      } else toast.error((res as any).error ?? 'Failed');
    });
  };

  const handleDelete = (a: Airline) => {
    if (!confirm(`Delete airline ${a.name}? This will fail if there are flights.`)) return;
    api.delete(`/admin/airlines/${a.id}`).then((res) => {
      if (res.success) {
        toast.success('Airline deleted');
        load();
      } else toast.error(res.error ?? 'Delete failed');
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Airlines</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Airline
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
                <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3 font-mono font-semibold">{a.code}</td>
                  <td className="px-4 py-3">{a.name}</td>
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
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{modal === 'add' ? 'Add Airline' : 'Edit Airline'}</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Code (IATA) *</label>
                <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase().slice(0, 5) }))} className="input-field" placeholder="e.g. AI" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Logo URL</label>
                <input value={form.logoUrl} onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))} className="input-field" placeholder="https://..." />
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
