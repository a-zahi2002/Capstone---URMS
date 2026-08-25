-- ────────────────────────────────────────────────────────────
-- 0007_user_approval.down.sql
-- ────────────────────────────────────────────────────────────

-- 1. Remove constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS valid_approval_status;

-- 2. Drop approval_status column
ALTER TABLE users DROP COLUMN IF EXISTS approval_status;
