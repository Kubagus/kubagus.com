import { Router } from 'express';
import { z } from 'zod';
import type mysql from 'mysql2';
import { query, execute } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { langCols, pickLang } from '../utils/lang.js';
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
      `SELECT name, ${langCols(lang, ['title', 'headline', 'summary', 'location', 'cv_url'])},
        profile_picture, email, phone, available_for_hire
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
  proficiency: number;
}

publicRouter.get(
  '/:lang/skills',
  asyncHandler(async (req, res) => {
    const lang = pickLang(req.params.lang);
    const rows = await query<SkillRow>(
      `SELECT id, ${langCols(lang, ['name', 'category'])}, icon, proficiency
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
  tech_stack: string | null;
  github_url: string | null;
  demo_url: string | null;
  is_featured: number;
  published_at: Date | null;
}

function parseJson(value: unknown): unknown[] {
  if (value == null) return [];
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return value as unknown[];
}

function parseProject(row: ProjectRow) {
  return { ...row, tech_stack: parseJson(row.tech_stack) };
}

publicRouter.get(
  '/:lang/projects',
  asyncHandler(async (req, res) => {
    const lang = pickLang(req.params.lang);
    const limit = Math.min(Number(req.query.limit ?? 50), 100);
    const offset = Math.max(Number(req.query.offset ?? 0), 0);

    const rows = await query<ProjectRow>(
      `SELECT id, slug, ${langCols(lang, ['title', 'summary'])}, cover_image,
        tech_stack, github_url, demo_url, is_featured, published_at
       FROM projects
       WHERE site_id = ? AND is_published = 1
       ORDER BY sort_order ASC, published_at DESC
       LIMIT ? OFFSET ?`,
      [req.siteId, limit, offset],
    );
    res.json(rows.map(parseProject));
  }),
);

publicRouter.get(
  '/:lang/projects/:slug',
  asyncHandler(async (req, res) => {
    const lang = pickLang(req.params.lang);
    const rows = await query<ProjectRow>(
      `SELECT id, slug, ${langCols(lang, ['title', 'summary', 'content'])}, cover_image,
        tech_stack, github_url, demo_url, is_featured, published_at
       FROM projects
       WHERE site_id = ? AND slug = ? AND is_published = 1`,
      [req.siteId, req.params.slug],
    );
    if (!rows[0]) throw notFound('Proyek tidak ditemukan.');
    res.json(parseProject(rows[0]));
  }),
);

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

function parseBlog(row: BlogRow) {
  return { ...row, tags: parseJson(row.tags) };
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
    res.json(rows.map(parseBlog));
  }),
);

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

    await execute('UPDATE blogs SET views = views + 1 WHERE id = ?', [rows[0].id]);
    res.json({ ...parseBlog(rows[0]), views: rows[0].views + 1 });
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
  message: z.string().min(1),
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
