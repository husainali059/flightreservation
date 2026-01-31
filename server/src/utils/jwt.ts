import jwt, { type SignOptions } from 'jsonwebtoken';
import type { UserRole } from '@flight-reservation/shared';
import type { JwtPayload } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? 'dev-refresh';
const ACCESS_EXPIRY = process.env.JWT_EXPIRES_IN ?? '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';

export function signAccessToken(userId: string, email: string, role: UserRole): string {
  return jwt.sign(
    { userId, email, role, type: 'access' } as object,
    JWT_SECRET as jwt.Secret,
    { expiresIn: ACCESS_EXPIRY } as SignOptions
  );
}

export function signRefreshToken(userId: string, email: string, role: UserRole): string {
  return jwt.sign(
    { userId, email, role, type: 'refresh' } as object,
    JWT_REFRESH_SECRET as jwt.Secret,
    { expiresIn: REFRESH_EXPIRY } as SignOptions
  );
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
}

export function getAccessExpirySeconds(): number {
  if (ACCESS_EXPIRY.endsWith('m')) return parseInt(ACCESS_EXPIRY, 10) * 60;
  if (ACCESS_EXPIRY.endsWith('h')) return parseInt(ACCESS_EXPIRY, 10) * 3600;
  if (ACCESS_EXPIRY.endsWith('d')) return parseInt(ACCESS_EXPIRY, 10) * 86400;
  return 900; // 15 min default
}
