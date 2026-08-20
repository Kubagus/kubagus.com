-- 006_auth_hardening.sql
-- Penguatan auth:
-- 1. token_version pada admins — naikkan untuk membatalkan SEMUA access token admin (logout/ganti password)
-- 2. admin_refresh_tokens — refresh token acak (hash SHA-256), rotasi, dan revoke
-- 3. login_attempts — rate limit login persisten (bukan in-memory, tidak hilang saat restart)

ALTER TABLE admins
  ADD COLUMN token_version INT UNSIGNED NOT NULL DEFAULT 0 AFTER role;

CREATE TABLE IF NOT EXISTS admin_refresh_tokens (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id INT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked TINYINT(1) NOT NULL DEFAULT 0,
  replaced_by CHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_refresh_admin FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
  UNIQUE KEY uq_refresh_hash (token_hash),
  KEY idx_refresh_admin (admin_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS login_attempts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  ip VARCHAR(45) NOT NULL,
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  locked_until DATETIME NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_login_attempts_email_ip (email, ip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;