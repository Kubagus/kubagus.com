import { Router } from 'express';
import { z } from 'zod';
import type mysql from 'mysql2';
import { query, execute } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { langCols, pickLang, type Lang } from '../utils/lang.js';
import { badRequest, notFound } from '../utils/httpError.js';

export const publicRouter = Router();

/* ---------- Profile ---------- */

interface ProfileRow extends mysql.RowDataPacket {
  name: string;
  title: string | null;
  headline: string | null;
  summary: string | null;
  profile_picture: string | null;
  location: string | null;
  cv_url: string | null;
  email: string | null;
  phone: string | null;
  available_for_hire: number;
  badge_show: number;
  badge_text: string | null;
}

interface SocialRow extends mysql.RowDataPacket {
  id: number;
  platform: string;
  url: string;
  icon: string | null;
  sort_order: number;
}

publicRouter.get(
  '/:lang/profile',
  asyncHandler(async (req, res) => {
    const lang = pickLang(req.params.lang);
    const rows = await query<ProfileRow>(
      `SELECT name, ${langCols(lang, ['title', 'headline', 'summary', 'location', 'cv_url', 'badge_text'])},
        profile_picture, email, phone, available_for_hire, badge_show
       FROM profile WHERE site_id = ?`,
      [req.siteId],
    );
    if (!rows[0]) throw notFound('Profil tidak ditemukan.');

    const socials = await query<SocialRow>(
      'SELECT id, platform, url, icon, sort_order FROM social_links WHERE site_id = ? AND is_active = 1 ORDER BY sort_order ASC',
      [req.siteId],
    );

    res.json({ ...rows[0], socials });
  }),
);

/* ---------- Experiences & Educations ---------- */

interface TimelineRow extends mysql.RowDataPacket {
  id: number;
  company: string | null;
  institution: string | null;
  position: string | null;
  degree: string | null;
  description: string | null;
  start_date: Date;
  end_date: Date | null;
  is_current: number;
}

publicRouter.get(
  '/:lang/experiences',
  asyncHandler(async (req, res) => {
    const lang = pickLang(req.params.lang);
    const rows = await query<TimelineRow>(
      `SELECT id, company, ${langCols(lang, ['position', 'description'])},
        start_date, end_date, is_current
       FROM experiences WHERE site_id = ? ORDER BY sort_order ASC, start_date DESC`,
      [req.siteId],
    );
    res.json(rows);
  }),
);

publicRouter.get(
  '/:lang/educations',
  asyncHandler(async (req, res) => {
    const lang = pickLang(req.params.lang);
    const rows = await query<TimelineRow>(
      `SELECT id, institution, ${langCols(lang, ['degree', 'description'])},
        start_date, end_date, is_current
       FROM educations WHERE site_id = ? ORDER BY sort_order ASC, start_date DESC`,
      [req.siteId],
    );
    res.json(rows);
  }),
);

/* ---------- Skills ---------- */

interface SkillRow extends mysql.RowDataPacket {
  id: number;
  name: string | null;
  category: string | null;
  icon: string | null;
  level: string;
}

publicRouter.get(
  '/:lang/skills',
  asyncHandler(async (req, res) => {
    const lang = pickLang(req.params.lang);
    const rows = await query<SkillRow>(
      `SELECT id, ${langCols(lang, ['name', 'category'])}, icon, level
       FROM skills WHERE site_id = ? AND is_active = 1 ORDER BY sort_order ASC`,
      [req.siteId],
    );
    res.json(rows);
  }),
);

/* ---------- Projects ---------- */

interface ProjectRow extends mysql.RowDataPacket {
  id: number;
  slug: string;
  title: string | null;
  summary: string | null;
  content: string | null;
  cover_image: string | null;
  github_url: string | null;
  demo_url: string | null;
  is_featured: number;
  published_at: Date | null;
}

interface RelRow extends mysql.RowDataPacket {
  rel_id: number;
  id: number;
  name: string;
}

function groupRels(rows: RelRow[]): Map<number, { id: number; name: string }[]> {
  const map = new Map<number, { id: number; name: string }[]>();
  for (const row of rows) {
    const list = map.get(row.rel_id) ?? [];
    list.push({ id: row.id, name: row.name });
    map.set(row.rel_id, list);
  }
  return map;
}

