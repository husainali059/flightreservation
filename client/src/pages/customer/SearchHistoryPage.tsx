import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../../api/customerAPI';
import type { SearchHistoryItem } from '../../types/customer';
import { History, Search, Trash2 } from 'lucide-react';

export default function SearchHistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customerAPI.getSearchHistory(20).then((r) => {
      if (r.success && r.data) setHistory(Array.isArray(r.data) ? r.data : []);
      setLoading(false);
    });
  }, []);

  const reSearch = (s: SearchHistoryItem) => {
    const params = new URLSearchParams({
      origin: s.origin,
      destination: s.destination,
      departureDate: s.departureDate,
      tripType: s.tripType,
      adults: String(s.adults),
      cabinClass: s.cabinClass,
    });
    if (s.returnDate) params.set('returnDate', s.returnDate);
    navigate(`/search?${params.toString()}`);
  };

  const deleteOne = (id: string) => {
    customerAPI.deleteSearchHistory(id).then((res) => {
      if (res.success) setHistory((prev) => prev.filter((h) => h.id !== id));
    });
  };

  const clearAll = () => {
    if (!window.confirm('Clear all search history?')) return;
    customerAPI.clearSearchHistory().then((res) => {
      if (res.success) setHistory([]);
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 dark:border-primary-800 dark:border-t-primary-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
          Search history
        </h1>
        {history.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Clear all
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <History className="h-16 w-16 text-slate-300 dark:text-slate-600" />
          <p className="mt-4 text-slate-600 dark:text-slate-400">No search history.</p>
          <p className="mt-1 text-sm text-slate-500">Your recent searches will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((s) => (
            <div
              key={s.id}
              className="card flex flex-wrap items-center justify-between gap-4 p-4"
            >
              <div>
                <p className="font-mono font-semibold text-slate-900 dark:text-white">
                  {s.origin} → {s.destination}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {s.departureDate}
                  {s.returnDate ? ` – ${s.returnDate}` : ''} · {s.adults} adult(s) · {s.cabinClass.replace('_', ' ')}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => reSearch(s)}
                  className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  <Search className="h-4 w-4" />
                  Search again
                </button>
                <button
                  type="button"
                  onClick={() => deleteOne(s.id)}
                  className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
