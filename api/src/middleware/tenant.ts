import { NextFunction, Request, Response } from 'express';
import type mysql from 'mysql2';
import { pool } from '../config/db.js';
import { AppError } from '../utils/httpError.js';
import { env } from '../config/env.js';

export interface SiteInfo {
  id: number;
  key: string;
  domain: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      siteId?: number;
      site?: SiteInfo;
    }
  }
}

interface CacheEntry {
  info: SiteInfo | null;
  ts: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 1000;
const siteCache = new Map<string, CacheEntry>();

interface SiteRow extends mysql.RowDataPacket {
  id: number;
  key_name: string;
  domain: string;
}

function isLoopbackHost(host: string | undefined): boolean {
  if (!host) return true;
  return /^localhost(:|$)|^127\.\d{1,3}\.\d{1,3}\.\d{1,3}(:|$)|^\[::1\](:|$)/.test(host);
}

function cacheGet(hostname: string): CacheEntry | undefined {
  const entry = siteCache.get(hostname);
  if (entry && Date.now() - entry.ts > CACHE_TTL_MS) {
    siteCache.delete(hostname);
    return undefined;
  }
  return entry;
}

function cacheSet(hostname: string, info: SiteInfo | null) {
  if (siteCache.size >= CACHE_MAX_ENTRIES) siteCache.clear();
  siteCache.set(hostname, { info, ts: Date.now() });
}

async function loadSiteByHost(host: string): Promise<SiteInfo | null> {
  const hostname = host.split(':')[0].toLowerCase();
  const cached = cacheGet(hostname);
  if (cached) return cached.info;

  const [rows] = await pool.execute<SiteRow[]>(
    'SELECT id, key_name, domain FROM sites WHERE is_active = 1',
  );

  const byDomain = rows.find((r) => r.domain.toLowerCase() === hostname);
  if (byDomain) {
    const info: SiteInfo = { id: byDomain.id, key: byDomain.key_name, domain: byDomain.domain };
    cacheSet(hostname, info);
    return info;
  }

  const base = hostname.split('.').slice(-2).join('.');
  const sub = hostname.slice(0, hostname.length - base.length - 1);
  if (sub) {
    const bySub = rows.find(
      (r) => r.key_name.toLowerCase() === sub || r.domain.split('.')[0] === sub,
    );
    if (bySub) {
      const info: SiteInfo = { id: bySub.id, key: bySub.key_name, domain: bySub.domain };
      cacheSet(hostname, info);
      return info;
    }
  }

  cacheSet(hostname, null);
  return null;
}

export async function tenantMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const host = req.headers.host;
    let site: SiteInfo | null = null;

    if (!isLoopbackHost(host) && host) {
      site = await loadSiteByHost(host);
    }

    // Fallback (X-Site-Key / ?site=) hanya untuk koneksi loopback (dev),
    // agar tenant tidak bisa dipilih bebas lewat header/query di produksi.
    if (!site && isLoopbackHost(host)) {
      const fallbackKey = (req.headers['x-site-key'] as string) || (req.query.site as string) || 'portfolio';
      const [rows] = await pool.execute<SiteRow[]>(
        'SELECT id, key_name, domain FROM sites WHERE key_name = ? AND is_active = 1',
        [fallbackKey],
      );
      if (rows[0]) site = { id: rows[0].id, key: rows[0].key_name, domain: rows[0].domain };
    }

    if (!site) {
      throw new AppError(
        env.isProd
          ? 'Situs tidak ditemukan.'
          : 'Situs tidak ditemukan. Periksa Host header atau X-Site-Key.',
        404,
      );
    }

    req.site = site;
    req.siteId = site.id;
    next();
  } catch (err) {
    next(err);
  }
}