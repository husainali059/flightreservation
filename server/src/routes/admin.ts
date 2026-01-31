import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { authenticate, requireRole, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);
router.use(requireRole('ADMIN', 'AGENT'));

// ========== ANALYTICS ==========
router.get('/analytics', async (req: AuthRequest, res, next) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [bookingsToday, bookingsWeek, bookingsMonth, totalBookings, revenueToday, revenueWeek, revenueMonth, totalRevenue, totalUsers, pendingRefunds, statusCounts, paymentCounts, recentBookings, popularRoutes] = await Promise.all([
      prisma.booking.count({ where: { status: { not: 'CANCELLED' }, createdAt: { gte: startOfDay } } }),
      prisma.booking.count({ where: { status: { not: 'CANCELLED' }, createdAt: { gte: startOfWeek } } }),
      prisma.booking.count({ where: { status: { not: 'CANCELLED' }, createdAt: { gte: startOfMonth } } }),
      prisma.booking.count({ where: { status: { not: 'CANCELLED' } } }),
      prisma.booking.aggregate({ where: { status: 'CONFIRMED', createdAt: { gte: startOfDay } }, _sum: { totalAmount: true } }),
      prisma.booking.aggregate({ where: { status: 'CONFIRMED', createdAt: { gte: startOfWeek } }, _sum: { totalAmount: true } }),
      prisma.booking.aggregate({ where: { status: 'CONFIRMED', createdAt: { gte: startOfMonth } }, _sum: { totalAmount: true } }),
      prisma.booking.aggregate({ where: { status: 'CONFIRMED' }, _sum: { totalAmount: true } }),
      prisma.user.count(),
      prisma.payment.count({ where: { status: 'REFUNDED' } }),
      prisma.booking.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.payment.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true } },
          passengers: { take: 1 },
          segments: { take: 1, include: { flight: { include: { airline: true, origin: true, destination: true } } } },
        },
      }),
      prisma.bookingSegment.groupBy({
        by: ['flightId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    const flightIds = popularRoutes.map((r) => r.flightId);
    const flights = flightIds.length ? await prisma.flight.findMany({
      where: { id: { in: flightIds } },
      include: { origin: true, destination: true, airline: true },
    }) : [];
    const routeMap = Object.fromEntries(flights.map((f) => [f.id, f]));
    const popularRoutesWithDetails = popularRoutes.map((r) => ({
      flightId: r.flightId,
      count: r._count.id,
      origin: routeMap[r.flightId]?.origin?.code,
      destination: routeMap[r.flightId]?.destination?.code,
      route: routeMap[r.flightId] ? `${routeMap[r.flightId].origin?.code} → ${routeMap[r.flightId].destination?.code}` : '',
    }));

    const revenueByDay: { date: string; revenue: number }[] = [];
    for (let d = 6; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      date.setHours(0, 0, 0, 0);
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      const agg = await prisma.booking.aggregate({
        where: { status: 'CONFIRMED', createdAt: { gte: date, lt: next } },
        _sum: { totalAmount: true },
      });
      revenueByDay.push({
        date: date.toISOString().slice(0, 10),
        revenue: agg._sum.totalAmount ? Number(agg._sum.totalAmount) : 0,
      });
    }

    const totalConfirmed = statusCounts.find((s) => s.status === 'CONFIRMED')?._count.id ?? 0;
    const totalCancelled = statusCounts.find((s) => s.status === 'CANCELLED')?._count.id ?? 0;
    const totalPending = statusCounts.find((s) => s.status === 'PENDING')?._count.id ?? 0;
    const totalCheckedIn = statusCounts.find((s) => s.status === 'CHECKED_IN')?._count.id ?? 0;
    const totalCompleted = statusCounts.find((s) => s.status === 'COMPLETED')?._count.id ?? 0;
    const allBookings = totalConfirmed + totalCancelled + totalPending + totalCheckedIn + totalCompleted;
    
    // Cancellation rate = cancelled bookings / all bookings * 100
    const cancellationRate = allBookings > 0 ? (totalCancelled / allBookings) * 100 : 0;

    res.json({
      success: true,
      data: {
        metrics: {
          bookingsToday,
          bookingsWeek,
          bookingsMonth,
          totalBookings,
          revenueToday: revenueToday._sum.totalAmount ? Number(revenueToday._sum.totalAmount) : 0,
          revenueWeek: revenueWeek._sum.totalAmount ? Number(revenueWeek._sum.totalAmount) : 0,
          revenueMonth: revenueMonth._sum.totalAmount ? Number(revenueMonth._sum.totalAmount) : 0,
          totalRevenue: totalRevenue._sum.totalAmount ? Number(totalRevenue._sum.totalAmount) : 0,
          totalUsers,
          pendingRefunds,
          cancellationRate,
        },
        statusDistribution: statusCounts.map((s) => ({ status: s.status, count: s._count.id })),
        paymentDistribution: paymentCounts.map((p) => ({ status: p.status, count: p._count.id })),
        recentBookings: recentBookings.map((b) => ({
          ...b,
          totalAmount: Number(b.totalAmount),
          passengerName: b.passengers[0] ? `${b.passengers[0].firstName} ${b.passengers[0].lastName}` : '',
          segment: b.segments[0],
        })),
        popularRoutes: popularRoutesWithDetails,
        revenueByDay,
      },
    });
  } catch (e) {
    next(e);
  }
});

