import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '../../api/client';
import toast from 'react-hot-toast';

interface Flight {
  id: string;
  flightNumber: string;
  airline: { id: string; name: string; code: string };
  origin: { code: string; city: string };
  destination: { code: string; city: string };
  aircraft: { model: string };
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  daysOfOperation: string;
}

function FlightList() {
  const [items, setItems] = useState<Flight[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    api.get<{ items: Flight[]; total: number }>(`/admin/flights?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`).then((res) => {
      if (res.success && res.data) {
        setItems(res.data.items ?? []);
        setTotal(res.data.total ?? 0);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, [page, search]);

  const handleDelete = (id: string, flightNumber: string) => {
    if (!confirm(`Delete flight ${flightNumber}? This will fail if there are existing bookings.`)) return;
    api.delete(`/admin/flights/${id}`).then((res) => {
      if (res.success) {
        toast.success('Flight deleted');
        load();
      } else toast.error(res.error ?? 'Delete failed');
    });
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Flights</h1>
        <Link to="new" className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Flight
        </Link>
      </div>
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by flight number, route, airline..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field max-w-xs"
        />
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
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Flight</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Route</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Times</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Aircraft</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Days</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((f) => (
                <tr key={f.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3">
                    <span className="font-semibold">{f.airline?.code}{f.flightNumber}</span>
                    <span className="ml-2 text-slate-500 dark:text-slate-400">{f.airline?.name}</span>
                  </td>
                  <td className="px-4 py-3 font-mono">{f.origin?.code} → {f.destination?.code}</td>
                  <td className="px-4 py-3">{f.departureTime} – {f.arrivalTime}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{f.aircraft?.model}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{f.daysOfOperation}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => navigate(`edit/${f.id}`)} className="rounded p-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-600">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(f.id, f.airline?.code + f.flightNumber)} className="rounded p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-slate-600 dark:text-slate-400">Total: {total}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm disabled:opacity-50">Previous</button>
            <span className="flex items-center px-2 text-slate-600 dark:text-slate-400">Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-sm disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

function FlightForm() {
  const { id: flightId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [airlines, setAirlines] = useState<{ id: string; name: string; code: string }[]>([]);
  const [aircraft, setAircraft] = useState<{ id: string; model: string; totalSeats: number }[]>([]);
  const [airports, setAirports] = useState<{ code: string; name: string; city: string }[]>([]);
  const [loading, setLoading] = useState(!!flightId);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    airlineId: '',
    flightNumber: '',
    originId: '',
    destinationId: '',
    aircraftId: '',
    departureTime: '08:00',
    arrivalTime: '09:30',
    durationMinutes: 90,
    daysOfOperation: '0,1,2,3,4,5,6',
  });

  useEffect(() => {
    api.get<{ id: string; name: string; code: string }[]>('/admin/airlines').then((r) => r.success && r.data && setAirlines(Array.isArray(r.data) ? r.data : []));
    api.get<{ id: string; model: string; totalSeats: number }[]>('/admin/aircraft').then((r) => r.success && r.data && setAircraft(Array.isArray(r.data) ? r.data : []));
    api.get<{ code: string; name: string; city: string; country: string }[]>('/airports').then((r) => r.success && r.data && setAirports(Array.isArray(r.data) ? r.data : []));
  }, []);

  useEffect(() => {
    if (!flightId) return;
    api.get<any>(`/admin/flights/${flightId}`).then((res) => {
      if (res.success && res.data) {
        const f = res.data;
        setForm({
          airlineId: f.airlineId ?? f.airline?.id ?? '',
          flightNumber: f.flightNumber ?? '',
          originId: f.originId ?? f.origin?.city ?? '',
          destinationId: f.destinationId ?? f.destination?.city ?? '',
          aircraftId: f.aircraftId ?? f.aircraft?.id ?? '',
          departureTime: f.departureTime ?? '08:00',
          arrivalTime: f.arrivalTime ?? '09:30',
          durationMinutes: f.durationMinutes ?? 90,
          daysOfOperation: f.daysOfOperation ?? '0,1,2,3,4,5,6',
        });
      }
      setLoading(false);
    });
  }, [flightId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Convert city names to airport codes
    const originAirport = airports.find(a => a.city === form.originId);
    const destAirport = airports.find(a => a.city === form.destinationId);
    
    if (!originAirport) {
      alert(`Origin city not found: ${form.originId}`);
      setSaving(false);
      return;
    }
    if (!destAirport) {
      alert(`Destination city not found: ${form.destinationId}`);
      setSaving(false);
      return;
    }
    
    const payload = { ...form, originId: originAirport.code, destinationId: destAirport.code };
    const req = flightId ? api.put(`/admin/flights/${flightId}`, payload) : api.post('/admin/flights', payload);
    req.then((res) => {
      setSaving(false);
      if (res.success) {
        toast.success(flightId ? 'Flight updated' : 'Flight created');
        navigate('/admin/flights');
      } else toast.error(res.error ?? 'Failed');
    });
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const toggleDay = (i: number) => {
    const arr = form.daysOfOperation.split(',').filter(Boolean);
    const set = new Set(arr);
    if (set.has(String(i))) set.delete(String(i));
    else set.add(String(i));
    setForm((f) => ({ ...f, daysOfOperation: [...set].sort().join(',') || '0' }));
  };

  if (loading) return <div className="flex h-48 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" /></div>;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">{flightId ? 'Edit Flight' : 'Add Flight'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Airline *</label>
            <select value={form.airlineId} onChange={(e) => setForm((f) => ({ ...f, airlineId: e.target.value }))} className="input-field" required>
              <option value="">Select</option>
              {airlines.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Flight Number *</label>
            <input value={form.flightNumber} onChange={(e) => setForm((f) => ({ ...f, flightNumber: e.target.value }))} className="input-field" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Origin (city name) *</label>
            <input list="airports-origin" value={form.originId} onChange={(e) => setForm((f) => ({ ...f, originId: e.target.value }))} className="input-field" placeholder="e.g. Delhi, Mumbai" required />
            <datalist id="airports-origin">{airports.map((a) => <option key={a.code} value={a.city}>{a.city} - {a.name} ({a.code})</option>)}</datalist>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Destination (city name) *</label>
            <input list="airports-dest" value={form.destinationId} onChange={(e) => setForm((f) => ({ ...f, destinationId: e.target.value }))} className="input-field" placeholder="e.g. Delhi, Mumbai" required />
            <datalist id="airports-dest">{airports.map((a) => <option key={a.code} value={a.city}>{a.city} - {a.name} ({a.code})</option>)}</datalist>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Aircraft *</label>
            <select value={form.aircraftId} onChange={(e) => setForm((f) => ({ ...f, aircraftId: e.target.value }))} className="input-field" required>
              <option value="">Select</option>
              {aircraft.map((a) => <option key={a.id} value={a.id}>{a.model} ({a.totalSeats} seats)</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Duration (minutes) *</label>
            <input type="number" min={1} value={form.durationMinutes} onChange={(e) => setForm((f) => ({ ...f, durationMinutes: parseInt(e.target.value, 10) || 0 }))} className="input-field" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Departure time (HH:mm)</label>
            <input type="time" value={form.departureTime} onChange={(e) => setForm((f) => ({ ...f, departureTime: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Arrival time (HH:mm)</label>
            <input type="time" value={form.arrivalTime} onChange={(e) => setForm((f) => ({ ...f, arrivalTime: e.target.value }))} className="input-field" />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Days of operation</label>
          <div className="flex flex-wrap gap-2">
            {days.map((d, i) => (
              <label key={d} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-600">
                <input type="checkbox" checked={form.daysOfOperation.split(',').includes(String(i))} onChange={() => toggleDay(i)} className="rounded" />
                <span>{d}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
          <button type="button" onClick={() => navigate('/admin/flights')} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default function AdminFlights() {
  return (
    <Routes>
      <Route index element={<FlightList />} />
      <Route path="new" element={<FlightForm />} />
      <Route path="edit/:id" element={<FlightForm />} />
    </Routes>
  );
}
