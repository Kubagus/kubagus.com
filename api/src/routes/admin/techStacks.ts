import { Router } from 'express';
import { z } from 'zod';
import type mysql from 'mysql2';
import { query, execute } from '../../config/db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { badRequest, notFound } from '../../utils/httpError.js';

export const adminTechStacksRouter = Router();

interface TechStackRow extends mysql.RowDataPacket {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
}

const techStackSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(150)
    .regex(/^[a-z0-9]+(?:[-.][a-z0-9]+)*$/, 'Slug hanya boleh huruf kecil, angka, titik, dan tanda strip.'),
  sort_order: z.number().int().optional(),
});

async function assertSlugFree(slug: string, siteId: number, excludeId?: number) {
  const rows = await query<{ id: number } & mysql.RowDataPacket>(
    'SELECT id FROM tech_stacks WHERE site_id = ? AND slug = ? AND (? IS NULL OR id <> ?)',
    [siteId, slug, excludeId ?? null, excludeId ?? null],
  );
  if (rows[0]) throw badRequest('Slug sudah digunakan pada tech stack lain.');
}

adminTechStacksRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await query<TechStackRow>(
      'SELECT * FROM tech_stacks WHERE site_id = ? ORDER BY sort_order ASC, name ASC',
      [req.siteId],
    );
    res.json(rows);
  }),
);

adminTechStacksRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = techStackSchema.parse(req.body);
    await assertSlugFree(body.slug, req.siteId!);

    const result = await execute(
      'INSERT INTO tech_stacks (site_id, name, slug, sort_order) VALUES (?, ?, ?, ?)',
      [req.siteId, body.name, body.slug, body.sort_order ?? 0],
    );
    res.status(201).json({ id: result.insertId });
  }),
);

adminTechStacksRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const body = techStackSchema.parse(req.body);
    await assertSlugFree(body.slug, req.siteId!, Number(req.params.id));

    const result = await execute(
      'UPDATE tech_stacks SET name = ?, slug = ?, sort_order = ? WHERE id = ? AND site_id = ?',
      [body.name, body.slug, body.sort_order ?? 0, req.params.id, req.siteId],
    );
    if (result.affectedRows === 0) throw notFound('Tech stack tidak ditemukan.');
    res.json({ success: true });
  }),
);

adminTechStacksRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await execute('DELETE FROM tech_stacks WHERE id = ? AND site_id = ?', [
      req.params.id,
      req.siteId,
    ]);
    if (result.affectedRows === 0) throw notFound('Tech stack tidak ditemukan.');
    res.json({ success: true });
  }),
);
