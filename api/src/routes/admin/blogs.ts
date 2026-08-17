import { Router } from 'express';
import { z } from 'zod';
import type mysql from 'mysql2';
import { query, execute } from '../../config/db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { badRequest, notFound } from '../../utils/httpError.js';

export const adminBlogsRouter = Router();

interface BlogRow extends mysql.RowDataPacket {
  id: number;
  slug: string;
  title_id: string | null;
  title_en: string | null;
  excerpt_id: string | null;
  excerpt_en: string | null;
  content_id: string | null;
  content_en: string | null;
  cover_image: string | null;
  tags: string | null;
  is_published: number;
  published_at: Date | null;
  views: number;
}

const blogSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(150)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug hanya boleh huruf kecil, angka, dan tanda strip.'),
  title_id: z.string().max(255).nullable().optional(),
  title_en: z.string().max(255).nullable().optional(),
  excerpt_id: z.string().nullable().optional(),
  excerpt_en: z.string().nullable().optional(),
  content_id: z.string().nullable().optional(),
  content_en: z.string().nullable().optional(),
  cover_image: z.string().max(255).nullable().optional(),
  tags: z.array(z.string()).optional(),
  is_published: z.boolean().optional(),
  published_at: z.coerce.date().nullable().optional(),
});

function toValues(body: z.infer<typeof blogSchema>) {
  return [
    body.slug,
    body.title_id ?? null,
    body.title_en ?? null,
    body.excerpt_id ?? null,
    body.excerpt_en ?? null,
    body.content_id ?? null,
    body.content_en ?? null,
    body.cover_image ?? null,
    body.tags ? JSON.stringify(body.tags) : null,
    body.is_published ? 1 : 0,
    body.is_published ? (body.published_at ?? new Date()) : null,
  ];
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

function parseBlog(row: BlogRow) {
  return { ...row, tags: parseJson(row.tags) };
}

async function assertSlugFree(slug: string, siteId: number, excludeId?: number) {
  const rows = await query<{ id: number } & mysql.RowDataPacket>(
    'SELECT id FROM blogs WHERE site_id = ? AND slug = ? AND (? IS NULL OR id <> ?)',
    [siteId, slug, excludeId ?? null, excludeId ?? null],
  );
  if (rows[0]) throw badRequest('Slug sudah digunakan pada artikel lain.');
}

adminBlogsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await query<BlogRow>(
      'SELECT * FROM blogs WHERE site_id = ? ORDER BY published_at DESC, id DESC',
      [req.siteId],
    );
    res.json(rows.map(parseBlog));
  }),
);

adminBlogsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const rows = await query<BlogRow>(
      'SELECT * FROM blogs WHERE id = ? AND site_id = ?',
      [req.params.id, req.siteId],
    );
    if (!rows[0]) throw notFound('Artikel tidak ditemukan.');
    res.json(parseBlog(rows[0]));
  }),
);

adminBlogsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = blogSchema.parse(req.body);
    await assertSlugFree(body.slug, req.siteId!);

    const result = await execute(
      `INSERT INTO blogs
        (site_id, slug, title_id, title_en, excerpt_id, excerpt_en, content_id, content_en,
         cover_image, tags, is_published, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.siteId, ...toValues(body)],
    );
    res.status(201).json({ id: result.insertId });
  }),
);

adminBlogsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const body = blogSchema.parse(req.body);
    await assertSlugFree(body.slug, req.siteId!, Number(req.params.id));

    const result = await execute(
      `UPDATE blogs SET
        slug = ?, title_id = ?, title_en = ?, excerpt_id = ?, excerpt_en = ?,
        content_id = ?, content_en = ?, cover_image = ?, tags = ?,
        is_published = ?, published_at = ?
       WHERE id = ? AND site_id = ?`,
      [...toValues(body), req.params.id, req.siteId],
    );
    if (result.affectedRows === 0) throw notFound('Artikel tidak ditemukan.');
    res.json({ success: true });
  }),
);

adminBlogsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await execute('DELETE FROM blogs WHERE id = ? AND site_id = ?', [
      req.params.id,
      req.siteId,
    ]);
    if (result.affectedRows === 0) throw notFound('Artikel tidak ditemukan.');
    res.json({ success: true });
  }),
);
