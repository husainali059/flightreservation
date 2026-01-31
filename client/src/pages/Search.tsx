import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../api/client';
import { customerAPI } from '../api/customerAPI';
import { useAuthStore } from '../stores/authStore';
import { Heart } from 'lucide-react';

interface FlightSegment {
  id: string;
  flightNumber: string;
  airline: { name: string; code: string };
  origin: { code: string; city: string };
  destination: { code: string; city: string };
  departureTime: string;
  arrivalTime: string;
  duration: number;
  cabinClass: string;
  price: number;
}

interface FlightResult {
  id: string;
  segments: FlightSegment[];
  totalDuration: number;
  totalPrice: number;
  departureDate: string;
}

export default function Search() {
  const [searchParams] = useSearchParams();
  const token = useAuthStore((s) => s.accessToken);
  const [results, setResults] = useState<FlightResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const origin = searchParams.get('origin') ?? '';
  const destination = searchParams.get('destination') ?? '';
  const departureDate = searchParams.get('departureDate') ?? '';
  const returnDate = searchParams.get('returnDate') ?? '';
  const tripType = searchParams.get('tripType') ?? 'ONE_WAY';
  const adults = searchParams.get('adults') ?? '1';
  const cabinClass = searchParams.get('cabinClass') ?? 'ECONOMY';

  useEffect(() => {
    if (!origin || !destination || !departureDate) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    api
      .get<{ items: FlightResult[]; totalPages: number }>(
        `/flights/search?origin=${origin}&destination=${destination}&departureDate=${departureDate}&tripType=${tripType}&adults=${adults}&cabinClass=${cabinClass}&page=${page}&pageSize=10`
      )
      .then((res) => {
        if (res.success && res.data) {
          const data = res.data as { items?: FlightResult[]; totalPages?: number };
          setResults(data.items ?? []);
          setTotalPages(data.totalPages ?? 1);
          if (token) {
            customerAPI.saveSearchHistory({
              origin: origin.toUpperCase().slice(0, 3),
              destination: destination.toUpperCase().slice(0, 3),
              departureDate,
              returnDate: returnDate || undefined,
              tripType,
              adults: parseInt(adults, 10),
              cabinClass,
            }).catch(() => {});
          }
        } else {
          setError(res.error ?? 'Search failed');
        }
      })
      .catch(() => setError('Network error. Is the server running?'))
      .finally(() => setLoading(false));
  }, [origin, destination, departureDate, returnDate, tripType, adults, cabinClass, page, token]);

  const formatDuration = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m}m`;
  };

  if (!origin || !destination || !departureDate) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="card p-8 text-center">
          <p className="text-slate-600 dark:text-slate-400">Use the search form on the home page to find flights.</p>
          <Link to="/" className="mt-4 inline-block text-primary-600 hover:underline dark:text-primary-400">
            Go to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
        Flights: {results[0]?.segments[0]?.origin.city || origin} → {results[0]?.segments[0]?.destination.city || destination}
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        {departureDate} · {adults} passenger(s) · {cabinClass.replace('_', ' ')}
      </p>

      {loading && (
        <div className="mt-10 flex flex-col items-center justify-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 dark:border-primary-800 dark:border-t-primary-400" />
          <p className="text-slate-600 dark:text-slate-400">Searching flights...</p>
        </div>
      )}
      {error && (
        <div className="card mt-6 border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          {error}
        </div>
      )}
      {!loading && !error && results.length === 0 && (
        <div className="card mt-8 p-8 text-center">
          <p className="text-slate-600 dark:text-slate-400">No flights found for this search.</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">
            Try: <strong>Delhi → Mumbai</strong> or <strong>Bengaluru → Chennai</strong> with a date in the next 90 days.
          </p>
          <Link to="/" className="mt-4 inline-block text-primary-600 hover:underline dark:text-primary-400">
            Search again
          </Link>
        </div>
      )}
      {!loading && results.length > 0 && (
        <div className="mt-6 space-y-4">
          {results.map((flight) => {
            const seg = flight.segments[0];
            return (
              <div
                key={flight.id}
                className="card card-hover flex flex-wrap items-center justify-between gap-6 p-6"
              >
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-lg font-bold text-primary-600 dark:bg-primary-900/50 dark:text-primary-400">
                      {seg.airline.code}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {seg.airline.code} {seg.flightNumber}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{seg.airline.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <span className="font-mono font-semibold">{seg.origin.code}</span>
                    <span className="text-slate-400">→</span>
                    <span className="font-mono font-semibold">{seg.destination.code}</span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {seg.departureTime} – {seg.arrivalTime} · {formatDuration(flight.totalDuration)}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    ${flight.totalPrice.toFixed(0)}
                  </span>
                  {token && (
                    <button
                      type="button"
                      onClick={() => {
                        customerAPI.addSavedRoute({
                          origin: seg.origin.code,
                          destination: seg.destination.code,
                        }).then((r) => {
                          if (r.success) toast.success('Route saved to wishlist');
                          else toast.error(r.error ?? 'Could not save');
                        });
                      }}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <Heart className="h-4 w-4" />
                      Save route
                    </button>
                  )}
                  <Link
                    to={`/checkout?flightId=${flight.id}&departureDate=${departureDate}&cabinClass=${cabinClass}&adults=${adults}`}
                    className="btn-primary"
                  >
                    Select
                  </Link>
                </div>
              </div>
            );
          })}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-slate-600 dark:text-slate-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