publicRouter.get(
  '/:lang/projects',
  asyncHandler(async (req, res) => {
    const lang = pickLang(req.params.lang);
    const limit = Math.min(Number(req.query.limit ?? 50), 100);
    const offset = Math.max(Number(req.query.offset ?? 0), 0);

    const rows = await query<ProjectRow>(
      `SELECT id, slug, ${langCols(lang, ['title', 'summary'])}, cover_image,
        github_url, demo_url, is_featured, published_at
       FROM projects
       WHERE site_id = ? AND is_published = 1
       ORDER BY sort_order ASC, published_at DESC
       LIMIT ? OFFSET ?`,
      [req.siteId, limit, offset],
    );
    const ids = rows.map((r) => r.id);
    const nameExpr = lang === 'id' ? 'COALESCE(c.name_id, c.name_en)' : 'COALESCE(c.name_en, c.name_id)';
    const techRows = ids.length > 0
      ? await query<RelRow>(
          `SELECT pts.project_id AS rel_id, t.id, t.name
           FROM project_tech_stacks pts
           JOIN tech_stacks t ON t.id = pts.tech_stack_id
           WHERE pts.project_id IN (${ids.map(() => '?').join(',')})
           ORDER BY t.sort_order ASC, t.name ASC`,
          ids,
        )
      : [];
    const catRows = ids.length > 0
      ? await query<RelRow>(
          `SELECT pc.project_id AS rel_id, c.id, ${nameExpr} AS name
           FROM project_categories pc
           JOIN categories c ON c.id = pc.category_id
           WHERE pc.project_id IN (${ids.map(() => '?').join(',')})
           ORDER BY c.sort_order ASC, c.name_id ASC`,
          ids,
        )
      : [];
    const techMap = groupRels(techRows);
    const catMap = groupRels(catRows);
    res.json(
      rows.map((row) => ({
        ...row,
        tech_stack: techMap.get(row.id) ?? [],
        categories: catMap.get(row.id) ?? [],
      })),
    );
  }),
);

publicRouter.get(
  '/:lang/projects/:slug',
  asyncHandler(async (req, res) => {
    const lang = pickLang(req.params.lang);
    const rows = await query<ProjectRow>(
      `SELECT id, slug, ${langCols(lang, ['title', 'summary', 'content'])}, cover_image,
        github_url, demo_url, is_featured, published_at
       FROM projects
       WHERE site_id = ? AND slug = ? AND is_published = 1`,
      [req.siteId, req.params.slug],
    );
    if (!rows[0]) throw notFound('Proyek tidak ditemukan.');

    const nameExpr = lang === 'id' ? 'COALESCE(c.name_id, c.name_en)' : 'COALESCE(c.name_en, c.name_id)';
    const techRows = await query<RelRow>(
      `SELECT pts.project_id AS rel_id, t.id, t.name
       FROM project_tech_stacks pts
       JOIN tech_stacks t ON t.id = pts.tech_stack_id
       WHERE pts.project_id = ? ORDER BY t.sort_order ASC, t.name ASC`,
      [rows[0].id],
    );
    const catRows = await query<RelRow>(
      `SELECT pc.project_id AS rel_id, c.id, ${nameExpr} AS name
       FROM project_categories pc
       JOIN categories c ON c.id = pc.category_id
       WHERE pc.project_id = ? ORDER BY c.sort_order ASC, c.name_id ASC`,
      [rows[0].id],
    );
    const { prev, next } = await getAdjacent(
      'projects',
      req.siteId!,
      req.params.slug,
      lang,
      'ORDER BY sort_order ASC, published_at DESC, id DESC',
    );
    res.json({
      ...rows[0],
      tech_stack: techRows.map((r) => ({ id: r.id, name: r.name })),
      categories: catRows.map((r) => ({ id: r.id, name: r.name })),
      prev,
      next,
    });
  }),
);

interface AdjacentItem {
  slug: string;
  title: string | null;
}

/** Ambil item sebelum/sesudah berdasarkan urutan yang sama dengan daftar publik. */
async function getAdjacent(
  table: 'blogs' | 'projects',
  siteId: number,
  currentSlug: string,
  lang: Lang,
  orderClause: string,
): Promise<{ prev: AdjacentItem | null; next: AdjacentItem | null }> {
  const rows = await query<{ slug: string; title: string | null } & mysql.RowDataPacket>(
    `SELECT slug, ${langCols(lang, ['title'])} FROM ${table}
     WHERE site_id = ? AND is_published = 1 ${orderClause}`,
    [siteId],
  );
  const idx = rows.findIndex((r) => r.slug === currentSlug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? { slug: rows[idx - 1].slug, title: rows[idx - 1].title } : null,
    next: idx < rows.length - 1 ? { slug: rows[idx + 1].slug, title: rows[idx + 1].title } : null,
  };
}

/* ---------- Blogs ---------- */

interface BlogRow extends mysql.RowDataPacket {
  id: number;
  slug: string;
  title: string | null;
  excerpt: string | null;
  content: string | null;
  cover_image: string | null;
  tags: string | null;
  views: number;
  published_at: Date | null;
}

