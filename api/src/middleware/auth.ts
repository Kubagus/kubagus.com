import { NextFunction, Request, Response } from 'express';
import type mysql from 'mysql2';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { verifyAccessToken } from '../services/authTokens.js';
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

interface AdminRow extends mysql.RowDataPacket {
  token_version: number;
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) {
      return next(unauthorized('Token tidak ditemukan.'));
    }

    // Verifikasi ketat: HS256 + issuer + audience.
    const payload = verifyAccessToken(token);
    if (!payload) {
      return next(unauthorized('Token tidak valid atau kedaluwarsa.'));
    }

    // Cek token_version di DB — token lama tidak valid setelah logout/ganti password.
    const rows = await query<AdminRow>('SELECT token_version FROM admins WHERE id = ?', [payload.id]);
    const admin = rows[0];
    if (!admin) {
      return next(unauthorized('Admin tidak ditemukan.'));
    }
    if (admin.token_version !== payload.v) {
      return next(unauthorized('Sesi telah dicabut. Silakan login kembali.'));
    }

    req.admin = { id: payload.id, siteId: payload.siteId, email: payload.email, role: payload.role };
    next();
  } catch (err) {
    next(err);
  }
}