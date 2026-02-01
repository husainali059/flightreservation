import { Router } from 'express';
import { searchFlightsSchema } from '../validators/flights.js';
import { searchFlights } from '../services/flightSearch.js';
import { AppError } from '../middleware/errorHandler.js';
import { prisma } from '../utils/prisma.js';

const router = Router();

router.get('/search', async (req, res, next) => {
  try {
    const parsed = searchFlightsSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors[0]?.message ?? 'Invalid search params');
    }
    const result = await searchFlights(parsed.data);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

router.get('/airlines', async (_req, res, next) => {
  try {
    const airlines = await prisma.airline.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data: airlines });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const flight = await prisma.flight.findUnique({
      where: { id: req.params.id },
      include: {
        airline: true,
        origin: true,
        destination: true,
        aircraft: true,
        pricingRules: true,
      },
    });
    if (!flight) throw new AppError(404, 'Flight not found');
    res.json({ success: true, data: flight });
  } catch (e) {
    next(e);
  }
});

router.get('/:id/seats', async (req, res, next) => {
  try {
    const { id } = req.params;
    const date = req.query.date as string;
    if (!date) throw new AppError(400, 'Date query required');

    const flight = await prisma.flight.findUnique({
      where: { id },
      include: { seatLayouts: true, aircraft: true },
    });
    if (!flight) throw new AppError(404, 'Flight not found');

    // In a full impl we'd mark which seats are already booked for this date.
    const seats = flight.seatLayouts.map((s: any) => ({
      id: s.id,
      seatNumber: s.seatNumber,
      cabinClass: s.cabinClass,
      extraLegroom: s.extraLegroom,
      available: true,
      price: s.priceModifier ? Number(s.priceModifier) : undefined,
    }));

    res.json({ success: true, data: { seats, flightId: id, date } });
  } catch (e) {
    next(e);
  }
});

export { router as flightsRouter };
