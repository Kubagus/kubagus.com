import type mysql from 'mysql2';
import { query, execute } from '../../config/db.js';

export interface RelItem {
  id: number;
  name: string;
  slug: string;
}

interface TechRow extends mysql.RowDataPacket {
  project_id: number;
  id: number;
  name: string;
  slug: string;
}

interface CategoryRow extends mysql.RowDataPacket {
  rel_id: number;
  id: number;
  name_id: string | null;
  name_en: string | null;
  slug: string;
}

/** Ambil tech stack per project (Map project_id -> items). */
export async function getTechStacksByProject(projectIds: number[]): Promise<Map<number, RelItem[]>> {
  const map = new Map<number, RelItem[]>();
  if (projectIds.length === 0) return map;
  const rows = await query<TechRow>(
    `SELECT pts.project_id, t.id, t.name, t.slug
     FROM project_tech_stacks pts
     JOIN tech_stacks t ON t.id = pts.tech_stack_id
     WHERE pts.project_id IN (${projectIds.map(() => '?').join(',')})
     ORDER BY t.sort_order ASC, t.name ASC`,
    projectIds,
  );
  for (const row of rows) {
    const list = map.get(row.project_id) ?? [];
    list.push({ id: row.id, name: row.name, slug: row.slug });
    map.set(row.project_id, list);
  }
  return map;
}

/** Ambil kategori per item (Map rel_id -> items). pivotTable = 'blog_categories' | 'project_categories'. */
export async function getCategoriesByItem(
  pivotTable: 'blog_categories' | 'project_categories',
  itemIds: number[],
): Promise<Map<number, RelItem[]>> {
  const map = new Map<number, RelItem[]>();
  if (itemIds.length === 0) return map;
  const idCol = pivotTable === 'blog_categories' ? 'blog_id' : 'project_id';
  const rows = await query<CategoryRow>(
    `SELECT bc.${idCol} AS rel_id, c.id, c.name_id, c.name_en, c.slug
     FROM ${pivotTable} bc
     JOIN categories c ON c.id = bc.category_id
     WHERE bc.${idCol} IN (${itemIds.map(() => '?').join(',')})
     ORDER BY c.sort_order ASC, c.name_id ASC`,
    itemIds,
  );
  for (const row of rows) {
    const list = map.get(row.rel_id) ?? [];
    list.push({ id: row.id, name: row.name_id ?? row.name_en ?? row.slug, slug: row.slug });
    map.set(row.rel_id, list);
  }
  return map;
}

/** Ganti seluruh pivot tech stack milik sebuah project. */
export async function replaceProjectTechStacks(projectId: number, techStackIds: number[]) {
  await execute('DELETE FROM project_tech_stacks WHERE project_id = ?', [projectId]);
  for (const id of techStackIds) {
    await execute(
      'INSERT INTO project_tech_stacks (project_id, tech_stack_id) VALUES (?, ?)',
      [projectId, id],
    );
  }
}

/** Ganti seluruh pivot kategori milik sebuah item. */
export async function replaceItemCategories(
  pivotTable: 'blog_categories' | 'project_categories',
  itemId: number,
  categoryIds: number[],
) {
  const idCol = pivotTable === 'blog_categories' ? 'blog_id' : 'project_id';
  await execute(`DELETE FROM ${pivotTable} WHERE ${idCol} = ?`, [itemId]);
  for (const id of categoryIds) {
    await execute(`INSERT INTO ${pivotTable} (${idCol}, category_id) VALUES (?, ?)`, [itemId, id]);
  }
}
