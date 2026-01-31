import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, refreshTokenSchema } from '../validators/auth.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken, getAccessExpirySeconds } from '../utils/jwt.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors[0]?.message ?? 'Validation failed');
    }
    const { email, password, firstName, lastName } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError(400, 'Email already registered');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        profile: {
          create: { firstName, lastName },
        },
      },
      include: { profile: true },
    });

    const accessToken = signAccessToken(user.id, user.email, user.role);
    const refreshToken = signRefreshToken(user.id, user.email, user.role);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          profile: user.profile,
        },
        accessToken,
        refreshToken,
        expiresIn: getAccessExpirySeconds(),
      },
    });
  } catch (e) {
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors[0]?.message ?? 'Validation failed');
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
    if (!user) throw new AppError(401, 'Invalid email or password');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError(401, 'Invalid email or password');

    const accessToken = signAccessToken(user.id, user.email, user.role);
    const refreshToken = signRefreshToken(user.id, user.email, user.role);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          profile: user.profile,
        },
        accessToken,
        refreshToken,
        expiresIn: getAccessExpirySeconds(),
      },
    });
  } catch (e) {
    next(e);
  }
});

router.post('/logout', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (req.user?.userId) {
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { refreshToken: null },
      });
    }
    res.json({ success: true, message: 'Logged out' });
  } catch (e) {
    next(e);
  }
});

router.post('/refresh-token', async (req, res, next) => {
  try {
    const parsed = refreshTokenSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'Refresh token required');
    const { refreshToken } = parsed.data;

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, refreshToken: true },
    });
    if (!user || user.refreshToken !== refreshToken) {
      throw new AppError(401, 'Invalid refresh token');
    }

    const accessToken = signAccessToken(user.id, user.email, user.role);
    res.json({
      success: true,
      data: {
        accessToken,
        expiresIn: getAccessExpirySeconds(),
      },
    });
  } catch (e) {
    next(e);
  }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'Valid email required');
    // In production: generate token, store, send email. For now just acknowledge.
    res.json({ success: true, message: 'If the email exists, you will receive reset instructions.' });
  } catch (e) {
    next(e);
  }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'Token and new password required');
    // In production: verify token, update password. For now just acknowledge.
    res.json({ success: true, message: 'Password has been reset.' });
  } catch (e) {
    next(e);
  }
});

export { router as authRouter };
