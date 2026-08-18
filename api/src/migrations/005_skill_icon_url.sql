-- 005_skill_icon_url.sql
-- Perbesar kolom icon pada skills agar bisa menampung URL (mis. img.shields.io)

ALTER TABLE skills
  MODIFY icon VARCHAR(255) NULL;