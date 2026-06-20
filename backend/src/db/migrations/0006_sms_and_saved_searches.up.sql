-- ────────────────────────────────────────────────────────────
-- 0006_sms_and_saved_searches.up.sql
-- ────────────────────────────────────────────────────────────

-- 1. Add phone column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Create sms_logs table
CREATE TABLE IF NOT EXISTS sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    phone TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on sms_logs
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy for sms_logs: Allow users with 'admin' role to view all logs
CREATE POLICY select_sms_logs_admin ON sms_logs
    FOR SELECT TO public
    USING (get_urms_role() = 'admin');

-- RLS Policy for sms_logs: Allow system inserts
CREATE POLICY insert_sms_logs_system ON sms_logs
    FOR INSERT TO public
    WITH CHECK (true);

-- 3. Create saved_searches table
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    search_parameters JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on saved_searches
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policy for saved_searches: Users can manage (select/insert/update/delete) their own saved searches
CREATE POLICY manage_own_saved_searches ON saved_searches
    FOR ALL TO public
    USING (get_urms_uid() = user_id)
    WITH CHECK (get_urms_uid() = user_id);
