import { Router } from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
const prisma = new PrismaClient();
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

router.post('/create-intent', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { bookingId, amount } = req.body as { bookingId: string; amount: number };
    if (!bookingId || !amount || amount <= 0) throw new AppError(400, 'bookingId and amount required');

    const userId = req.user!.userId;
    const booking = await prisma.booking.findFirst({ where: { id: bookingId, userId } });
    if (!booking) throw new AppError(404, 'Booking not found');
    if (booking.status !== 'PENDING') throw new AppError(400, 'Booking already paid or cancelled');

    const amountCents = Math.round(amount * 100);
    if (!stripe) {
      return res.json({
        success: true,
        data: {
          clientSecret: 'pi_demo_secret_' + bookingId,
          paymentIntentId: 'pi_demo_' + bookingId,
        },
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: (booking.currency || 'usd').toLowerCase(),
      metadata: { bookingId, userId },
      automatic_payment_methods: { enabled: true },
    });

    await prisma.payment.create({
      data: {
        bookingId,
        amount: amount,
        currency: booking.currency ?? 'USD',
        paymentMethod: 'CARD',
        status: 'PENDING',
        stripePaymentId: paymentIntent.id,
      },
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    });
  } catch (e) {
    next(e);
  }
});

router.post('/confirm', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { paymentIntentId, bookingId } = req.body as { paymentIntentId: string; bookingId: string };
    if (!bookingId) throw new AppError(400, 'bookingId required');

    const userId = req.user!.userId;
    const booking = await prisma.booking.findFirst({ where: { id: bookingId, userId } });
    if (!booking) throw new AppError(404, 'Booking not found');

    if (!stripe || !paymentIntentId) {
      await prisma.payment.updateMany({
        where: { bookingId, stripePaymentId: paymentIntentId || undefined },
        data: { status: 'SUCCEEDED', transactionId: 'demo_txn_' + Date.now() },
      });
      await prisma.booking.update({ where: { id: bookingId }, data: { status: 'CONFIRMED' } });
      return res.json({ success: true, message: 'Payment confirmed' });
    }

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== 'succeeded') throw new AppError(400, 'Payment not completed');

    await prisma.payment.updateMany({
      where: { bookingId, stripePaymentId: paymentIntentId },
      data: { status: 'SUCCEEDED', transactionId: pi.id },
    });
    await prisma.booking.update({ where: { id: bookingId }, data: { status: 'CONFIRMED' } });

    res.json({ success: true, message: 'Payment confirmed' });
  } catch (e) {
    next(e);
  }
});

router.post('/refund', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { bookingId } = req.body as { bookingId: string };
    if (!bookingId) throw new AppError(400, 'bookingId required');

    const userId = req.user!.userId;
    const booking = await prisma.booking.findFirst({ where: { id: bookingId, userId } });
    if (!booking) throw new AppError(404, 'Booking not found');

    const payment = await prisma.payment.findFirst({
      where: { bookingId, status: 'SUCCEEDED' },
    });
    if (!payment) throw new AppError(400, 'No successful payment to refund');

    if (stripe && payment.stripePaymentId) {
      await stripe.refunds.create({ payment_intent: payment.stripePaymentId });
    }
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'REFUNDED' } });
    await prisma.booking.update({ where: { id: bookingId }, data: { status: 'CANCELLED' } });

    res.json({ success: true, message: 'Refund initiated' });
  } catch (e) {
    next(e);
  }
});

export { router as paymentsRouter };
