
-- ────────────────────────────────────────────────────────────
-- URMS RLS Policies
-- ────────────────────────────────────────────────────────────
-- This script enables Row Level Security (RLS) on all tables
-- and defines policies based on user roles and identities.
--
-- Note: These policies use auth.uid() which assumes the
-- JWT 'sub' claim contains the user's ID.
-- ────────────────────────────────────────────────────────────

-- 1. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_header_debug()
RETURNS JSON AS $$
  SELECT current_setting('request.headers', true)::json;
$$ LANGUAGE sql STABLE;

-- ────────────────────────────────────────────────────────────
-- 2. Helper Functions: Extract Context from Headers
-- ────────────────────────────────────────────────────────────
-- These helpers extract the Firebase UID and Role passed by
-- the backend in the 'x-urms-user-id' and 'x-urms-user-role' headers.
-- Note: 'request.headers' is a PostgREST/Supabase built-in setting.

CREATE OR REPLACE FUNCTION get_urms_uid()
RETURNS TEXT AS $$
  -- First try standard auth.uid() (for future Supabase Auth use)
  -- Then fallback to custom header
  SELECT COALESCE(
    nullif(current_setting('request.jwt.claims', true)::json->>'sub', ''),
    current_setting('request.headers', true)::json->>'x-urms-user-id'
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_urms_role()
RETURNS TEXT AS $$
  -- Get role from custom header
  SELECT current_setting('request.headers', true)::json->>'x-urms-user-role';
$$ LANGUAGE sql STABLE;

-- ────────────────────────────────────────────────────────────
-- 3. Users Table Policies
-- ────────────────────────────────────────────────────────────
-- Users can read their own profile
CREATE POLICY "Users can view own profile" 
ON users FOR SELECT 
USING (get_urms_uid() = id);

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles" 
ON users FOR ALL 
USING (get_urms_role() = 'admin')
WITH CHECK (get_urms_role() = 'admin');

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON users FOR UPDATE 
USING (get_urms_uid() = id);

-- ────────────────────────────────────────────────────────────
-- 4. Resources Table Policies
-- ────────────────────────────────────────────────────────────
-- Everyone can view resources
CREATE POLICY "Anyone can view resources" 
ON resources FOR SELECT 
USING (true);

-- Only admins can modify resources
CREATE POLICY "Admins can modify resources" 
ON resources FOR ALL 
USING (get_urms_role() = 'admin')
WITH CHECK (get_urms_role() = 'admin');

-- ────────────────────────────────────────────────────────────
-- 5. Bookings Table Policies
-- ────────────────────────────────────────────────────────────
-- Users can view their own bookings
CREATE POLICY "Users can view own bookings" 
ON bookings FOR SELECT 
USING (get_urms_uid() = user_id OR get_urms_role() = 'admin');

-- Admins can manage all bookings
CREATE POLICY "Admins can manage all bookings" 
ON bookings FOR ALL 
USING (get_urms_role() = 'admin')
WITH CHECK (get_urms_role() = 'admin');

-- Users can create their own bookings
CREATE POLICY "Users can create own bookings" 
ON bookings FOR INSERT 
WITH CHECK (get_urms_uid() = user_id);

-- Users can cancel their own bookings
CREATE POLICY "Users can cancel own bookings" 
ON bookings FOR UPDATE 
USING (get_urms_uid() = user_id OR get_urms_role() = 'admin');

-- ────────────────────────────────────────────────────────────
-- 6. Maintenance Tickets Policies
-- ────────────────────────────────────────────────────────────
-- Maintenance staff and admins can see all tickets
CREATE POLICY "Staff can view all tickets" 
ON maintenance_tickets FOR SELECT 
USING (
  get_urms_role() IN ('admin', 'maintenance') OR 
  get_urms_uid() = created_by
);

-- Anyone can create a maintenance ticket
CREATE POLICY "Anyone can create tickets" 
ON maintenance_tickets FOR INSERT 
WITH CHECK (get_urms_uid() = created_by);

-- Admins can manage all tickets
CREATE POLICY "Admins can manage all tickets" 
ON maintenance_tickets FOR ALL 
USING (get_urms_role() = 'admin')
WITH CHECK (get_urms_role() = 'admin');

-- ────────────────────────────────────────────────────────────
-- 7. Notifications Policies
-- ────────────────────────────────────────────────────────────
-- Users can view and update their own notifications
CREATE POLICY "Users can manage own notifications" 
ON notifications FOR ALL 
USING (get_urms_uid() = user_id OR get_urms_role() = 'admin')
WITH CHECK (get_urms_uid() = user_id OR get_urms_role() = 'admin');

-- ────────────────────────────────────────────────────────────
-- 8. Reports Policies
-- ────────────────────────────────────────────────────────────
-- Admins can manage all reports
CREATE POLICY "Admins can manage all reports" 
ON reports FOR ALL 
USING (get_urms_role() = 'admin')
WITH CHECK (get_urms_role() = 'admin');
