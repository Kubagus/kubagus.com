export type Lang = 'id' | 'en';

export function pickLang(lang?: string): Lang {
  return lang === 'id' ? 'id' : 'en';
}

/**
 * Membangun ekspresi SELECT untuk kolom bilingual.
 * Misal: langCols('title', ['title', 'summary']) =>
 *   lang=id: "title_id AS title, summary_id AS summary"
 *   lang=en : "title_en AS title, summary_en AS summary"
 */
export function langCols(lang: Lang, cols: string[]): string {
  const suffix = lang === 'id' ? 'id' : 'en';
  return cols.map((c) => `${c}_${suffix} AS ${c}`).join(', ');
}
