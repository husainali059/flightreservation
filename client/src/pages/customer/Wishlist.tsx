import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { customerAPI } from '../../api/customerAPI';
import type { SavedRouteItem } from '../../types/customer';
import { Heart, Trash2, Search } from 'lucide-react';

export default function Wishlist() {
  const [routes, setRoutes] = useState<SavedRouteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customerAPI.getSavedRoutes().then((r) => {
      if (r.success && r.data) setRoutes(Array.isArray(r.data) ? r.data : []);
      setLoading(false);
    });
  }, []);

  const remove = (id: string) => {
    customerAPI.deleteSavedRoute(id).then((res) => {
      if (res.success) setRoutes((prev) => prev.filter((r) => r.id !== id));
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
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
        Saved routes
      </h1>
      <p className="text-slate-600 dark:text-slate-400">
        Save routes to track prices and get alerts. Click search to find flights.
      </p>

      {routes.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Heart className="h-16 w-16 text-slate-300 dark:text-slate-600" />
          <p className="mt-4 text-slate-600 dark:text-slate-400">No saved routes yet.</p>
          <p className="mt-1 text-sm text-slate-500">Search for flights and add routes from the results.</p>
          <Link to="/search" className="btn-primary mt-6">
            Search flights
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {routes.map((r) => (
            <div
              key={r.id}
              className="card flex flex-wrap items-center justify-between gap-4 p-6"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                  <Heart className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-mono text-lg font-semibold text-slate-900 dark:text-white">
                    {r.origin} → {r.destination}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Saved {new Date(r.createdAt).toLocaleDateString()}
                    {r.priceAlert && ' · Price alerts on'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/search?origin=${r.origin}&destination=${r.destination}`}
                  className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  <Search className="h-4 w-4" />
                  Search
                </Link>
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
