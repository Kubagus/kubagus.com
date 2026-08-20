import type mysql from 'mysql2';
import { execute, query } from '../config/db.js';

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCK_DURATION_MS = 3 * 60 * 1000; // 3 menit

/**
 * Rate limit login persisten di tabel login_attempts (tidak hilang saat server restart,
 * dan bisa dipakai bersama antar instance).
 */

interface AttemptRow extends mysql.RowDataPacket {
  attempts: number;
  locked_until: Date | null;
}

async function getEntry(email: string, ip: string): Promise<AttemptRow | null> {
  const rows = await query<AttemptRow>(
    'SELECT attempts, locked_until FROM login_attempts WHERE email = ? AND ip = ?',
    [email, ip],
  );
  return rows[0] ?? null;
}

export interface LoginCheck {
  locked: boolean;
  /** Sisa waktu lock dalam milidetik (0 jika tidak terkunci). */
  remainingMs: number;
  /** Sisa percobaan sebelum terkunci (hanya jika belum terkunci). */
  attemptsLeft: number;
}

export async function checkLoginAttempts(email: string, ip: string): Promise<LoginCheck> {
  const entry = await getEntry(email, ip);
  const lockedUntil = entry?.locked_until ? new Date(entry.locked_until).getTime() : null;

  if (lockedUntil && lockedUntil > Date.now()) {
    return { locked: true, remainingMs: lockedUntil - Date.now(), attemptsLeft: 0 };
  }
  return {
    locked: false,
    remainingMs: 0,
    attemptsLeft: Math.max(0, MAX_LOGIN_ATTEMPTS - (entry?.attempts ?? 0)),
  };
}

export async function recordLoginFailure(
  email: string,
  ip: string,
): Promise<{ locked: boolean; attemptsLeft: number }> {
  await execute(
    `INSERT INTO login_attempts (email, ip, attempts) VALUES (?, ?, 1)
     ON DUPLICATE KEY UPDATE attempts = attempts + 1`,
    [email, ip],
  );

  const entry = await getEntry(email, ip);
  const attempts = entry?.attempts ?? 1;

  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    await execute(
      'UPDATE login_attempts SET attempts = 0, locked_until = DATE_ADD(NOW(), INTERVAL ? SECOND) WHERE email = ? AND ip = ?',
      [Math.ceil(LOCK_DURATION_MS / 1000), email, ip],
    );
    return { locked: true, attemptsLeft: 0 };
  }
  return { locked: false, attemptsLeft: MAX_LOGIN_ATTEMPTS - attempts };
}

export async function clearLoginAttempts(email: string, ip: string): Promise<void> {
  await execute('DELETE FROM login_attempts WHERE email = ? AND ip = ?', [email, ip]);
}