// ========== BOOKINGS ==========
router.get('/bookings', async (req: AuthRequest, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const pnr = (req.query.pnr as string)?.trim();
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));

    const where: any = {};
    if (status) where.status = status;
    if (pnr) where.pnr = { contains: pnr.toUpperCase(), mode: 'insensitive' };

    const [items, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          user: { select: { id: true, email: true } },
          passengers: true,
          segments: { include: { flight: { include: { airline: true, origin: true, destination: true } } } },
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: items.map((b) => ({
          ...b,
          totalAmount: Number(b.totalAmount),
          discountAmount: b.discountAmount ? Number(b.discountAmount) : null,
          payments: b.payments?.map((p) => ({ ...p, amount: Number(p.amount) })),
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (e) {
    next(e);
  }
});

router.get('/bookings/:pnr', async (req: AuthRequest, res, next) => {
  try {
    const pnr = req.params.pnr.toUpperCase();
    const booking = await prisma.booking.findFirst({
      where: { pnr },
      include: {
        user: { include: { profile: true } },
        passengers: true,
        segments: { include: { flight: { include: { airline: true, origin: true, destination: true } } } },
        payments: true,
      },
    });
    if (!booking) throw new AppError(404, 'Booking not found');
    res.json({
      success: true,
      data: {
        ...booking,
        totalAmount: Number(booking.totalAmount),
        discountAmount: booking.discountAmount ? Number(booking.discountAmount) : null,
        payments: booking.payments?.map((p) => ({ ...p, amount: Number(p.amount) })),
      },
    });
  } catch (e) {
    next(e);
  }
});

// ========== USERS ==========
router.get('/users', async (req: AuthRequest, res, next) => {
  try {
    const search = (req.query.search as string)?.trim();
    const role = req.query.role as string | undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));

    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { firstName: { contains: search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          profile: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (e) {
    next(e);
  }
});

// ========== FLIGHTS ==========
router.get('/flights', async (req: AuthRequest, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const search = (req.query.search as string)?.trim();

    const where: any = {};
    if (search) {
      where.OR = [
        { flightNumber: { contains: search, mode: 'insensitive' } },
        { originId: { contains: search.toUpperCase() } },
        { destinationId: { contains: search.toUpperCase() } },
        { airline: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.flight.findMany({
        where,
        include: { airline: true, origin: true, destination: true, aircraft: true },
        orderBy: { flightNumber: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.flight.count({ where }),
    ]);

    res.json({
      success: true,
      data: { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (e) {
    next(e);
  }
});

router.get('/flights/:id', async (req: AuthRequest, res, next) => {
  try {
    const flight = await prisma.flight.findUnique({
      where: { id: req.params.id },
      include: { airline: true, origin: true, destination: true, aircraft: true, pricingRules: true },
    });
    if (!flight) throw new AppError(404, 'Flight not found');
    res.json({ success: true, data: flight });
  } catch (e) {
    next(e);
  }
});

router.post('/flights', requireRole('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const body = req.body as any;
    
    // Validate required fields
    if (!body.airlineId) throw new AppError(400, 'Airline is required');
    if (!body.flightNumber) throw new AppError(400, 'Flight number is required');
    if (!body.originId) throw new AppError(400, 'Origin airport is required');
    if (!body.destinationId) throw new AppError(400, 'Destination airport is required');
    if (!body.aircraftId) throw new AppError(400, 'Aircraft is required');
    if (!body.departureTime) throw new AppError(400, 'Departure time is required');
    if (!body.arrivalTime) throw new AppError(400, 'Arrival time is required');
    
    // Ensure airport codes are uppercase
    const originId = String(body.originId).toUpperCase().trim();
    const destinationId = String(body.destinationId).toUpperCase().trim();
    
    // Verify airports exist
    const originAirport = await prisma.airport.findUnique({ where: { code: originId } });
    if (!originAirport) throw new AppError(400, `Origin airport '${originId}' not found`);
    
    const destAirport = await prisma.airport.findUnique({ where: { code: destinationId } });
    if (!destAirport) throw new AppError(400, `Destination airport '${destinationId}' not found`);
    
    // Verify airline exists
    const airline = await prisma.airline.findUnique({ where: { id: body.airlineId } });
    if (!airline) throw new AppError(400, 'Airline not found');
    
    // Verify aircraft exists
    const aircraftRecord = await prisma.aircraft.findUnique({ where: { id: body.aircraftId } });
    if (!aircraftRecord) throw new AppError(400, 'Aircraft not found');
    
    const flight = await prisma.flight.create({
      data: {
        airlineId: body.airlineId,
        flightNumber: String(body.flightNumber).trim(),
        originId,
        destinationId,
        aircraftId: body.aircraftId,
        departureTime: String(body.departureTime).trim(),
        arrivalTime: String(body.arrivalTime).trim(),
        durationMinutes: parseInt(String(body.durationMinutes), 10) || 60,
        daysOfOperation: String(body.daysOfOperation || '0,1,2,3,4,5,6').trim(),
      },
      include: { airline: true, origin: true, destination: true, aircraft: true },
    });
    
    // Create inventory for the next 365 days
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setUTCDate(date.getUTCDate() + i);
      
      const dayOfWeek = date.getUTCDay();
      const daysArr = String(body.daysOfOperation || '0,1,2,3,4,5,6').split(',');
      
      // Only create inventory for operating days
      if (daysArr.includes(String(dayOfWeek))) {
        await prisma.flightInventory.upsert({
          where: { flightId_date: { flightId: flight.id, date } },
          update: {},
          create: {
            flightId: flight.id,
            date,
            availableEconomy: aircraftRecord.economySeats,
            availableBusiness: aircraftRecord.businessSeats,
            availableFirstClass: aircraftRecord.firstClassSeats,
          },
        });
      }
    }
    
    // Create pricing rules for all cabin classes
    const baseFares: { [key: string]: number } = {
      ECONOMY: 150,
      PREMIUM_ECONOMY: 250,
      BUSINESS: 500,
      FIRST: 1000,
    };
    
    for (const [cabinClass, baseFare] of Object.entries(baseFares)) {
      await prisma.pricingRule.upsert({
        where: { flightId_cabinClass: { flightId: flight.id, cabinClass: cabinClass as any } },
        update: {},
        create: {
          flightId: flight.id,
          cabinClass: cabinClass as any,
          baseFare: new Decimal(baseFare),
          taxes: new Decimal(Math.round(baseFare * 0.15 * 100) / 100),
          dynamicMultiplier: new Decimal(1),
        },
      });
    }
    
    res.status(201).json({ success: true, data: flight });
  } catch (e) {
    next(e);
  }
});

router.put('/flights/:id', requireRole('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const body = req.body as any;
    
    // Validate origin and destination airports if provided
    if (body.originId) {
      const originId = String(body.originId).toUpperCase().trim();
      const originAirport = await prisma.airport.findUnique({ where: { code: originId } });
      if (!originAirport) throw new AppError(400, `Origin airport '${originId}' not found`);
      body.originId = originId;
    }
    
    if (body.destinationId) {
      const destinationId = String(body.destinationId).toUpperCase().trim();
      const destAirport = await prisma.airport.findUnique({ where: { code: destinationId } });
      if (!destAirport) throw new AppError(400, `Destination airport '${destinationId}' not found`);
      body.destinationId = destinationId;
    }
    
    // Validate airline if provided
    if (body.airlineId) {
      const airline = await prisma.airline.findUnique({ where: { id: body.airlineId } });
      if (!airline) throw new AppError(400, 'Airline not found');
    }
    
    // Validate aircraft if provided
    if (body.aircraftId) {
      const aircraftRecord = await prisma.aircraft.findUnique({ where: { id: body.aircraftId } });
      if (!aircraftRecord) throw new AppError(400, 'Aircraft not found');
    }
    
    const flight = await prisma.flight.update({
      where: { id: req.params.id },
      data: {
        ...(body.airlineId != null && { airlineId: body.airlineId }),
        ...(body.flightNumber != null && { flightNumber: String(body.flightNumber).trim() }),
        ...(body.originId != null && { originId: body.originId }),
        ...(body.destinationId != null && { destinationId: body.destinationId }),
        ...(body.aircraftId != null && { aircraftId: body.aircraftId }),
        ...(body.departureTime != null && { departureTime: String(body.departureTime).trim() }),
        ...(body.arrivalTime != null && { arrivalTime: String(body.arrivalTime).trim() }),
        ...(body.durationMinutes != null && { durationMinutes: parseInt(String(body.durationMinutes), 10) }),
        ...(body.daysOfOperation != null && { daysOfOperation: String(body.daysOfOperation).trim() }),
      },
      include: { airline: true, origin: true, destination: true, aircraft: true },
    });
    res.json({ success: true, data: flight });
  } catch (e) {
    next(e);
  }
});

router.delete('/flights/:id', requireRole('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.bookingSegment.count({ where: { flightId: req.params.id } });
    if (existing > 0) throw new AppError(400, 'Cannot delete flight with existing bookings');
    await prisma.flight.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Flight deleted' });
  } catch (e) {
    next(e);
  }
});

// ========== AIRLINES ==========
router.get('/airlines', async (req: AuthRequest, res, next) => {
  try {
    const airlines = await prisma.airline.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data: airlines });
  } catch (e) {
    next(e);
  }
});

router.post('/airlines', requireRole('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const body = req.body as { name: string; code: string; logoUrl?: string };
    const airline = await prisma.airline.create({
      data: { name: body.name, code: body.code.toUpperCase().slice(0, 5), logoUrl: body.logoUrl },
    });
    res.status(201).json({ success: true, data: airline });
  } catch (e) {
    next(e);
  }
});

router.put('/airlines/:id', requireRole('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const body = req.body as { name?: string; code?: string; logoUrl?: string };
    const airline = await prisma.airline.update({
      where: { id: req.params.id },
      data: body,
    });
    res.json({ success: true, data: airline });
  } catch (e) {
    next(e);
  }
});

router.delete('/airlines/:id', requireRole('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const count = await prisma.flight.count({ where: { airlineId: req.params.id } });
    if (count > 0) throw new AppError(400, 'Cannot delete airline with existing flights');
    await prisma.airline.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Airline deleted' });
  } catch (e) {
    next(e);
  }
});

// ========== AIRCRAFT ==========
router.get('/aircraft', async (req: AuthRequest, res, next) => {
  try {
    const aircraft = await prisma.aircraft.findMany({ orderBy: { model: 'asc' } });
    res.json({ success: true, data: aircraft });
  } catch (e) {
    next(e);
  }
});

router.post('/aircraft', requireRole('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const body = req.body as { model: string; manufacturer: string; totalSeats: number; economySeats: number; businessSeats: number; firstClassSeats?: number };
    const aircraft = await prisma.aircraft.create({
      data: {
        model: body.model,
        manufacturer: body.manufacturer,
        totalSeats: body.totalSeats,
        economySeats: body.economySeats ?? body.totalSeats,
        businessSeats: body.businessSeats ?? 0,
        firstClassSeats: body.firstClassSeats ?? 0,
      },
    });
    res.status(201).json({ success: true, data: aircraft });
  } catch (e) {
    next(e);
  }
});

