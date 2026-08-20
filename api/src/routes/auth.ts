import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import type mysql from 'mysql2';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import {
  bumpTokenVersion,
  createRefreshToken,
  expiresInToMs,
  revokeRefreshToken,
  rotateRefreshToken,
  signAccessToken,
} from '../services/authTokens.js';
import {
  checkLoginAttempts,
  clearLoginAttempts,
  recordLoginFailure,
} from '../services/loginAttempts.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { tooManyRequests, unauthorized } from '../utils/httpError.js';

export const authRouter = Router();

interface AdminRow extends mysql.RowDataPacket {
  id: number;
  site_id: number;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  token_version: number;
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function formatLockMessage(remainingMs: number): string {
  const minutes = Math.ceil(remainingMs / 60000);
  return `Terlalu banyak percobaan login. Coba lagi dalam ${minutes} menit.`;
}

function cookieBaseOptions() {
  return {
    httpOnly: true,
    secure: env.cookie.secure,
    sameSite: env.cookie.sameSite,
    path: '/',
  };
}

function setAuthCookies(res: import('express').Response, accessToken: string, refreshToken: string) {
  res.cookie(env.cookie.name, accessToken, {
    ...cookieBaseOptions(),
    maxAge: expiresInToMs(env.jwt.expiresIn),
  });
  res.cookie(env.cookie.refreshName, refreshToken, {
    ...cookieBaseOptions(),
    maxAge: expiresInToMs(env.jwt.refreshExpiresIn),
  });
}

function clearAuthCookies(res: import('express').Response) {
  res.clearCookie(env.cookie.name, cookieBaseOptions());
  res.clearCookie(env.cookie.refreshName, cookieBaseOptions());
}

function publicAdmin(admin: Pick<AdminRow, 'id' | 'name' | 'email' | 'role'>) {
  return { id: admin.id, name: admin.name, email: admin.email, role: admin.role };
}

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const ip = req.ip ?? 'unknown';

    // 1. Cek status lock sebelum verifikasi kredensial.
    const check = await checkLoginAttempts(body.email, ip);
    if (check.locked) {
      throw tooManyRequests(formatLockMessage(check.remainingMs));
    }

    // 2. Verifikasi kredensial.
    const rows = await query<AdminRow>(
      'SELECT id, site_id, name, email, password_hash, role, token_version FROM admins WHERE email = ?',
      [body.email],
    );
    const admin = rows[0];
    const valid = admin && (await bcrypt.compare(body.password, admin.password_hash));

    if (!valid) {
      const failed = await recordLoginFailure(body.email, ip);
      if (failed.locked) {
        throw tooManyRequests(formatLockMessage(3 * 60 * 1000));
      }
      throw unauthorized(
        `Email atau password salah. Sisa percobaan: ${failed.attemptsLeft}.`,
      );
    }

    // 3. Sukses — reset counter percobaan.
    await clearLoginAttempts(body.email, ip);

    // 4. Terbitkan access (umur pendek) + refresh token (rotasi).
    const accessToken = signAccessToken({
      id: admin.id,
      siteId: admin.site_id,
      email: admin.email,
      role: admin.role,
      tokenVersion: admin.token_version,
    });
    const refreshToken = await createRefreshToken(admin.id);
    setAuthCookies(res, accessToken, refreshToken);

    res.json({ admin: publicAdmin(admin) });
  }),
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const raw = (req.cookies as Record<string, string | undefined>)[env.cookie.refreshName];
    if (!raw) throw unauthorized('Refresh token tidak ditemukan.');

    // Rotasi: token lama dicabut, token baru diterbitkan.
    const result = await rotateRefreshToken(raw);
    if (!result) throw unauthorized('Refresh token tidak valid atau sudah dipakai.');

    const accessToken = signAccessToken(result.admin);
    setAuthCookies(res, accessToken, result.raw);

    res.json({
      admin: {
        id: result.admin.id,
        name: result.name,
        email: result.admin.email,
        role: result.admin.role,
      },
    });
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const raw = (req.cookies as Record<string, string | undefined>)[env.cookie.refreshName];

    // Cabut refresh token ini + naikkan token_version → semua access token langsung mati.
    if (raw) {
      const adminId = await revokeRefreshToken(raw);
      if (adminId) await bumpTokenVersion(adminId);
    }

    clearAuthCookies(res);
    res.json({ success: true });
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const rows = await query<AdminRow>(
      'SELECT id, site_id, name, email, role FROM admins WHERE id = ?',
      [req.admin!.id],
    );
    if (!rows[0]) throw unauthorized('Admin tidak ditemukan.');
    res.json({ admin: publicAdmin(rows[0]) });
  }),
);