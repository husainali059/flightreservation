import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../../api/client';
import toast from 'react-hot-toast';

interface Promo {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number | null;
  usedCount: number;
  minBookingAmount: number | null;
}

export default function AdminPromos() {
  const [items, setItems] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Promo | null>(null);
  const [form, setForm] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    validFrom: new Date().toISOString().slice(0, 16),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    usageLimit: 100,
    minBookingAmount: 100,
  });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get<Promo[]>('/admin/promos').then((res) => {
      if (res.success && res.data) setItems(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setForm({
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      validFrom: new Date().toISOString().slice(0, 16),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      usageLimit: 100,
      minBookingAmount: 100,
    });
    setEditing(null);
    setModal('add');
  };

  const openEdit = (p: Promo) => {
    setForm({
      code: p.code,
      discountType: p.discountType,
      discountValue: p.discountValue,
      validFrom: new Date(p.validFrom).toISOString().slice(0, 16),
      validUntil: new Date(p.validUntil).toISOString().slice(0, 16),
      usageLimit: p.usageLimit ?? 0,
      minBookingAmount: p.minBookingAmount ?? 0,
    });
    setEditing(p);
    setModal('edit');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      code: form.code.toUpperCase(),
      discountType: form.discountType,
      discountValue: form.discountValue,
      validFrom: new Date(form.validFrom).toISOString(),
      validUntil: new Date(form.validUntil).toISOString(),
      usageLimit: form.usageLimit || null,
      minBookingAmount: form.minBookingAmount || null,
    };
    const req = modal === 'add'
      ? api.post('/admin/promos', payload)
      : editing ? api.put(`/admin/promos/${editing.id}`, payload) : Promise.resolve({ success: false });
    req.then((res) => {
      setSaving(false);
      if (res.success) {
        toast.success(modal === 'add' ? 'Promo code created' : 'Promo code updated');
        setModal(null);
        load();
      } else toast.error((res as any).error ?? 'Failed');
    });
  };

  const handleDelete = (p: Promo) => {
    if (!confirm(`Delete promo code ${p.code}?`)) return;
    api.delete(`/admin/promos/${p.id}`).then((res) => {
      if (res.success) {
        toast.success('Promo code deleted');
        load();
      } else toast.error(res.error ?? 'Delete failed');
    });
  };

  const isActive = (p: Promo) => {
    const now = new Date();
    return now >= new Date(p.validFrom) && now <= new Date(p.validUntil) && (p.usageLimit == null || p.usedCount < p.usageLimit);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Promo Codes</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Create Promo
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
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Value</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Valid</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Usage</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3 font-mono font-bold">{p.code}</td>
                  <td className="px-4 py-3">{p.discountType}</td>
                  <td className="px-4 py-3">{p.discountType === 'PERCENTAGE' ? `${p.discountValue}%` : `$${p.discountValue}`}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {new Date(p.validFrom).toLocaleDateString()} – {new Date(p.validUntil).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">{p.usedCount}{p.usageLimit != null ? ` / ${p.usageLimit}` : ''}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${isActive(p) ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                      {isActive(p) ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(p)} className="rounded p-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-600"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(p)} className="rounded p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"><Trash2 className="h-4 w-4" /></button>
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
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{modal === 'add' ? 'Create Promo Code' : 'Edit Promo Code'}</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Code *</label>
                <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} className="input-field" placeholder="e.g. WELCOME10" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
                  <select value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))} className="input-field">
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Value *</label>
                  <input type="number" min={0} step={form.discountType === 'PERCENTAGE' ? 1 : 0.01} value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: parseFloat(e.target.value) || 0 }))} className="input-field" required />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Valid From</label>
                <input type="datetime-local" value={form.validFrom} onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Valid Until</label>
                <input type="datetime-local" value={form.validUntil} onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))} className="input-field" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Usage Limit (0 = unlimited)</label>
                  <input type="number" min={0} value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: parseInt(e.target.value, 10) || 0 }))} className="input-field" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Min Booking ($)</label>
                  <input type="number" min={0} value={form.minBookingAmount} onChange={(e) => setForm((f) => ({ ...f, minBookingAmount: parseFloat(e.target.value) || 0 }))} className="input-field" />
                </div>
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