router.put('/aircraft/:id', requireRole('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const aircraft = await prisma.aircraft.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: aircraft });
  } catch (e) {
    next(e);
  }
});

router.delete('/aircraft/:id', requireRole('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const count = await prisma.flight.count({ where: { aircraftId: req.params.id } });
    if (count > 0) throw new AppError(400, 'Cannot delete aircraft with existing flights');
    await prisma.aircraft.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Aircraft deleted' });
  } catch (e) {
    next(e);
  }
});

// ========== AIRPORTS ==========
router.get('/airports', async (req: AuthRequest, res, next) => {
  try {
    const airports = await prisma.airport.findMany({ orderBy: { code: 'asc' } });
    res.json({ success: true, data: airports });
  } catch (e) {
    next(e);
  }
});

router.post('/airports', requireRole('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const body = req.body as { code: string; name: string; city: string; country: string; timezone: string };
    const airport = await prisma.airport.create({
      data: {
        code: body.code.toUpperCase().slice(0, 3),
        name: body.name,
        city: body.city,
        country: body.country,
        timezone: body.timezone ?? 'UTC',
      },
    });
    res.status(201).json({ success: true, data: airport });
  } catch (e) {
    next(e);
  }
});

router.put('/airports/:code', requireRole('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const body = req.body as { name?: string; city?: string; country?: string; timezone?: string };
    const airport = await prisma.airport.update({
      where: { code: req.params.code.toUpperCase() },
      data: body,
    });
    res.json({ success: true, data: airport });
  } catch (e) {
    next(e);
  }
});

