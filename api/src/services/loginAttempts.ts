export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCK_DURATION_MS = 3 * 60 * 1000; // 3 menit

interface Entry {
  count: number;
  lockedUntil: number | null;
}

const store = new Map<string, Entry>();

function keyOf(email: string, ip: string): string {
  return `${email.trim().toLowerCase()}|${ip}`;
}

function pruneExpired(key: string) {
  const entry = store.get(key);
  if (entry && entry.lockedUntil && entry.lockedUntil <= Date.now()) {
    store.delete(key);
  }
}

export interface LoginCheck {
  locked: boolean;
  /** Sisa waktu lock dalam milidetik (0 jika tidak terkunci). */
  remainingMs: number;
  /** Sisa percobaan sebelum terkunci (hanya jika belum terkunci). */
  attemptsLeft: number;
}

export function checkLoginAttempts(email: string, ip: string): LoginCheck {
  const key = keyOf(email, ip);
  pruneExpired(key);
  const entry = store.get(key);
  if (entry?.lockedUntil) {
    return {
      locked: true,
      remainingMs: entry.lockedUntil - Date.now(),
      attemptsLeft: 0,
    };
  }
  return {
    locked: false,
    remainingMs: 0,
    attemptsLeft: Math.max(0, MAX_LOGIN_ATTEMPTS - (entry?.count ?? 0)),
  };
}

export function recordLoginFailure(email: string, ip: string): { locked: boolean; attemptsLeft: number } {
  const key = keyOf(email, ip);
  pruneExpired(key);
  const entry = store.get(key) ?? { count: 0, lockedUntil: null };
  entry.count += 1;
  if (entry.count >= MAX_LOGIN_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCK_DURATION_MS;
    entry.count = 0;
    store.set(key, entry);
    return { locked: true, attemptsLeft: 0 };
  }
  store.set(key, entry);
  return { locked: false, attemptsLeft: MAX_LOGIN_ATTEMPTS - entry.count };
}

export function clearLoginAttempts(email: string, ip: string) {
  store.delete(keyOf(email, ip));
}
