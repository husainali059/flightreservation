import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';
import { flightsRouter } from './routes/flights.js';
import { bookingsRouter } from './routes/bookings.js';
import { paymentsRouter } from './routes/payments.js';
import { userRouter } from './routes/user.js';
import { adminRouter } from './routes/admin.js';
import { airportsRouter } from './routes/airports.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT ?? 5000;

// Security
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));

// Health
app.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/airports', airportsRouter);
app.use('/api/flights', flightsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);

// Serve client build in production (before errorHandler so SPA catch-all runs)
if (process.env.NODE_ENV === 'production') {
  const clientDir = path.join(__dirname, '..', 'client', 'dist');
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    express.static(clientDir)(req, res, () => {
      res.sendFile(path.join(clientDir, 'index.html'));
    });
  });
}

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
