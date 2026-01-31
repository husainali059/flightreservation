import { Router } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import { prisma } from '../utils/prisma.js';

const router = Router();

// Get all airports (public endpoint)
router.get('/', async (req, res, next) => {
  try {
    const airports = await prisma.airport.findMany({
      orderBy: { city: 'asc' },
    });
    res.json({ success: true, data: airports });
  } catch (e) {
    next(e);
  }
});

router.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q as string)?.trim();
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }
    const term = `%${q.toUpperCase()}%`;
    const airports = await prisma.airport.findMany({
      where: {
        OR: [
          { code: { contains: q.toUpperCase(), mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { city: { contains: q, mode: 'insensitive' } },
          { country: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 15,
    });
    res.json({ success: true, data: airports });
  } catch (e) {
    next(e);
  }
});

export { router as airportsRouter };
