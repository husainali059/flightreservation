import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';

interface Booking {
  pnr: string;
  status: string;
  totalAmount: number;
  passengers: { firstName: string; lastName: string; email: string; seatNumber?: string }[];
  segments: { flight: { airline: { code: string }; flightNumber: string; origin: { code: string; city: string }; destination: { code: string; city: string }; departureTime: string; arrivalTime: string }; departureDate: string; cabinClass: string }[];
}

export default function BookingDetail() {
  const { pnr } = useParams<{ pnr: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<'idle' | 'checkin' | 'cancel'>('idle');

  useEffect(() => {
    if (!pnr) return;
    api.get<Booking>(`/bookings/${pnr}`).then((res) => {
      if (res.success && res.data) setBooking(res.data);
      setLoading(false);
    });
  }, [pnr]);

  const handleCheckin = () => {
    if (!pnr) return;
    setAction('checkin');
    api.post(`/bookings/${pnr}/checkin`).then((res) => {
      if (res.success) setBooking((b) => (b ? { ...b, status: 'CHECKED_IN' } : null));
      setAction('idle');
    });
  };

  const handleCancel = () => {
    if (!pnr || !confirm('Cancel this booking? Refund depends on policy.')) return;
    setAction('cancel');
    api.delete(`/bookings/${pnr}/cancel`).then((res) => {
      if (res.success) setBooking((b) => (b ? { ...b, status: 'CANCELLED' } : null));
      setAction('idle');
    });
  };

  if (loading || !booking) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        {loading ? (
          <div className="flex justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" /></div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">Booking not found.</p>
        )}
      </div>
    );
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Booking {booking.pnr}</h1>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${
          booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
          booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
          booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {booking.status}
        </span>
      </div>

      <div className="card mt-6 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white">Flights</h2>
        {booking.segments.map((seg, i) => (
          <div key={i} className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
            <div className="flex justify-between">
              <span className="font-mono font-semibold">{seg.flight.airline.code}{seg.flight.flightNumber}</span>
              <span>{seg.cabinClass}</span>
            </div>
            <div className="mt-2 text-gray-600 dark:text-gray-400">
              {seg.flight.origin.code} {seg.flight.origin.city} → {seg.flight.destination.code} {seg.flight.destination.city}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-500">
              {formatDate(seg.departureDate)} · {seg.flight.departureTime} - {seg.flight.arrivalTime}
            </div>
          </div>
        ))}
      </div>

      <div className="card mt-6 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white">Passengers</h2>
        <ul className="mt-4 space-y-2">
          {booking.passengers.map((p, i) => (
            <li key={i} className="text-gray-600 dark:text-gray-400">
              {p.firstName} {p.lastName} · {p.email} {p.seatNumber && `· Seat ${p.seatNumber}`}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="text-xl font-bold text-gray-900 dark:text-white">Total: ${booking.totalAmount.toFixed(2)}</div>
        <div className="flex gap-2">
          {booking.status === 'CONFIRMED' && (
            <button onClick={handleCheckin} disabled={action !== 'idle'} className="btn-primary">
              {action === 'checkin' ? 'Processing...' : 'Web check-in'}
            </button>
          )}
          {(booking.status === 'CONFIRMED' || booking.status === 'PENDING') && (
            <button onClick={handleCancel} disabled={action !== 'idle'} className="btn-secondary">
              {action === 'cancel' ? 'Cancelling...' : 'Cancel booking'}
            </button>
          )}
          <Link to="/bookings" className="btn-secondary">Back to list</Link>
        </div>
      </div>
    </div>
  );
}
