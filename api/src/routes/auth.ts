import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import type mysql from 'mysql2';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { unauthorized } from '../utils/httpError.js';

export const authRouter = Router();

interface AdminRow extends mysql.RowDataPacket {
  id: number;
  site_id: number;
  name: string;
  email: string;
  password_hash: string;
  role: string;
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function setAuthCookie(res: import('express').Response, token: string) {
  res.cookie(env.cookie.name, token, {
    httpOnly: true,
    secure: env.cookie.secure,
    sameSite: env.cookie.sameSite,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookie(res: import('express').Response) {
  res.clearCookie(env.cookie.name, {
    httpOnly: true,
    secure: env.cookie.secure,
    sameSite: env.cookie.sameSite,
    path: '/',
  });
}

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);

    const rows = await query<AdminRow>(
      'SELECT id, site_id, name, email, password_hash, role FROM admins WHERE email = ?',
      [body.email],
    );
    const admin = rows[0];
    if (!admin || !(await bcrypt.compare(body.password, admin.password_hash))) {
      throw unauthorized('Email atau password salah.');
    }

    const token = jwt.sign(
      { id: admin.id, siteId: admin.site_id, email: admin.email, role: admin.role },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn as jwt.SignOptions['expiresIn'] },
    );

    setAuthCookie(res, token);

    res.json({ admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (_req, res) => {
    clearAuthCookie(res);
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
    res.json({ admin: { id: rows[0].id, name: rows[0].name, email: rows[0].email, role: rows[0].role } });
  }),
);
