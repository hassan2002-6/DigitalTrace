-- ============================================================
--  Migration: add browser_history.visit_count
--
--  Only needed if you created the database before visit counts
--  were supported. Fresh installs already get this column from
--  database/schema.sql.
--
--  Run once:
--    mysql -u root -p digitaltrace < database/migrations/001_add_visit_count.sql
-- ============================================================

ALTER TABLE browser_history
    ADD COLUMN visit_count INT UNSIGNED NOT NULL DEFAULT 1 AFTER visit_time;
