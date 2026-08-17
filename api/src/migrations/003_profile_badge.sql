-- 003_profile_badge.sql
-- Pengaturan badge "tersedia untuk proyek": teks custom per bahasa + opsi tampil/sembunyi
ALTER TABLE profile
  ADD COLUMN badge_show TINYINT(1) NOT NULL DEFAULT 1 AFTER available_for_hire,
  ADD COLUMN badge_text_id VARCHAR(150) NULL AFTER badge_show,
  ADD COLUMN badge_text_en VARCHAR(150) NULL AFTER badge_text_id;
