import { Router } from 'express';
import { z } from 'zod';
import type mysql from 'mysql2';
import { query, execute } from '../../config/db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { notFound } from '../../utils/httpError.js';

export const adminProfileRouter = Router();

interface ProfileRow extends mysql.RowDataPacket {
  id: number;
  site_id: number;
  name: string;
  title_id: string | null;
  title_en: string | null;
  headline_id: string | null;
  headline_en: string | null;
  summary_id: string | null;
  summary_en: string | null;
  profile_picture: string | null;
  location_id: string | null;
  location_en: string | null;
  cv_url_id: string | null;
  cv_url_en: string | null;
  email: string | null;
  phone: string | null;
  available_for_hire: number;
  badge_show: number;
  badge_text_id: string | null;
  badge_text_en: string | null;
}

interface SocialRow extends mysql.RowDataPacket {
  id: number;
  platform: string;
  url: string;
  icon: string | null;
  sort_order: number;
  is_active: number;
}

const profileSchema = z.object({
  name: z.string().min(1).max(100),
  title_id: z.string().max(150).nullable().optional(),
  title_en: z.string().max(150).nullable().optional(),
  headline_id: z.string().max(255).nullable().optional(),
  headline_en: z.string().max(255).nullable().optional(),
  summary_id: z.string().nullable().optional(),
  summary_en: z.string().nullable().optional(),
  profile_picture: z.string().max(255).nullable().optional(),
  location_id: z.string().max(150).nullable().optional(),
  location_en: z.string().max(150).nullable().optional(),
  cv_url_id: z.string().max(255).nullable().optional(),
  cv_url_en: z.string().max(255).nullable().optional(),
  email: z.string().email().max(255).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  available_for_hire: z.boolean().optional(),
  badge_show: z.boolean().optional(),
  badge_text_id: z.string().max(150).nullable().optional(),
  badge_text_en: z.string().max(150).nullable().optional(),
});

adminProfileRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await query<ProfileRow>('SELECT * FROM profile WHERE site_id = ?', [req.siteId]);
    const socials = await query<SocialRow>(
      'SELECT * FROM social_links WHERE site_id = ? ORDER BY sort_order ASC',
      [req.siteId],
    );
    res.json({ profile: rows[0] ?? null, socials });
  }),
);

function norm(v: string | null | undefined): string | null {
  return v === null || v === undefined || v.trim() === '' ? null : v;
}

adminProfileRouter.put(
  '/',
  asyncHandler(async (req, res) => {
    const body = profileSchema.parse(req.body);

    const existing = await query<{ id: number } & mysql.RowDataPacket>(
      'SELECT id FROM profile WHERE site_id = ?',
      [req.siteId],
    );

    const cols = [
      'name', 'title_id', 'title_en', 'headline_id', 'headline_en',
      'summary_id', 'summary_en', 'profile_picture', 'location_id', 'location_en',
      'cv_url_id', 'cv_url_en', 'email', 'phone', 'available_for_hire',
      'badge_show', 'badge_text_id', 'badge_text_en',
    ];
    const values = [
      body.name,
      norm(body.title_id),
      norm(body.title_en),
      norm(body.headline_id),
      norm(body.headline_en),
      norm(body.summary_id),
      norm(body.summary_en),
      norm(body.profile_picture),
      norm(body.location_id),
      norm(body.location_en),
      norm(body.cv_url_id),
      norm(body.cv_url_en),
      norm(body.email),
      norm(body.phone),
      body.available_for_hire === undefined ? 1 : body.available_for_hire ? 1 : 0,
      body.badge_show === undefined ? 1 : body.badge_show ? 1 : 0,
      norm(body.badge_text_id),
      norm(body.badge_text_en),
    ];

    if (existing[0]) {
      await execute(
        `UPDATE profile SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE site_id = ?`,
        [...values, req.siteId],
      );
    } else {
      await execute(
        `INSERT INTO profile (site_id, ${cols.join(', ')}) VALUES (?, ${cols.map(() => '?').join(', ')})`,
        [req.siteId, ...values],
      );
    }
    res.json({ success: true });
  }),
);

/* ---------- Social links ---------- */

const socialSchema = z.object({
  platform: z.string().min(1).max(50),
  url: z.string().min(1).max(255),
  icon: z.string().max(50).nullable().optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

adminProfileRouter.post(
  '/socials',
  asyncHandler(async (req, res) => {
    const body = socialSchema.parse(req.body);
    const result = await execute(
      'INSERT INTO social_links (site_id, platform, url, icon, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [
        req.siteId,
        body.platform,
        body.url,
        body.icon ?? null,
        body.sort_order ?? 0,
        body.is_active === false ? 0 : 1,
      ],
    );
    res.status(201).json({ id: result.insertId });
  }),
);

adminProfileRouter.put(
  '/socials/:id',
  asyncHandler(async (req, res) => {
    const body = socialSchema.parse(req.body);
    const result = await execute(
      'UPDATE social_links SET platform = ?, url = ?, icon = ?, sort_order = ?, is_active = ? WHERE id = ? AND site_id = ?',
      [
        body.platform,
        body.url,
        body.icon ?? null,
        body.sort_order ?? 0,
        body.is_active === false ? 0 : 1,
        req.params.id,
        req.siteId,
      ],
    );
    if (result.affectedRows === 0) throw notFound('Social link tidak ditemukan.');
    res.json({ success: true });
  }),
);

adminProfileRouter.delete(
  '/socials/:id',
  asyncHandler(async (req, res) => {
    const result = await execute('DELETE FROM social_links WHERE id = ? AND site_id = ?', [
      req.params.id,
      req.siteId,
    ]);
    if (result.affectedRows === 0) throw notFound('Social link tidak ditemukan.');
    res.json({ success: true });
  }),
);
