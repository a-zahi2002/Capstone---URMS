-- ────────────────────────────────────────────────────────────
-- 0002_rls_policies.down.sql
-- UniLink URMS - Rollback Row Level Security Policies
-- ────────────────────────────────────────────────────────────

-- 1. DISABLE RLS ON ALL TABLES
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE resources DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. DROP POLICIES
DROP POLICY IF EXISTS "manage_user_preferences" ON user_preferences;
DROP POLICY IF EXISTS "manage_report_schedules" ON report_schedules;
DROP POLICY IF EXISTS "manage_reports" ON reports;
DROP POLICY IF EXISTS "manage_notifications" ON notifications;
DROP POLICY IF EXISTS "delete_maint_tickets" ON maintenance_tickets;
DROP POLICY IF EXISTS "update_maint_tickets" ON maintenance_tickets;
DROP POLICY IF EXISTS "insert_maint_tickets" ON maintenance_tickets;
DROP POLICY IF EXISTS "select_maint_tickets" ON maintenance_tickets;
DROP POLICY IF EXISTS "delete_bookings" ON bookings;
DROP POLICY IF EXISTS "update_bookings" ON bookings;
DROP POLICY IF EXISTS "insert_bookings" ON bookings;
DROP POLICY IF EXISTS "select_bookings" ON bookings;
DROP POLICY IF EXISTS "manage_resources_admin" ON resources;
DROP POLICY IF EXISTS "select_resources" ON resources;
DROP POLICY IF EXISTS "delete_users" ON users;
DROP POLICY IF EXISTS "update_users" ON users;
DROP POLICY IF EXISTS "insert_users" ON users;
DROP POLICY IF EXISTS "select_users" ON users;

-- 3. DROP HELPER FUNCTIONS
DROP FUNCTION IF EXISTS get_urms_role();
DROP FUNCTION IF EXISTS get_urms_uid();
