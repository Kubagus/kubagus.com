import { Router } from 'express';
import { z } from 'zod';
import type mysql from 'mysql2';
import { query, execute } from '../../config/db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { badRequest, notFound } from '../../utils/httpError.js';

export const adminCategoriesRouter = Router();

export const CATEGORY_TYPES = ['blog', 'project'] as const;
export type CategoryType = (typeof CATEGORY_TYPES)[number];

interface CategoryRow extends mysql.RowDataPacket {
  id: number;
  type: CategoryType;
  name_id: string | null;
  name_en: string | null;
  slug: string;
  sort_order: number;
}

const categorySchema = z.object({
  type: z.enum(CATEGORY_TYPES),
  name_id: z.string().max(100).nullable().optional(),
  name_en: z.string().max(100).nullable().optional(),
  slug: z
    .string()
    .min(1)
    .max(150)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug hanya boleh huruf kecil, angka, dan tanda strip.'),
  sort_order: z.number().int().optional(),
});

async function assertSlugFree(type: string, slug: string, siteId: number, excludeId?: number) {
  const rows = await query<{ id: number } & mysql.RowDataPacket>(
    'SELECT id FROM categories WHERE site_id = ? AND type = ? AND slug = ? AND (? IS NULL OR id <> ?)',
    [siteId, type, slug, excludeId ?? null, excludeId ?? null],
  );
  if (rows[0]) throw badRequest('Slug sudah digunakan pada kategori ini.');
}

adminCategoriesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const type = req.query.type as CategoryType | undefined;
    const rows = await query<CategoryRow>(
      `SELECT * FROM categories
       WHERE site_id = ? ${type === 'blog' || type === 'project' ? 'AND type = ?' : ''}
       ORDER BY type ASC, sort_order ASC, id ASC`,
      type === 'blog' || type === 'project' ? [req.siteId, type] : [req.siteId],
    );
    res.json(rows);
  }),
);

adminCategoriesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = categorySchema.parse(req.body);
    await assertSlugFree(body.type, body.slug, req.siteId!);

    const result = await execute(
      'INSERT INTO categories (site_id, type, name_id, name_en, slug, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [req.siteId, body.type, body.name_id ?? null, body.name_en ?? null, body.slug, body.sort_order ?? 0],
    );
    res.status(201).json({ id: result.insertId });
  }),
);

adminCategoriesRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const body = categorySchema.parse(req.body);
    await assertSlugFree(body.type, body.slug, req.siteId!, Number(req.params.id));

    const result = await execute(
      'UPDATE categories SET type = ?, name_id = ?, name_en = ?, slug = ?, sort_order = ? WHERE id = ? AND site_id = ?',
      [
        body.type,
        body.name_id ?? null,
        body.name_en ?? null,
        body.slug,
        body.sort_order ?? 0,
        req.params.id,
        req.siteId,
      ],
    );
    if (result.affectedRows === 0) throw notFound('Kategori tidak ditemukan.');
    res.json({ success: true });
  }),
);

adminCategoriesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await execute('DELETE FROM categories WHERE id = ? AND site_id = ?', [
      req.params.id,
      req.siteId,
    ]);
    if (result.affectedRows === 0) throw notFound('Kategori tidak ditemukan.');
    res.json({ success: true });
  }),
);
