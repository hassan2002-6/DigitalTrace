-- ============================================================
--  DigitalTrace - Browser History Analyzer
--  MySQL 8.x schema (also compatible with MariaDB 10.6+)
--
--  Usage:
--    mysql -u root -p < database/schema.sql
--
--  The script is idempotent: it creates the database and tables
--  only when they are missing, and re-inserts the category seed
--  data with INSERT IGNORE. Existing history is never dropped.
-- ============================================================

CREATE DATABASE IF NOT EXISTS digitaltrace
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE digitaltrace;

-- ------------------------------------------------------------
-- Users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL,
    password      VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Website categories (seeded below; referenced by history rows)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS website_categories (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    category_name VARCHAR(50)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_categories_name (category_name)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- One row per uploaded CSV file
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS uploaded_files (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id      INT UNSIGNED NOT NULL,
    file_name    VARCHAR(255) NOT NULL,
    file_type    VARCHAR(20)  NOT NULL DEFAULT 'csv',
    upload_date  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status       VARCHAR(20)  NOT NULL DEFAULT 'Completed',
    PRIMARY KEY (id),
    KEY idx_uploaded_files_user (user_id),
    CONSTRAINT fk_uploaded_files_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Browser history rows
--   visit_count > 1 when the export aggregates repeated visits
--   into a single row (e.g. Chromium exports with a Visit Count
--   column). One-row-per-visit exports simply use the default 1.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS browser_history (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    category_id  INT UNSIGNED    NULL,
    website_url  VARCHAR(2048)   NOT NULL,
    page_title   VARCHAR(512)    NULL,
    visit_time   DATETIME        NOT NULL,
    visit_count  INT UNSIGNED    NOT NULL DEFAULT 1,
    upload_id    INT UNSIGNED    NOT NULL,
    PRIMARY KEY (id),
    KEY idx_history_url (website_url(191)),
    KEY idx_history_visit_time (visit_time),
    KEY idx_history_upload_time (upload_id, visit_time),
    KEY idx_history_category (category_id),
    CONSTRAINT fk_history_category
        FOREIGN KEY (category_id) REFERENCES website_categories (id)
        ON DELETE SET NULL,
    CONSTRAINT fk_history_upload
        FOREIGN KEY (upload_id) REFERENCES uploaded_files (id)
        ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Seed categories used by backend/services/categoryService.js
-- ------------------------------------------------------------
INSERT IGNORE INTO website_categories (category_name) VALUES
    ('Technology'),
    ('Entertainment'),
    ('Education'),
    ('Social Media'),
    ('Shopping'),
    ('News'),
    ('Productivity'),
    ('Other');
