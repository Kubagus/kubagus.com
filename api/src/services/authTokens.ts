import { createHash, randomBytes, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type mysql from 'mysql2';
import { execute, pool, query } from '../config/db.js';
import { env } from '../config/env.js';

export interface AdminAuthInfo {
  id: number;
  siteId: number;
  email: string;
  role: string;
  tokenVersion: number;
}

export interface AccessPayload extends AdminAuthInfo {
  /** token_version saat token diterbitkan — dipakai untuk revoke semua sesi. */
  v: number;
  /** ID unik token — siap dipakai denylist/audit log. */
  jti: string;
}

/** Ubah "1h" / "7d" / "30m" menjadi milidetik (default: 1 jam). */
export function expiresInToMs(expiresIn: string): number {
  const match = /^(\d+)([smhd])$/.exec(expiresIn.trim());
  if (!match) return 60 * 60 * 1000;
  const value = Number(match[1]);
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2] as 's' | 'm' | 'h' | 'd'];
  return value * unitMs;
}

export function signAccessToken(admin: AdminAuthInfo): string {
  return jwt.sign(
    {
      id: admin.id,
      siteId: admin.siteId,
      email: admin.email,
      role: admin.role,
      v: admin.tokenVersion,
      jti: randomUUID(),
    },
    env.jwt.secret,
    {
      algorithm: 'HS256',
      expiresIn: env.jwt.expiresIn as jwt.SignOptions['expiresIn'],
      issuer: env.jwt.issuer,
      audience: env.jwt.audience,
    },
  );
}

/** Verifikasi access token: HS256 + issuer + audience ketat. Mengembalikan null jika tidak valid. */
export function verifyAccessToken(token: string): AccessPayload | null {
  try {
    return jwt.verify(token, env.jwt.secret, {
      algorithms: ['HS256'],
      issuer: env.jwt.issuer,
      audience: env.jwt.audience,
    }) as AccessPayload;
  } catch {
    return null;
  }
}

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function newRawToken(): string {
  return randomBytes(32).toString('hex');
}

/** Terbitkan refresh token acak; hanya hash SHA-256-nya yang disimpan di DB. */
export async function createRefreshToken(adminId: number): Promise<string> {
  const raw = newRawToken();
  const expiresAt = new Date(Date.now() + expiresInToMs(env.jwt.refreshExpiresIn));
  await execute(
    'INSERT INTO admin_refresh_tokens (admin_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [adminId, hashToken(raw), expiresAt],
  );
  return raw;
}

interface RefreshRow extends mysql.RowDataPacket {
  id: number;
  admin_id: number;
  token_hash: string;
  expires_at: Date;
  revoked: number;
  replaced_by: string | null;
  site_id: number;
  name: string;
  email: string;
  role: string;
  token_version: number;
}

export interface RefreshResult {
  raw: string;
  admin: AdminAuthInfo;
  name: string;
}

/**
 * Rotasi refresh token: validasi (belum dicabut/diganti/kedaluwarsa), tandai yang lama
 * revoked + replaced_by, lalu terbitkan yang baru. Mengembalikan null jika tidak valid.
 */
export async function rotateRefreshToken(raw: string): Promise<RefreshResult | null> {
  const rows = await query<RefreshRow>(
    `SELECT rt.id, rt.admin_id, rt.token_hash, rt.expires_at, rt.revoked, rt.replaced_by,
            a.site_id, a.name, a.email, a.role, a.token_version
     FROM admin_refresh_tokens rt
     JOIN admins a ON a.id = rt.admin_id
     WHERE rt.token_hash = ?`,
    [hashToken(raw)],
  );
  const row = rows[0];
  if (!row || row.revoked !== 0 || row.replaced_by !== null || row.expires_at.getTime() <= Date.now()) {
    return null;
  }

  const newRaw = newRawToken();
  const newHash = hashToken(newRaw);
  const expiresAt = new Date(Date.now() + expiresInToMs(env.jwt.refreshExpiresIn));

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      'UPDATE admin_refresh_tokens SET revoked = 1, replaced_by = ? WHERE id = ?',
      [newHash, row.id],
    );
    await conn.query(
      'INSERT INTO admin_refresh_tokens (admin_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [row.admin_id, newHash, expiresAt],
    );
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  return {
    raw: newRaw,
    name: row.name,
    admin: {
      id: row.admin_id,
      siteId: row.site_id,
      email: row.email,
      role: row.role,
      tokenVersion: row.token_version,
    },
  };
}

interface RefreshRowMin extends mysql.RowDataPacket {
  id: number;
  admin_id: number;
}

/** Cabut (revoke) refresh token tertentu. Mengembalikan admin_id jika ditemukan, selain itu null. */
export async function revokeRefreshToken(raw: string): Promise<number | null> {
  const rows = await query<RefreshRowMin>(
    'SELECT id, admin_id FROM admin_refresh_tokens WHERE token_hash = ?',
    [hashToken(raw)],
  );
  const row = rows[0];
  if (!row) return null;
  await execute('UPDATE admin_refresh_tokens SET revoked = 1 WHERE id = ?', [row.id]);
  return row.admin_id;
}

/** Naikkan token_version admin → semua access token lama langsung tidak valid. */
export async function bumpTokenVersion(adminId: number): Promise<void> {
  await execute('UPDATE admins SET token_version = token_version + 1 WHERE id = ?', [adminId]);
}