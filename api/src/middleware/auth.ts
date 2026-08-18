import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { unauthorized } from '../utils/httpError.js';

export interface AdminPayload {
  id: number;
  siteId: number;
  email: string;
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminPayload;
    }
  }
}

/** Ambil JWT dari cookie HTTP-only, fallback ke Authorization header (untuk pengujian). */
function extractToken(req: Request): string | null {
  const fromCookie = (req.cookies as Record<string, string | undefined> | undefined)?.[env.cookie.name];
  if (fromCookie) return fromCookie;

  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);

  return null;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return next(unauthorized('Token tidak ditemukan.'));
  }
  try {
    const payload = jwt.verify(token, env.jwt.secret, { algorithms: ['HS256'] }) as {
      id: number;
      siteId: number;
      email: string;
      role: string;
    };
    req.admin = { id: payload.id, siteId: payload.siteId, email: payload.email, role: payload.role };
    next();
  } catch {
    next(unauthorized('Token tidak valid atau kedaluwarsa.'));
  }
}
