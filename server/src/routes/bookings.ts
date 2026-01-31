import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { createBookingSchema } from '../validators/bookings.js';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth.js';
import { generatePNR } from '../utils/pnr.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
const prisma = new PrismaClient();

router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const parsed = createBookingSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors[0]?.message ?? 'Validation failed');
    }
    const userId = req.user!.userId;
    const { flightIds, departureDates, cabinClass, passengers, contactEmail, contactPhone, promoCode } = parsed.data;

    // Resolve flights and compute total
    let totalAmount = 0;
    const segments: { flightId: string; departureDate: Date; cabinClass: any; price: number }[] = [];
    for (let i = 0; i < flightIds.length; i++) {
      const flightId = flightIds[i];
      const depDate = new Date(departureDates[i]);
      const flight = await prisma.flight.findUnique({
        where: { id: flightId },
        include: { pricingRules: { where: { cabinClass: cabinClass as any } }, flightInventory: { where: { date: depDate } } },
      });
      if (!flight) throw new AppError(404, `Flight ${flightId} not found`);
      const rule = flight.pricingRules[0];
      const inv = flight.flightInventory[0];
      if (!rule || !inv) throw new AppError(400, 'Flight not available for selected date/class');
      const price = Number(rule.baseFare) * Number(rule.dynamicMultiplier) + Number(rule.taxes);
      const totalPax = passengers.length;
      const segmentTotal = price * totalPax;
      totalAmount += segmentTotal;
      segments.push({ flightId, departureDate: depDate, cabinClass: cabinClass as any, price: segmentTotal });
    }

    let discountAmount = 0;
    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({
        where: { code: promoCode.toUpperCase(), validUntil: { gte: new Date() }, validFrom: { lte: new Date() } },
      });
      if (promo && (promo.usageLimit == null || promo.usedCount < promo.usageLimit)) {
        if (promo.discountType === 'PERCENTAGE') {
          discountAmount = totalAmount * (Number(promo.discountValue) / 100);
        } else {
          discountAmount = Math.min(totalAmount, Number(promo.discountValue));
        }
        if (promo.minBookingAmount && totalAmount < Number(promo.minBookingAmount)) discountAmount = 0;
      }
    }

    const finalAmount = totalAmount - discountAmount;
    let pnr = generatePNR();
    while (await prisma.booking.findUnique({ where: { pnr } })) {
      pnr = generatePNR();
    }

    const booking = await prisma.booking.create({
      data: {
        userId,
        pnr,
        status: 'PENDING',
        totalAmount: finalAmount,
        tripType: 'ONE_WAY',
        promoCode: promoCode ?? undefined,
        discountAmount: discountAmount || undefined,
        passengers: {
          create: passengers.map((p) => ({
            title: p.title,
            firstName: p.firstName,
            lastName: p.lastName,
            dateOfBirth: new Date(p.dateOfBirth),
            gender: p.gender,
            passportNumber: p.passportNumber,
            passportExpiry: p.passportExpiry ? new Date(p.passportExpiry) : undefined,
            nationality: p.nationality,
            email: p.email,
            phone: p.phone,
            mealPreference: p.mealPreference,
            specialRequests: p.specialRequests,
          })),
        },
        segments: {
          create: segments.map((s) => ({
            flightId: s.flightId,
            departureDate: s.departureDate,
            cabinClass: s.cabinClass,
            price: s.price,
          })),
        },
      },
      include: {
        passengers: true,
        segments: { include: { flight: { include: { airline: true, origin: true, destination: true } } } },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        ...booking,
        totalAmount: Number(booking.totalAmount),
        discountAmount: booking.discountAmount ? Number(booking.discountAmount) : null,
      },
    });
  } catch (e) {
    next(e);
  }
});

router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const status = req.query.status as string | undefined;
    const bookings = await prisma.booking.findMany({
      where: { userId, ...(status ? { status: status as any } : {}) },
      include: {
        passengers: true,
        segments: { include: { flight: { include: { airline: true, origin: true, destination: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      success: true,
      data: bookings.map((b) => ({
        ...b,
        totalAmount: Number(b.totalAmount),
        discountAmount: b.discountAmount ? Number(b.discountAmount) : null,
      })),
    });
  } catch (e) {
    next(e);
  }
});

router.get('/:pnr', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const pnr = req.params.pnr.toUpperCase();
    const booking = await prisma.booking.findFirst({
      where: { pnr, userId },
      include: {
        passengers: true,
        segments: { include: { flight: { include: { airline: true, origin: true, destination: true } } } },
      },
    });
    if (!booking) throw new AppError(404, 'Booking not found');
    res.json({
      success: true,
      data: {
        ...booking,
        totalAmount: Number(booking.totalAmount),
        discountAmount: booking.discountAmount ? Number(booking.discountAmount) : null,
      },
    });
  } catch (e) {
    next(e);
  }
});

router.put('/:pnr/modify', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const pnr = req.params.pnr.toUpperCase();
    const booking = await prisma.booking.findFirst({ where: { pnr, userId } });
    if (!booking) throw new AppError(404, 'Booking not found');
    if (booking.status !== 'CONFIRMED') throw new AppError(400, 'Only confirmed bookings can be modified');
    // Full implementation would compute fare difference and update segments
    res.json({ success: true, message: 'Modification request received. Full implementation would update booking.' });
  } catch (e) {
    next(e);
  }
});

router.delete('/:pnr/cancel', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const pnr = req.params.pnr.toUpperCase();
    const booking = await prisma.booking.findFirst({ where: { pnr, userId } });
    if (!booking) throw new AppError(404, 'Booking not found');
    await prisma.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } });
    res.json({ success: true, message: 'Booking cancelled' });
  } catch (e) {
    next(e);
  }
});

router.post('/:pnr/checkin', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const pnr = req.params.pnr.toUpperCase();
    const booking = await prisma.booking.findFirst({ where: { pnr, userId } });
    if (!booking) throw new AppError(404, 'Booking not found');
    if (booking.status !== 'CONFIRMED') throw new AppError(400, 'Only confirmed bookings can check in');
    await prisma.booking.update({ where: { id: booking.id }, data: { status: 'CHECKED_IN' } });
    res.json({ success: true, message: 'Check-in completed' });
  } catch (e) {
    next(e);
  }
});

router.get('/:pnr/ticket', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const pnr = req.params.pnr.toUpperCase();
    const booking = await prisma.booking.findFirst({
      where: { pnr, userId },
      include: { passengers: true, segments: { include: { flight: { include: { airline: true, origin: true, destination: true } } } } },
    });
    if (!booking) throw new AppError(404, 'Booking not found');
    if (booking.status === 'PENDING') throw new AppError(400, 'Complete payment to get ticket');
    res.json({
      success: true,
      data: {
        pnr: booking.pnr,
        status: booking.status,
        passengers: booking.passengers,
        segments: booking.segments,
        totalAmount: Number(booking.totalAmount),
      },
    });
  } catch (e) {
    next(e);
  }
});

export { router as bookingsRouter };
