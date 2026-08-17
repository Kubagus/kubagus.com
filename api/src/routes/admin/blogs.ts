import { Router } from 'express';
import { z } from 'zod';
import type mysql from 'mysql2';
import { query, execute } from '../../config/db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { badRequest, notFound } from '../../utils/httpError.js';
import { getCategoriesByItem, replaceItemCategories } from './relations.js';

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
  category_ids: z.array(z.number().int()).optional(),
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
    const catMap = await getCategoriesByItem(
      'blog_categories',
      rows.map((r) => r.id),
    );
    res.json(
      rows.map((row) => {
        const categories = catMap.get(row.id) ?? [];
        return {
          ...row,
          tags: parseTags(row.tags),
          categories,
          category_ids: categories.map((c) => c.id),
        };
      }),
    );
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
    const catMap = await getCategoriesByItem('blog_categories', [rows[0].id]);
    const categories = catMap.get(rows[0].id) ?? [];
    res.json({
      ...rows[0],
      tags: parseTags(rows[0].tags),
      categories,
      category_ids: categories.map((c) => c.id),
    });
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
    await replaceItemCategories('blog_categories', result.insertId, body.category_ids ?? []);
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
    await replaceItemCategories('blog_categories', Number(req.params.id), body.category_ids ?? []);
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
