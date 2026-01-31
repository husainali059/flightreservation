import { z } from 'zod';

const passengerSchema = z.object({
  title: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.string().min(1),
  passportNumber: z.string().optional(),
  passportExpiry: z.string().optional(),
  nationality: z.string().optional(),
  email: z.string().email(),
  phone: z.string().min(1),
  mealPreference: z.string().optional(),
  specialRequests: z.string().optional(),
});

export const createBookingSchema = z.object({
  flightIds: z.array(z.string()).min(1, 'At least one flight required'),
  departureDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1),
  cabinClass: z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']),
  passengers: z.array(passengerSchema).min(1, 'At least one passenger required'),
  contactEmail: z.string().email(),
  contactPhone: z.string().min(1),
  promoCode: z.string().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
