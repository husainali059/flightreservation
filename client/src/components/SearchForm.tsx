import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

type TripType = 'ONE_WAY' | 'ROUND_TRIP';

interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

export default function SearchForm(_props?: { redirectToSearch?: boolean }) {
  const navigate = useNavigate();
  const [tripType, setTripType] = useState<TripType>('ONE_WAY');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [cabinClass, setCabinClass] = useState('ECONOMY');
  const [airports, setAirports] = useState<Airport[]>([]);
  
  // Get all airports for autocomplete
  useEffect(() => {
    api.get<Airport[]>('/airports').then((res) => {
      if (res.success && res.data && Array.isArray(res.data)) {
        console.log('✅ Airports loaded:', res.data);
        setAirports(res.data);
      } else {
        console.warn('❌ Failed to load airports:', res);
      }
    }).catch(err => {
      console.warn('❌ Error loading airports:', err);
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!airports || airports.length === 0) {
      alert('Airports data not loaded yet. Please wait a moment and try again.');
      return;
    }
    
    // Find airport codes by city name or code
    const originInput = origin.trim();
    const destInput = destination.trim();
    
    console.log('🔍 Searching for origin:', originInput);
    console.log('📋 Available cities:', airports.map(a => a.city));
    
    // Try exact city match first, then code match, then partial match
    let originAirport = airports.find(a => a.city.toLowerCase() === originInput.toLowerCase());
    if (!originAirport) {
      originAirport = airports.find(a => a.code.toLowerCase() === originInput.toLowerCase());
    }
    if (!originAirport) {
      originAirport = airports.find(a => a.city.toLowerCase().includes(originInput.toLowerCase()) || a.code.toLowerCase().includes(originInput.toLowerCase()));
    }
    
    let destAirport = airports.find(a => a.city.toLowerCase() === destInput.toLowerCase());
    if (!destAirport) {
      destAirport = airports.find(a => a.code.toLowerCase() === destInput.toLowerCase());
    }
    if (!destAirport) {
      destAirport = airports.find(a => a.city.toLowerCase().includes(destInput.toLowerCase()) || a.code.toLowerCase().includes(destInput.toLowerCase()));
    }
    
    console.log('✅ Origin airport found:', originAirport);
    console.log('✅ Dest airport found:', destAirport);
    
    if (!originAirport) {
      alert(`Origin city/airport not found: "${originInput}"\n\nAvailable cities: ${airports.map(a => a.city).join(', ')}`);
      return;
    }
    if (!destAirport) {
      alert(`Destination city/airport not found: "${destInput}"\n\nAvailable cities: ${airports.map(a => a.city).join(', ')}`);
      return;
    }
    
    const params = new URLSearchParams({
      origin: originAirport.code,
      destination: destAirport.code,
      departureDate,
      tripType,
      adults: String(adults),
      cabinClass,
    });
    if (tripType === 'ROUND_TRIP' && returnDate) params.set('returnDate', returnDate);
    navigate(`/search?${params.toString()}`);
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-700">
        <button
          type="button"
          onClick={() => setTripType('ONE_WAY')}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            tripType === 'ONE_WAY'
              ? 'bg-white text-primary-600 shadow dark:bg-slate-600 dark:text-primary-300'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          One-way
        </button>
        <button
          type="button"
          onClick={() => setTripType('ROUND_TRIP')}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            tripType === 'ROUND_TRIP'
              ? 'bg-white text-primary-600 shadow dark:bg-slate-600 dark:text-primary-300'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Round-trip
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">From</label>
          <input
            list="origin-airports"
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="e.g. Mumbai, Delhi"
            className="input-field"
            required
          />
          <datalist id="origin-airports">
            {airports.map(a => (
              <option key={a.code} value={a.city}>{a.city} ({a.code}) - {a.name}</option>
            ))}
          </datalist>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">To</label>
          <input
            list="dest-airports"
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g. Mumbai, Delhi"
            className="input-field"
            required
          />
          <datalist id="dest-airports">
            {airports.map(a => (
              <option key={a.code} value={a.city}>{a.city} ({a.code}) - {a.name}</option>
            ))}
          </datalist>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Departure</label>
          <input
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            min={today}
            className="input-field"
            required
          />
        </div>
        {tripType === 'ROUND_TRIP' && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Return</label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              min={departureDate || today}
              className="input-field"
            />
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Passengers</label>
          <select
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            className="input-field w-28"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Class</label>
          <select
            value={cabinClass}
            onChange={(e) => setCabinClass(e.target.value)}
            className="input-field w-44"
          >
            <option value="ECONOMY">Economy</option>
            <option value="BUSINESS">Business</option>
            <option value="FIRST">First Class</option>
          </select>
        </div>
      </div>
      <button type="submit" className="btn-primary w-full sm:w-auto sm:min-w-[180px]">
        Search Flights
      </button>
    </form>
  );
}
