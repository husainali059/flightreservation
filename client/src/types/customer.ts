// Customer panel shared types

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  metadata?: string | null;
  createdAt: string;
}

export interface SearchHistoryItem {
  id: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string | null;
  tripType: string;
  adults: number;
  children: number;
  infants: number;
  cabinClass: string;
  createdAt: string;
}

export interface SavedRouteItem {
  id: string;
  origin: string;
  destination: string;
  priceAlert: boolean;
  targetPrice?: number | null;
  lowestPriceSeen?: number | null;
  cabinClass?: string | null;
  createdAt: string;
}

export interface LoyaltyPointsData {
  id: string;
  pointsBalance: number;
  totalEarned: number;
  totalRedeemed: number;
}

export interface LoyaltyTransactionItem {
  id: string;
  type: string;
  points: number;
  balanceAfter: number;
  description?: string | null;
  bookingId?: string | null;
  createdAt: string;
}

export interface BookingSummary {
  id: string;
  pnr: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  passengers: { firstName: string; lastName: string }[];
  segments?: {
    flight: {
      airline: { code: string; name?: string };
      origin: { code: string; city?: string };
      destination: { code: string; city?: string };
      departureTime: string;
      arrivalTime: string;
    };
    departureDate: string;
    cabinClass: string;
  }[];
}
