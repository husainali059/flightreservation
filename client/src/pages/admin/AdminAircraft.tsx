import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../../api/client';
import toast from 'react-hot-toast';

interface Aircraft {
  id: string;
  model: string;
  manufacturer: string;
  totalSeats: number;
  economySeats: number;
  businessSeats: number;
  firstClassSeats: number;
}

export default function AdminAircraft() {
  const [items, setItems] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Aircraft | null>(null);
  const [form, setForm] = useState({ model: '', manufacturer: '', totalSeats: 180, economySeats: 162, businessSeats: 18, firstClassSeats: 0 });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get<Aircraft[]>('/admin/aircraft').then((res) => {
      if (res.success && res.data) setItems(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setForm({ model: '', manufacturer: '', totalSeats: 180, economySeats: 162, businessSeats: 18, firstClassSeats: 0 });
    setEditing(null);
    setModal('add');
  };

  const openEdit = (a: Aircraft) => {
    setForm({
      model: a.model,
      manufacturer: a.manufacturer,
      totalSeats: a.totalSeats,
      economySeats: a.economySeats,
      businessSeats: a.businessSeats,
      firstClassSeats: a.firstClassSeats ?? 0,
    });
    setEditing(a);
    setModal('edit');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, totalSeats: form.economySeats + form.businessSeats + form.firstClassSeats };
    const req = modal === 'add'
      ? api.post('/admin/aircraft', payload)
      : editing ? api.put(`/admin/aircraft/${editing.id}`, payload) : Promise.resolve({ success: false });
    req.then((res) => {
      setSaving(false);
      if (res.success) {
        toast.success(modal === 'add' ? 'Aircraft added' : 'Aircraft updated');
        setModal(null);
        load();
      } else toast.error((res as any).error ?? 'Failed');
    });
  };

  const handleDelete = (a: Aircraft) => {
    if (!confirm(`Delete aircraft ${a.model}? This will fail if there are flights.`)) return;
    api.delete(`/admin/aircraft/${a.id}`).then((res) => {
      if (res.success) {
        toast.success('Aircraft deleted');
        load();
      } else toast.error(res.error ?? 'Delete failed');
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Aircraft</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Aircraft
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        {loading ? (
          <div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Model</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Manufacturer</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Total Seats</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Economy / Business / First</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3 font-medium">{a.model}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{a.manufacturer}</td>
                  <td className="px-4 py-3">{a.totalSeats}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{a.economySeats} / {a.businessSeats} / {a.firstClassSeats ?? 0}</td>
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
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{modal === 'add' ? 'Add Aircraft' : 'Edit Aircraft'}</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Model *</label>
                <input value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} className="input-field" placeholder="e.g. Boeing 737-800" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Manufacturer *</label>
                <input value={form.manufacturer} onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))} className="input-field" placeholder="e.g. Boeing" required />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Economy</label>
                  <input type="number" min={0} value={form.economySeats} onChange={(e) => setForm((f) => ({ ...f, economySeats: parseInt(e.target.value, 10) || 0 }))} className="input-field" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Business</label>
                  <input type="number" min={0} value={form.businessSeats} onChange={(e) => setForm((f) => ({ ...f, businessSeats: parseInt(e.target.value, 10) || 0 }))} className="input-field" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">First</label>
                  <input type="number" min={0} value={form.firstClassSeats} onChange={(e) => setForm((f) => ({ ...f, firstClassSeats: parseInt(e.target.value, 10) || 0 }))} className="input-field" />
                </div>
              </div>
              <p className="text-xs text-slate-500">Total: {form.economySeats + form.businessSeats + form.firstClassSeats}</p>
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
