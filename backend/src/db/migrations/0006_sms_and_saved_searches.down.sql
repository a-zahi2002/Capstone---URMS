-- ────────────────────────────────────────────────────────────
-- 0006_sms_and_saved_searches.down.sql
-- ────────────────────────────────────────────────────────────

-- 1. Drop saved_searches table
DROP TABLE IF EXISTS saved_searches;

-- 2. Drop sms_logs table
DROP TABLE IF EXISTS sms_logs;

-- 3. Remove phone column from users table
ALTER TABLE users DROP COLUMN IF EXISTS phone;
