import { Router } from 'express';
import { z } from 'zod';
import type mysql from 'mysql2';
import { query, execute } from '../../config/db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { notFound } from '../../utils/httpError.js';

interface TimelineRow extends mysql.RowDataPacket {
  id: number;
  company: string | null;
  institution: string | null;
  position_id: string | null;
  position_en: string | null;
  degree_id: string | null;
  degree_en: string | null;
  description_id: string | null;
  description_en: string | null;
  start_date: Date;
  end_date: Date | null;
  is_current: number;
  sort_order: number;
}

type TableName = 'experiences' | 'educations';

function makeRouter(table: TableName) {
  const router = Router();
  const nameCol = table === 'experiences' ? 'company' : 'institution';
  const nameEnCol = table === 'experiences' ? 'company_en' : null;
  const positionCols = table === 'experiences' ? ['position_id', 'position_en'] : ['degree_id', 'degree_en'];
  const allCols = [
    nameCol,
    ...(nameEnCol ? [nameEnCol] : []),
    ...positionCols,
    'description_id',
    'description_en',
    'start_date',
    'end_date',
    'is_current',
    'sort_order',
  ];

  const schema = z.object({
    [nameCol]: z.string().min(1).max(150),
    ...(nameEnCol ? { [nameEnCol]: z.string().max(150).nullable().optional() } : {}),
    [positionCols[0]]: z.string().max(150).nullable().optional(),
    [positionCols[1]]: z.string().max(150).nullable().optional(),
    description_id: z.string().nullable().optional(),
    description_en: z.string().nullable().optional(),
    start_date: z.coerce.date(),
    end_date: z.coerce.date().nullable().optional(),
    is_current: z.boolean().optional(),
    sort_order: z.number().int().optional(),
  });

  function toValues(body: z.infer<typeof schema>) {
    const b = body as unknown as Record<string, unknown>;
    return [
      b[nameCol] as string,
      ...(nameEnCol ? [(b[nameEnCol] as string) ?? null] : []),
      (b[positionCols[0]] as string) ?? null,
      (b[positionCols[1]] as string) ?? null,
      (b.description_id as string) ?? null,
      (b.description_en as string) ?? null,
      b.start_date as Date,
      (b.end_date as Date | null) ?? null,
      b.is_current ? 1 : 0,
      (b.sort_order as number) ?? 0,
    ];
  }

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const rows = await query<TimelineRow>(
        `SELECT * FROM ${table} WHERE site_id = ? ORDER BY sort_order ASC, start_date DESC`,
        [req.siteId],
      );
      res.json(rows);
    }),
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const body = schema.parse(req.body);
      const result = await execute(
        `INSERT INTO ${table} (site_id, ${allCols.join(', ')}) VALUES (?, ${allCols.map(() => '?').join(', ')})`,
        [req.siteId, ...toValues(body)],
      );
      res.status(201).json({ id: result.insertId });
    }),
  );

  router.put(
    '/:id',
    asyncHandler(async (req, res) => {
      const body = schema.parse(req.body);
      const result = await execute(
        `UPDATE ${table} SET ${allCols.map((c) => `${c} = ?`).join(', ')} WHERE id = ? AND site_id = ?`,
        [...toValues(body), req.params.id, req.siteId],
      );
      if (result.affectedRows === 0) throw notFound('Data tidak ditemukan.');
      res.json({ success: true });
    }),
  );

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const result = await execute(`DELETE FROM ${table} WHERE id = ? AND site_id = ?`, [
        req.params.id,
        req.siteId,
      ]);
      if (result.affectedRows === 0) throw notFound('Data tidak ditemukan.');
      res.json({ success: true });
    }),
  );

  return router;
}

export const adminExperiencesRouter = makeRouter('experiences');
export const adminEducationsRouter = makeRouter('educations');
