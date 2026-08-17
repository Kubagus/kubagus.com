import { Router } from 'express';
import { z } from 'zod';
import type mysql from 'mysql2';
import { query, execute } from '../../config/db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { notFound } from '../../utils/httpError.js';

export const adminSkillsRouter = Router();

interface SkillRow extends mysql.RowDataPacket {
  id: number;
  name_id: string | null;
  name_en: string | null;
  category_id: string | null;
  category_en: string | null;
  icon: string | null;
  proficiency: number;
  sort_order: number;
  is_active: number;
}

const skillSchema = z.object({
  name_id: z.string().max(100).nullable().optional(),
  name_en: z.string().max(100).nullable().optional(),
  category_id: z.string().max(50).nullable().optional(),
  category_en: z.string().max(50).nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
  proficiency: z.number().int().min(0).max(100).optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

adminSkillsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await query<SkillRow>(
      'SELECT * FROM skills WHERE site_id = ? ORDER BY sort_order ASC',
      [req.siteId],
    );
    res.json(rows);
  }),
);

adminSkillsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = skillSchema.parse(req.body);
    const result = await execute(
      `INSERT INTO skills (site_id, name_id, name_en, category_id, category_en, icon, proficiency, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.siteId,
        body.name_id ?? null,
        body.name_en ?? null,
        body.category_id ?? null,
        body.category_en ?? null,
        body.icon ?? null,
        body.proficiency ?? 0,
        body.sort_order ?? 0,
        body.is_active === false ? 0 : 1,
      ],
    );
    res.status(201).json({ id: result.insertId });
  }),
);

adminSkillsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const body = skillSchema.parse(req.body);
    const result = await execute(
      `UPDATE skills
       SET name_id = ?, name_en = ?, category_id = ?, category_en = ?, icon = ?, proficiency = ?, sort_order = ?, is_active = ?
       WHERE id = ? AND site_id = ?`,
      [
        body.name_id ?? null,
        body.name_en ?? null,
        body.category_id ?? null,
        body.category_en ?? null,
        body.icon ?? null,
        body.proficiency ?? 0,
        body.sort_order ?? 0,
        body.is_active === false ? 0 : 1,
        req.params.id,
        req.siteId,
      ],
    );
    if (result.affectedRows === 0) throw notFound('Skill tidak ditemukan.');
    res.json({ success: true });
  }),
);

adminSkillsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await execute('DELETE FROM skills WHERE id = ? AND site_id = ?', [
      req.params.id,
      req.siteId,
    ]);
    if (result.affectedRows === 0) throw notFound('Skill tidak ditemukan.');
    res.json({ success: true });
  }),
);
