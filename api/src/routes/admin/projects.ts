import { Router } from 'express';
import { z } from 'zod';
import type mysql from 'mysql2';
import { query, execute } from '../../config/db.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { badRequest, notFound } from '../../utils/httpError.js';
import {
  getCategoriesByItem,
  getTechStacksByProject,
  replaceItemCategories,
  replaceProjectTechStacks,
} from './relations.js';

export const adminProjectsRouter = Router();

interface ProjectRow extends mysql.RowDataPacket {
  id: number;
  slug: string;
  title_id: string | null;
  title_en: string | null;
  summary_id: string | null;
  summary_en: string | null;
  content_id: string | null;
  content_en: string | null;
  cover_image: string | null;
  github_url: string | null;
  demo_url: string | null;
  is_featured: number;
  is_published: number;
  published_at: Date | null;
  sort_order: number;
}

const projectSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(150)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug hanya boleh huruf kecil, angka, dan tanda strip.'),
  title_id: z.string().max(200).nullable().optional(),
  title_en: z.string().max(200).nullable().optional(),
  summary_id: z.string().nullable().optional(),
  summary_en: z.string().nullable().optional(),
  content_id: z.string().nullable().optional(),
  content_en: z.string().nullable().optional(),
  cover_image: z.string().max(255).nullable().optional(),
  github_url: z.string().max(255).nullable().optional(),
  demo_url: z.string().max(255).nullable().optional(),
  is_featured: z.boolean().optional(),
  is_published: z.boolean().optional(),
  published_at: z.coerce.date().nullable().optional(),
  sort_order: z.number().int().optional(),
  tech_stack_ids: z.array(z.number().int()).optional(),
  category_ids: z.array(z.number().int()).optional(),
});

function toValues(body: z.infer<typeof projectSchema>) {
  return [
    body.slug,
    body.title_id ?? null,
    body.title_en ?? null,
    body.summary_id ?? null,
    body.summary_en ?? null,
    body.content_id ?? null,
    body.content_en ?? null,
    body.cover_image ?? null,
    body.github_url ?? null,
    body.demo_url ?? null,
    body.is_featured ? 1 : 0,
    body.is_published ? 1 : 0,
    body.is_published ? (body.published_at ?? new Date()) : null,
    body.sort_order ?? 0,
  ];
}

async function assertSlugFree(slug: string, siteId: number, excludeId?: number) {
  const rows = await query<{ id: number } & mysql.RowDataPacket>(
    'SELECT id FROM projects WHERE site_id = ? AND slug = ? AND (? IS NULL OR id <> ?)',
    [siteId, slug, excludeId ?? null, excludeId ?? null],
  );
  if (rows[0]) throw badRequest('Slug sudah digunakan pada proyek lain.');
}

async function decorate(project: ProjectRow): Promise<Record<string, unknown>> {
  const techMap = await getTechStacksByProject([project.id]);
  const catMap = await getCategoriesByItem('project_categories', [project.id]);
  const techStacks = techMap.get(project.id) ?? [];
  const categories = catMap.get(project.id) ?? [];
  return {
    ...project,
    tech_stacks: techStacks,
    tech_stack_ids: techStacks.map((t) => t.id),
    categories,
    category_ids: categories.map((c) => c.id),
  };
}

adminProjectsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const rows = await query<ProjectRow>(
      'SELECT * FROM projects WHERE site_id = ? ORDER BY sort_order ASC, id DESC',
      [req.siteId],
    );
    const techMap = await getTechStacksByProject(rows.map((r) => r.id));
    const catMap = await getCategoriesByItem('project_categories', rows.map((r) => r.id));
    res.json(
      rows.map((row) => {
        const techStacks = techMap.get(row.id) ?? [];
        const categories = catMap.get(row.id) ?? [];
        return {
          ...row,
          tech_stacks: techStacks,
          tech_stack_ids: techStacks.map((t) => t.id),
          categories,
          category_ids: categories.map((c) => c.id),
        };
      }),
    );
  }),
);

adminProjectsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const rows = await query<ProjectRow>(
      'SELECT * FROM projects WHERE id = ? AND site_id = ?',
      [req.params.id, req.siteId],
    );
    if (!rows[0]) throw notFound('Proyek tidak ditemukan.');
    res.json(await decorate(rows[0]));
  }),
);

adminProjectsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = projectSchema.parse(req.body);
    await assertSlugFree(body.slug, req.siteId!);

    const result = await execute(
      `INSERT INTO projects
        (site_id, slug, title_id, title_en, summary_id, summary_en, content_id, content_en,
         cover_image, github_url, demo_url, is_featured, is_published, published_at, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.siteId, ...toValues(body)],
    );
    const projectId = result.insertId;
    await replaceProjectTechStacks(projectId, body.tech_stack_ids ?? []);
    await replaceItemCategories('project_categories', projectId, body.category_ids ?? []);
    res.status(201).json({ id: projectId });
  }),
);

adminProjectsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const body = projectSchema.parse(req.body);
    await assertSlugFree(body.slug, req.siteId!, Number(req.params.id));

    const result = await execute(
      `UPDATE projects SET
        slug = ?, title_id = ?, title_en = ?, summary_id = ?, summary_en = ?,
        content_id = ?, content_en = ?, cover_image = ?, github_url = ?,
        demo_url = ?, is_featured = ?, is_published = ?, published_at = ?, sort_order = ?
       WHERE id = ? AND site_id = ?`,
      [...toValues(body), req.params.id, req.siteId],
    );
    if (result.affectedRows === 0) throw notFound('Proyek tidak ditemukan.');
    await replaceProjectTechStacks(Number(req.params.id), body.tech_stack_ids ?? []);
    await replaceItemCategories('project_categories', Number(req.params.id), body.category_ids ?? []);
    res.json({ success: true });
  }),
);

adminProjectsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await execute('DELETE FROM projects WHERE id = ? AND site_id = ?', [
      req.params.id,
      req.siteId,
    ]);
    if (result.affectedRows === 0) throw notFound('Proyek tidak ditemukan.');
    res.json({ success: true });
  }),
);