router.delete('/airports/:code', requireRole('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const code = req.params.code.toUpperCase();
    const count = await prisma.flight.count({ where: { OR: [{ originId: code }, { destinationId: code }] } });
    if (count > 0) throw new AppError(400, 'Cannot delete airport with existing flights');
    await prisma.airport.delete({ where: { code } });
    res.json({ success: true, message: 'Airport deleted' });
  } catch (e) {
    next(e);
  }
});

// ========== PROMO CODES ==========
router.get('/promos', async (req: AuthRequest, res, next) => {
  try {
    const promos = await prisma.promoCode.findMany({ orderBy: { validFrom: 'desc' } });
    res.json({
      success: true,
      data: promos.map((p) => ({
        ...p,
        discountValue: Number(p.discountValue),
        minBookingAmount: p.minBookingAmount ? Number(p.minBookingAmount) : null,
      })),
    });
  } catch (e) {
    next(e);
  }
});

router.post('/promos', requireRole('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const body = req.body as any;
    const promo = await prisma.promoCode.create({
      data: {
        code: body.code.toUpperCase(),
        discountType: body.discountType ?? 'PERCENTAGE',
        discountValue: body.discountValue,
        validFrom: new Date(body.validFrom),
        validUntil: new Date(body.validUntil),
        usageLimit: body.usageLimit ?? null,
        minBookingAmount: body.minBookingAmount ?? null,
      },
    });
    res.status(201).json({ success: true, data: promo });
  } catch (e) {
    next(e);
  }
});

router.put('/promos/:id', requireRole('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    const body = req.body as any;
    const promo = await prisma.promoCode.update({
      where: { id: req.params.id },
      data: {
        ...(body.code != null && { code: body.code.toUpperCase() }),
        ...(body.discountType != null && { discountType: body.discountType }),
        ...(body.discountValue != null && { discountValue: body.discountValue }),
        ...(body.validFrom != null && { validFrom: new Date(body.validFrom) }),
        ...(body.validUntil != null && { validUntil: new Date(body.validUntil) }),
        ...(body.usageLimit != null && { usageLimit: body.usageLimit }),
        ...(body.minBookingAmount != null && { minBookingAmount: body.minBookingAmount }),
      },
    });
    res.json({ success: true, data: promo });
  } catch (e) {
    next(e);
  }
});

router.delete('/promos/:id', requireRole('ADMIN'), async (req: AuthRequest, res, next) => {
  try {
    await prisma.promoCode.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Promo code deleted' });
  } catch (e) {
    next(e);
  }
});

export { router as adminRouter };
