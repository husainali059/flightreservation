// User & Auth
export type UserRole = 'CUSTOMER' | 'ADMIN' | 'AGENT';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Airport & Location
export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
}

// Airline
export interface Airline {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
}

// Flight
export type TripType = 'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_CITY';
export type CabinClass = 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  tripType: TripType;
  adults: number;
  children: number;
  infants: number;
  cabinClass: CabinClass;
}

export interface FlightSegment {
  id: string;
  flightNumber: string;
  airline: Airline;
  origin: Airport;
  destination: Airport;
  departureTime: string;
  arrivalTime: string;
  duration: number; // minutes
  cabinClass: CabinClass;
  availableSeats: number;
  price: number;
  stops: number;
}

export interface FlightSearchResult {
  id: string;
  segments: FlightSegment[];
  totalDuration: number;
  totalPrice: number;
  departureDate: string;
}

// Passenger
export interface PassengerDetails {
  title: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  passportNumber?: string;
  passportExpiry?: string;
  nationality?: string;
  email: string;
  phone: string;
}

// Booking
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'CHECKED_IN' | 'COMPLETED';

export interface Booking {
  id: string;
  pnr: string;
  status: BookingStatus;
  totalAmount: number;
  currency: string;
  createdAt: string;
  passengers: BookingPassenger[];
  flights: FlightSegment[];
}

export interface BookingPassenger {
  id: string;
  passengerDetails: PassengerDetails;
  seatNumber?: string;
  mealPreference?: string;
}

// Payment
export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'CARD' | 'UPI' | 'NETBANKING' | 'WALLET';

// Seat
export interface Seat {
  id: string;
  seatNumber: string;
  cabinClass: CabinClass;
  extraLegroom: boolean;
  available: boolean;
  price?: number;
}

// API Response wrappers
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