publicRouter.get(
  '/:lang/blogs',
  asyncHandler(async (req, res) => {
    const lang = pickLang(req.params.lang);
    const limit = Math.min(Number(req.query.limit ?? 50), 100);
    const offset = Math.max(Number(req.query.offset ?? 0), 0);

    const rows = await query<BlogRow>(
      `SELECT id, slug, ${langCols(lang, ['title', 'excerpt'])}, cover_image,
        tags, views, published_at
       FROM blogs
       WHERE site_id = ? AND is_published = 1
       ORDER BY published_at DESC
       LIMIT ? OFFSET ?`,
      [req.siteId, limit, offset],
    );
    const ids = rows.map((r) => r.id);
    const nameExpr = lang === 'id' ? 'COALESCE(c.name_id, c.name_en)' : 'COALESCE(c.name_en, c.name_id)';
    const catRows = ids.length > 0
      ? await query<RelRow>(
          `SELECT bc.blog_id AS rel_id, c.id, ${nameExpr} AS name
           FROM blog_categories bc
           JOIN categories c ON c.id = bc.category_id
           WHERE bc.blog_id IN (${ids.map(() => '?').join(',')})
           ORDER BY c.sort_order ASC, c.name_id ASC`,
          ids,
        )
      : [];
    const catMap = groupRels(catRows);
    res.json(
      rows.map((row) => ({
        ...row,
        tags: parseTags(row.tags),
        categories: catMap.get(row.id) ?? [],
      })),
    );
  }),
);

function parseTags(value: string | null): string[] {
  if (value == null) return [];
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return value as unknown as string[];
}

publicRouter.get(
  '/:lang/blogs/:slug',
  asyncHandler(async (req, res) => {
    const lang = pickLang(req.params.lang);
    const rows = await query<BlogRow>(
      `SELECT id, slug, ${langCols(lang, ['title', 'excerpt', 'content'])}, cover_image,
        tags, views, published_at
       FROM blogs
       WHERE site_id = ? AND slug = ? AND is_published = 1`,
      [req.siteId, req.params.slug],
    );
    if (!rows[0]) throw notFound('Artikel tidak ditemukan.');

    const nameExpr = lang === 'id' ? 'COALESCE(c.name_id, c.name_en)' : 'COALESCE(c.name_en, c.name_id)';
    const catRows = await query<RelRow>(
      `SELECT bc.blog_id AS rel_id, c.id, ${nameExpr} AS name
       FROM blog_categories bc
       JOIN categories c ON c.id = bc.category_id
       WHERE bc.blog_id = ? ORDER BY c.sort_order ASC, c.name_id ASC`,
      [rows[0].id],
    );
    const { prev, next } = await getAdjacent(
      'blogs',
      req.siteId!,
      req.params.slug,
      lang,
      'ORDER BY published_at DESC, id DESC',
    );
    res.json({
      ...rows[0],
      tags: parseTags(rows[0].tags),
      categories: catRows.map((r) => ({ id: r.id, name: r.name })),
      prev,
      next,
    });
  }),
);

/** Catat satu kali kunjungan artikel (dipanggil frontend dengan guard, bukan saat GET). */
const VIEW_MAX = 5;
const VIEW_WINDOW_MS = 10 * 60 * 1000;
const VIEW_CACHE_MAX = 5000;
const viewCache = new Map<string, { count: number; windowStart: number }>();

function allowView(slug: string, ip: string): boolean {
  const key = `${slug}|${ip}`;
  const now = Date.now();
  const entry = viewCache.get(key);
  if (!entry || now - entry.windowStart > VIEW_WINDOW_MS) {
    viewCache.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= VIEW_MAX) return false;
  entry.count += 1;
  return true;
}

publicRouter.post(
  '/:lang/blogs/:slug/view',
  asyncHandler(async (req, res) => {
    if (!allowView(req.params.slug, req.ip ?? 'unknown')) {
      return res.json({ views: null });
    }
    if (viewCache.size > VIEW_CACHE_MAX) viewCache.clear();
    const rows = await query<{ id: number; views: number } & mysql.RowDataPacket>(
      'SELECT id, views FROM blogs WHERE site_id = ? AND slug = ? AND is_published = 1',
      [req.siteId, req.params.slug],
    );
    if (!rows[0]) throw notFound('Artikel tidak ditemukan.');
    await execute('UPDATE blogs SET views = views + 1 WHERE id = ?', [rows[0].id]);
    res.json({ views: rows[0].views + 1 });
  }),
);

/* ---------- Settings (publik, sebagian key) ---------- */

interface SettingRow extends mysql.RowDataPacket {
  skey: string;
  svalue: string;
}

publicRouter.get(
  '/:lang/settings',
  asyncHandler(async (req, res) => {
    const rows = await query<SettingRow>(
      'SELECT skey, svalue FROM settings WHERE site_id = ?',
      [req.siteId],
    );
    const settings: Record<string, unknown> = {};
    for (const row of rows) {
      try {
        settings[row.skey] = JSON.parse(row.svalue);
      } catch {
        settings[row.skey] = row.svalue;
      }
    }
    res.json(settings);
  }),
);

/* ---------- Contact ---------- */

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  subject: z.string().max(255).optional().default(''),
  message: z.string().min(1).max(5000),
});

publicRouter.post(
  '/contact',
  asyncHandler(async (req, res) => {
    const body = contactSchema.parse(req.body);
    if (!req.siteId) throw badRequest('Situs tidak terdeteksi.');
    await execute(
      'INSERT INTO contact_messages (site_id, name, email, subject, message) VALUES (?, ?, ?, ?, ?)',
      [req.siteId, body.name, body.email, body.subject, body.message],
    );
    res.status(201).json({ success: true });
  }),
);
