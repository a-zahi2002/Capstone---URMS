-- ────────────────────────────────────────────────────────────
-- 0002_rls_policies.up.sql
-- UniLink URMS - Row Level Security Policies
-- ────────────────────────────────────────────────────────────

-- 1. HELPER FUNCTIONS (Extract Firebase UID & Role from context/headers)
CREATE OR REPLACE FUNCTION get_urms_uid()
RETURNS TEXT AS $$
  SELECT COALESCE(
    nullif(current_setting('request.jwt.claims', true)::json->>'sub', ''),
    current_setting('request.headers', true)::json->>'x-urms-user-id'
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_urms_role()
RETURNS TEXT AS $$
  SELECT current_setting('request.headers', true)::json->>'x-urms-user-role';
$$ LANGUAGE sql STABLE;

-- 2. ENABLE RLS ON ALL TABLES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES DEFINITIONS

-- 3.1 USERS POLICIES
DROP POLICY IF EXISTS "select_users" ON users;
CREATE POLICY "select_users" ON users
    FOR SELECT TO public
    USING (get_urms_uid() IS NOT NULL);

DROP POLICY IF EXISTS "insert_users" ON users;
CREATE POLICY "insert_users" ON users
    FOR INSERT TO public
    WITH CHECK (get_urms_uid() = id OR get_urms_role() = 'admin');

DROP POLICY IF EXISTS "update_users" ON users;
CREATE POLICY "update_users" ON users
    FOR UPDATE TO public
    USING (get_urms_uid() = id OR get_urms_role() = 'admin')
    WITH CHECK (get_urms_uid() = id OR get_urms_role() = 'admin');

DROP POLICY IF EXISTS "delete_users" ON users;
CREATE POLICY "delete_users" ON users
    FOR DELETE TO public
    USING (get_urms_role() = 'admin');

-- 3.2 RESOURCES POLICIES
DROP POLICY IF EXISTS "select_resources" ON resources;
CREATE POLICY "select_resources" ON resources
    FOR SELECT TO public
    USING (get_urms_uid() IS NOT NULL);

DROP POLICY IF EXISTS "manage_resources_admin" ON resources;
CREATE POLICY "manage_resources_admin" ON resources
    FOR ALL TO public
    USING (get_urms_role() = 'admin')
    WITH CHECK (get_urms_role() = 'admin');

-- 3.3 BOOKINGS POLICIES
DROP POLICY IF EXISTS "select_bookings" ON bookings;
CREATE POLICY "select_bookings" ON bookings
    FOR SELECT TO public
    USING (get_urms_uid() IS NOT NULL);

DROP POLICY IF EXISTS "insert_bookings" ON bookings;
CREATE POLICY "insert_bookings" ON bookings
    FOR INSERT TO public
    WITH CHECK (get_urms_uid() = user_id OR get_urms_role() = 'admin');

DROP POLICY IF EXISTS "update_bookings" ON bookings;
CREATE POLICY "update_bookings" ON bookings
    FOR UPDATE TO public
    USING (get_urms_uid() = user_id OR get_urms_role() = 'admin')
    WITH CHECK (get_urms_uid() = user_id OR get_urms_role() = 'admin');

DROP POLICY IF EXISTS "delete_bookings" ON bookings;
CREATE POLICY "delete_bookings" ON bookings
    FOR DELETE TO public
    USING (get_urms_uid() = user_id OR get_urms_role() = 'admin');

-- 3.4 MAINTENANCE TICKETS POLICIES
DROP POLICY IF EXISTS "select_maint_tickets" ON maintenance_tickets;
CREATE POLICY "select_maint_tickets" ON maintenance_tickets
    FOR SELECT TO public
    USING (get_urms_role() IN ('admin', 'maintenance') OR get_urms_uid() = created_by);

DROP POLICY IF EXISTS "insert_maint_tickets" ON maintenance_tickets;
CREATE POLICY "insert_maint_tickets" ON maintenance_tickets
    FOR INSERT TO public
    WITH CHECK (get_urms_uid() = created_by OR get_urms_role() = 'admin');

DROP POLICY IF EXISTS "update_maint_tickets" ON maintenance_tickets;
CREATE POLICY "update_maint_tickets" ON maintenance_tickets
    FOR UPDATE TO public
    USING (get_urms_role() IN ('admin', 'maintenance') OR get_urms_uid() = created_by)
    WITH CHECK (get_urms_role() IN ('admin', 'maintenance') OR get_urms_uid() = created_by);

DROP POLICY IF EXISTS "delete_maint_tickets" ON maintenance_tickets;
CREATE POLICY "delete_maint_tickets" ON maintenance_tickets
    FOR DELETE TO public
    USING (get_urms_role() = 'admin');

-- 3.5 NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "manage_notifications" ON notifications;
CREATE POLICY "manage_notifications" ON notifications
    FOR ALL TO public
    USING (get_urms_uid() = user_id OR get_urms_role() = 'admin')
    WITH CHECK (get_urms_uid() = user_id OR get_urms_role() = 'admin');

-- 3.6 REPORTS POLICIES
DROP POLICY IF EXISTS "manage_reports" ON reports;
CREATE POLICY "manage_reports" ON reports
    FOR ALL TO public
    USING (get_urms_role() = 'admin')
    WITH CHECK (get_urms_role() = 'admin');

-- 3.7 REPORT SCHEDULES POLICIES
DROP POLICY IF EXISTS "manage_report_schedules" ON report_schedules;
CREATE POLICY "manage_report_schedules" ON report_schedules
    FOR ALL TO public
    USING (get_urms_role() = 'admin')
    WITH CHECK (get_urms_role() = 'admin');

-- 3.8 USER PREFERENCES POLICIES
DROP POLICY IF EXISTS "manage_user_preferences" ON user_preferences;
CREATE POLICY "manage_user_preferences" ON user_preferences
    FOR ALL TO public
    USING (get_urms_uid() = user_id OR get_urms_role() = 'admin')
    WITH CHECK (get_urms_uid() = user_id OR get_urms_role() = 'admin');
