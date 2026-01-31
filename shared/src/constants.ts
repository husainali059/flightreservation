export const USER_ROLES = ['CUSTOMER', 'ADMIN', 'AGENT'] as const;
export const TRIP_TYPES = ['ONE_WAY', 'ROUND_TRIP', 'MULTI_CITY'] as const;
export const CABIN_CLASSES = ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'] as const;
export const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'COMPLETED'] as const;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PASSENGERS = 9;
export const PNR_LENGTH = 6;
export const JWT_ACCESS_EXPIRY = '15m';
export const JWT_REFRESH_EXPIRY = '7d';
