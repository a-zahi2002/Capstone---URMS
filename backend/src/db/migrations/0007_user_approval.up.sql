-- ────────────────────────────────────────────────────────────
-- 0007_user_approval.up.sql
-- ────────────────────────────────────────────────────────────

-- 1. Add approval_status column to users table with a default of 'Pending'
ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'Pending';

-- 2. Update existing users to 'Approved' so they don't get locked out
UPDATE users SET approval_status = 'Approved';

-- 3. Add constraint to validate correct statuses
ALTER TABLE users ADD CONSTRAINT valid_approval_status CHECK (approval_status IN ('Pending', 'Approved', 'Rejected'));
