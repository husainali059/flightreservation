import { Router } from 'express';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';

const router = Router();

router.use(authenticate);

router.get('/profile', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) throw new AppError(404, 'User not found');
    res.json({ success: true, data: user });
  } catch (e) {
    next(e);
  }
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

router.put('/profile', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'Invalid profile data');

    const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    if (!user?.profile) throw new AppError(404, 'Profile not found');

    const { firstName, lastName, phone, dateOfBirth } = parsed.data;
    await prisma.profile.update({
      where: { id: user.profile.id },
      data: {
        ...(firstName != null && { firstName }),
        ...(lastName != null && { lastName }),
        ...(phone != null && { phone }),
        ...(dateOfBirth != null && { dateOfBirth: new Date(dateOfBirth) }),
      },
    });
    const updated = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
});

router.get('/travelers', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const travelers = await prisma.savedTraveler.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: travelers });
  } catch (e) {
    next(e);
  }
});

const savedTravelerSchema = z.object({
  title: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.string().min(1),
  passportNumber: z.string().optional(),
  passportExpiry: z.string().optional(),
  nationality: z.string().optional(),
});

router.post('/travelers', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const parsed = savedTravelerSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, parsed.error.errors[0]?.message ?? 'Validation failed');

    const traveler = await prisma.savedTraveler.create({
      data: {
        userId,
        ...parsed.data,
        passportExpiry: parsed.data.passportExpiry ? new Date(parsed.data.passportExpiry) : undefined,
      },
    });
    res.status(201).json({ success: true, data: traveler });
  } catch (e) {
    next(e);
  }
});

router.get('/loyalty-points', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    let points = await prisma.loyaltyPoints.findUnique({ where: { userId } });
    if (!points) {
      points = await prisma.loyaltyPoints.create({
        data: { userId, pointsBalance: 0, totalEarned: 0, totalRedeemed: 0 },
      });
    }
    res.json({ success: true, data: points });
  } catch (e) {
    next(e);
  }
});

router.get('/loyalty/transactions', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const txns = await prisma.loyaltyTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    res.json({ success: true, data: txns });
  } catch (e) {
    next(e);
  }
});

// Notifications
router.get('/notifications', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const unreadOnly = req.query.unread === 'true';
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const notifications = await prisma.userNotification.findMany({
      where: { userId, ...(unreadOnly ? { read: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    const unreadCount = await prisma.userNotification.count({
      where: { userId, read: false },
    });
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (e) {
    next(e);
  }
});

router.patch('/notifications/:id/read', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id;
    await prisma.userNotification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
    res.json({ success: true, message: 'Marked as read' });
  } catch (e) {
    next(e);
  }
});

router.patch('/notifications/read-all', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    await prisma.userNotification.updateMany({
      where: { userId },
      data: { read: true },
    });
    res.json({ success: true, message: 'All marked as read' });
  } catch (e) {
    next(e);
  }
});

// Search history
const searchHistorySchema = z.object({
  origin: z.string().min(1),
  destination: z.string().min(1),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z.string().optional(),
  tripType: z.enum(['ONE_WAY', 'ROUND_TRIP', 'MULTI_CITY']).default('ONE_WAY'),
  adults: z.number().min(1).max(9).default(1),
  children: z.number().min(0).max(9).default(0),
  infants: z.number().min(0).max(9).default(0),
  cabinClass: z.string().default('ECONOMY'),
});

router.post('/search-history', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const parsed = searchHistorySchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'Invalid search data');
    const record = await prisma.searchHistory.create({
      data: { userId, ...parsed.data },
    });
    res.status(201).json({ success: true, data: record });
  } catch (e) {
    next(e);
  }
});

router.get('/search-history', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const history = await prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    res.json({ success: true, data: history });
  } catch (e) {
    next(e);
  }
});

router.delete('/search-history/:id', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    await prisma.searchHistory.deleteMany({ where: { id: req.params.id, userId } });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    next(e);
  }
});

router.delete('/search-history', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    await prisma.searchHistory.deleteMany({ where: { userId } });
    res.json({ success: true, message: 'All cleared' });
  } catch (e) {
    next(e);
  }
});

// Saved routes (wishlist)
const savedRouteSchema = z.object({
  origin: z.string().min(1),
  destination: z.string().min(1),
  priceAlert: z.boolean().optional(),
  targetPrice: z.number().optional(),
  cabinClass: z.string().optional(),
});

router.get('/saved-routes', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const routes = await prisma.savedRoute.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: routes });
  } catch (e) {
    next(e);
  }
});

router.post('/saved-routes', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const parsed = savedRouteSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'Invalid route data');
    const existing = await prisma.savedRoute.findFirst({
      where: { userId, origin: parsed.data.origin, destination: parsed.data.destination },
    });
    if (existing) {
      const updated = await prisma.savedRoute.update({
        where: { id: existing.id },
        data: { priceAlert: parsed.data.priceAlert, targetPrice: parsed.data.targetPrice, cabinClass: parsed.data.cabinClass },
      });
      return res.json({ success: true, data: updated });
    }
    const record = await prisma.savedRoute.create({
      data: {
        userId,
        origin: parsed.data.origin,
        destination: parsed.data.destination,
        priceAlert: parsed.data.priceAlert ?? false,
        targetPrice: parsed.data.targetPrice,
        cabinClass: parsed.data.cabinClass,
      },
    });
    res.status(201).json({ success: true, data: record });
  } catch (e) {
    next(e);
  }
});

router.delete('/saved-routes/:id', async (req: AuthRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    await prisma.savedRoute.deleteMany({ where: { id: req.params.id, userId } });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    next(e);
  }
});

export { router as userRouter };
