-- ============================================================
--  DigitalTrace - Browser History Analyzer
--  PostgreSQL schema (Neon compatible)
--
--  Apply with:
--    npm run db:migrate
--
--  The script is idempotent and never drops existing data.
-- ============================================================

-- ------------------------------------------------------------
-- Users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL,
    password      VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email
    ON users (LOWER(email));

-- ------------------------------------------------------------
-- Website categories
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS website_categories (
    id            SERIAL PRIMARY KEY,
    category_name VARCHAR(50) NOT NULL UNIQUE
);

-- ------------------------------------------------------------
-- Domains (hostname level, e.g. github.com)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS domains (
    id          BIGSERIAL PRIMARY KEY,
    hostname    VARCHAR(255) NOT NULL UNIQUE,
    category_id INTEGER REFERENCES website_categories (id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- One row per uploaded CSV file
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS uploaded_files (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    file_name       VARCHAR(255) NOT NULL,
    file_type       VARCHAR(20)  NOT NULL DEFAULT 'csv',
    upload_date     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    status          VARCHAR(20)  NOT NULL DEFAULT 'Completed',
    row_count       INTEGER      NOT NULL DEFAULT 0,
    visit_count     INTEGER      NOT NULL DEFAULT 0,
    duplicate_count INTEGER      NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_uploaded_files_user
    ON uploaded_files (user_id, upload_date DESC);

-- ------------------------------------------------------------
-- Browser history rows
--   visit_time is TIMESTAMP (no timezone) so exported wall-clock
--   times are preserved exactly as they appeared in the CSV.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS browser_history (
    id           BIGSERIAL PRIMARY KEY,
    upload_id    BIGINT      NOT NULL REFERENCES uploaded_files (id) ON DELETE CASCADE,
    user_id      BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    domain_id    BIGINT      REFERENCES domains (id) ON DELETE SET NULL,
    website_url  TEXT        NOT NULL,
    page_title   TEXT,
    visit_time   TIMESTAMP   NOT NULL,
    visit_count  INTEGER     NOT NULL DEFAULT 1 CHECK (visit_count > 0),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_history_user_time
    ON browser_history (user_id, visit_time DESC);

CREATE INDEX IF NOT EXISTS idx_history_upload
    ON browser_history (upload_id);

CREATE INDEX IF NOT EXISTS idx_history_domain
    ON browser_history (domain_id);

-- Exact duplicate suppression: the same user visiting the same URL at
-- the same second is imported only once, even across re-uploads.
CREATE UNIQUE INDEX IF NOT EXISTS uq_history_user_url_time
    ON browser_history (user_id, website_url, visit_time);

-- ------------------------------------------------------------
-- Seed categories (must match backend/services/categoryService.js)
-- ------------------------------------------------------------
INSERT INTO website_categories (category_name) VALUES
    ('Technology'),
    ('Entertainment'),
    ('Education'),
    ('Social Media'),
    ('Shopping'),
    ('News'),
    ('Productivity'),
    ('Other')
ON CONFLICT (category_name) DO NOTHING;
