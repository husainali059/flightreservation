import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const flightId = searchParams.get('flightId');
  const departureDate = searchParams.get('departureDate');
  const cabinClass = searchParams.get('cabinClass') ?? 'ECONOMY';
  const adults = parseInt(searchParams.get('adults') ?? '1', 10);

  const [flight, setFlight] = useState<any>(null);
  const [loading, setLoading] = useState(!!flightId);
  const [step, setStep] = useState<'details' | 'done'>('details');
  const [bookingPnr, setBookingPnr] = useState<string | null>(null);

  const [passengers, setPassengers] = useState(
    Array.from({ length: adults }, () => ({
      title: 'Mr',
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'Male',
      email: '',
      phone: '',
    }))
  );
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!flightId) return;
    api.get(`/flights/${flightId}`).then((res) => {
      if (res.success && res.data) setFlight(res.data);
      setLoading(false);
    });
  }, [flightId]);

  const updatePassenger = (i: number, field: string, value: string) => {
    setPassengers((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const completeBooking = async () => {
    if (!flightId || !departureDate) {
      setError('Missing flight or date');
      return;
    }
    setError('');
    setSubmitting(true);
    const res = await api.post<{ id: string; totalAmount: number; pnr: string }>('/bookings', {
      flightIds: [flightId],
      departureDates: [departureDate],
      cabinClass,
      passengers: passengers.map((p) => ({
        ...p,
        dateOfBirth: p.dateOfBirth || '1990-01-01',
      })),
      contactEmail: contactEmail || passengers[0]?.email,
      contactPhone: contactPhone || passengers[0]?.phone,
      promoCode: promoCode || undefined,
    });
    if (!res.success || !res.data) {
      setSubmitting(false);
      setError(res.error ?? 'Failed to create booking');
      return;
    }
    const pnr = res.data.pnr;
    const confirmRes = await api.post('/payments/confirm', {
      bookingId: res.data.id,
      paymentIntentId: null,
    });
    setSubmitting(false);
    if (confirmRes.success) {
      setBookingPnr(pnr);
      setStep('done');
    } else {
      setError(confirmRes.error ?? 'Payment confirmation failed');
    }
  };

  if (!flightId || !departureDate) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-gray-600 dark:text-gray-400">Select a flight from search results to checkout.</p>
        <Link to="/search" className="mt-4 inline-block text-primary-600 hover:underline">Back to search</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (step === 'done' && bookingPnr) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="card p-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Booking successful!</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Your flight has been confirmed.</p>
          <p className="mt-4 font-mono text-xl font-bold text-primary-600 dark:text-primary-400">{bookingPnr}</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">Save this PNR for your records.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to={`/bookings/${bookingPnr}`} className="btn-primary">
              View booking
            </Link>
            <Link to="/search" className="btn-secondary">Book another flight</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Checkout</h1>
      {flight && (
        <div className="card mt-4 p-4">
          <p className="font-medium text-gray-900 dark:text-white">
            Flight {flight.airline?.code}{flight.flightNumber} · {flight.origin?.code} → {flight.destination?.code}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{departureDate} · {cabinClass}</p>
        </div>
      )}

      <div className="card mt-6 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white">Passenger details</h2>
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}
        <div className="mt-4 space-y-6">
          {passengers.map((p, i) => (
            <div key={i} className="border-t border-gray-200 pt-4 dark:border-gray-700">
              <p className="mb-2 font-medium text-gray-700 dark:text-gray-300">Passenger {i + 1}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400">Title</label>
                  <select
                    value={p.title}
                    onChange={(e) => updatePassenger(i, 'title', e.target.value)}
                    className="input-field mt-1"
                  >
                    <option value="Mr">Mr</option>
                    <option value="Ms">Ms</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Dr">Dr</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400">First name</label>
                  <input
                    value={p.firstName}
                    onChange={(e) => updatePassenger(i, 'firstName', e.target.value)}
                    className="input-field mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400">Last name</label>
                  <input
                    value={p.lastName}
                    onChange={(e) => updatePassenger(i, 'lastName', e.target.value)}
                    className="input-field mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400">Date of birth</label>
                  <input
                    type="date"
                    value={p.dateOfBirth}
                    onChange={(e) => updatePassenger(i, 'dateOfBirth', e.target.value)}
                    className="input-field mt-1"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400">Email</label>
                  <input
                    type="email"
                    value={p.email}
                    onChange={(e) => updatePassenger(i, 'email', e.target.value)}
                    className="input-field mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400">Phone</label>
                  <input
                    type="tel"
                    value={p.phone}
                    onChange={(e) => updatePassenger(i, 'phone', e.target.value)}
                    className="input-field mt-1"
                    required
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400">Contact email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder={passengers[0]?.email}
              className="input-field mt-1"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400">Contact phone</label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder={passengers[0]?.phone}
              className="input-field mt-1"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm text-gray-600 dark:text-gray-400">Promo code</label>
          <input
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="e.g. WELCOME10"
            className="input-field mt-1 w-48"
          />
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={completeBooking}
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? 'Completing booking...' : 'Complete booking'}
          </button>
          <Link to="/search" className="btn-secondary">Cancel</Link>
        </div>
      </div>
    </div>
  );
}
