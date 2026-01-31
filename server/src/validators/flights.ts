import { z } from 'zod';

export const searchFlightsSchema = z.object({
  origin: z.string().length(3, 'Origin must be 3-letter airport code'),
  destination: z.string().length(3, 'Destination must be 3-letter airport code'),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format YYYY-MM-DD'),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tripType: z.enum(['ONE_WAY', 'ROUND_TRIP', 'MULTI_CITY']).default('ONE_WAY'),
  adults: z.coerce.number().min(1).max(9).default(1),
  children: z.coerce.number().min(0).max(9).default(0),
  infants: z.coerce.number().min(0).max(9).default(0),
  cabinClass: z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']).default('ECONOMY'),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(20),
  sortBy: z.enum(['price', 'duration', 'departure']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type SearchFlightsInput = z.infer<typeof searchFlightsSchema>;
