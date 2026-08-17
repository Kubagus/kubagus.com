-- 002_skill_levels_categories.sql
-- 1) Skill: ganti persentase (proficiency) menjadi skala level
ALTER TABLE skills
  ADD COLUMN level ENUM('basic', 'intermediate', 'advanced', 'expert') NOT NULL DEFAULT 'basic' AFTER proficiency;

UPDATE skills SET level = CASE
  WHEN proficiency >= 90 THEN 'expert'
  WHEN proficiency >= 70 THEN 'advanced'
  WHEN proficiency >= 40 THEN 'intermediate'
  ELSE 'basic'
END;

ALTER TABLE skills DROP COLUMN proficiency;

-- 2) Kategori (untuk blog & project)
CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  site_id INT UNSIGNED NOT NULL,
  type ENUM('blog', 'project') NOT NULL,
  name_id VARCHAR(100) NULL,
  name_en VARCHAR(100) NULL,
  slug VARCHAR(150) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_categories_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  UNIQUE KEY uq_categories_site_type_slug (site_id, type, slug),
  KEY idx_categories_site (site_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) Tech stack (untuk project)
CREATE TABLE IF NOT EXISTS tech_stacks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  site_id INT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(150) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tech_stacks_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  UNIQUE KEY uq_tech_stacks_site_slug (site_id, slug),
  KEY idx_tech_stacks_site (site_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4) Pivot blog <-> kategori
CREATE TABLE IF NOT EXISTS blog_categories (
  blog_id INT UNSIGNED NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (blog_id, category_id),
  CONSTRAINT fk_blog_categories_blog FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE,
  CONSTRAINT fk_blog_categories_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5) Pivot project <-> kategori
CREATE TABLE IF NOT EXISTS project_categories (
  project_id INT UNSIGNED NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (project_id, category_id),
  CONSTRAINT fk_project_categories_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_project_categories_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6) Pivot project <-> tech stack
CREATE TABLE IF NOT EXISTS project_tech_stacks (
  project_id INT UNSIGNED NOT NULL,
  tech_stack_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (project_id, tech_stack_id),
  CONSTRAINT fk_project_tech_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_project_tech_stack FOREIGN KEY (tech_stack_id) REFERENCES tech_stacks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7) Migrasi data: kolom tech_stack (JSON) -> tabel tech_stacks + pivot
INSERT INTO tech_stacks (site_id, name, slug, sort_order)
SELECT DISTINCT p.site_id, jt.name, LOWER(REPLACE(jt.name, ' ', '-')), 0
FROM projects p
JOIN JSON_TABLE(p.tech_stack, '$[*]' COLUMNS (name VARCHAR(100) PATH '$')) jt
ON NOT EXISTS (
  SELECT 1 FROM tech_stacks t2
  WHERE t2.site_id = p.site_id
    AND t2.slug = LOWER(REPLACE(jt.name, ' ', '-')) COLLATE utf8mb4_unicode_ci
);

INSERT INTO project_tech_stacks (project_id, tech_stack_id)
SELECT p.id, t.id
FROM projects p
JOIN JSON_TABLE(p.tech_stack, '$[*]' COLUMNS (name VARCHAR(100) PATH '$')) jt
JOIN tech_stacks t
  ON t.site_id = p.site_id
  AND t.slug = LOWER(REPLACE(jt.name, ' ', '-')) COLLATE utf8mb4_unicode_ci
WHERE p.tech_stack IS NOT NULL;

ALTER TABLE projects DROP COLUMN tech_stack;
