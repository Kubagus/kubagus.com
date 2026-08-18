-- 004_experience_company_en.sql
-- Tambahkan kolom bahasa Inggris untuk nama perusahaan pada tabel experiences

ALTER TABLE experiences
  ADD COLUMN company_en VARCHAR(150) NULL AFTER company;