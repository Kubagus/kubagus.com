import { NextFunction, Request, Response } from 'express';
import type mysql from 'mysql2';
import { pool } from '../config/db.js';
import { AppError } from '../utils/httpError.js';

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

const siteCache = new Map<string, SiteInfo>();

interface SiteRow extends mysql.RowDataPacket {
  id: number;
  key_name: string;
  domain: string;
}

async function loadSiteByHost(host: string): Promise<SiteInfo | null> {
  const hostname = host.split(':')[0].toLowerCase();
  if (siteCache.has(hostname)) return siteCache.get(hostname)!;

  const [rows] = await pool.execute<SiteRow[]>(
    'SELECT id, key_name, domain FROM sites WHERE is_active = 1',
  );

  const byDomain = rows.find((r) => r.domain.toLowerCase() === hostname);
  if (byDomain) {
    const info: SiteInfo = { id: byDomain.id, key: byDomain.key_name, domain: byDomain.domain };
    siteCache.set(hostname, info);
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
      siteCache.set(hostname, info);
      return info;
    }
  }

  siteCache.set(hostname, null as unknown as SiteInfo);
  return null;
}

export async function tenantMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const host = req.headers.host;
    let site: SiteInfo | null = null;

    if (host && !/^localhost(:|$)|^127\.0\.0\.1(:|$)/.test(host)) {
      site = await loadSiteByHost(host);
    }

    if (!site) {
      const fallbackKey = (req.headers['x-site-key'] as string) || (req.query.site as string) || 'portfolio';
      const [rows] = await pool.execute<SiteRow[]>(
        'SELECT id, key_name, domain FROM sites WHERE key_name = ? AND is_active = 1',
        [fallbackKey],
      );
      if (rows[0]) site = { id: rows[0].id, key: rows[0].key_name, domain: rows[0].domain };
    }

    if (!site) {
      throw new AppError('Situs tidak ditemukan. Periksa Host header atau X-Site-Key.', 404);
    }

    req.site = site;
    req.siteId = site.id;
    next();
  } catch (err) {
    next(err);
  }
}
