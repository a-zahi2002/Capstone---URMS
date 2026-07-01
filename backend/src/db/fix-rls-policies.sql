-- ═══════════════════════════════════════════════════════════════
-- FIX: Add RLS Policies for URMS tables
-- ═══════════════════════════════════════════════════════════════
-- Run this in Supabase Dashboard → SQL Editor
-- This fixes "Error fetching/creating user profile: {}" errors
-- caused by RLS blocking anon key access.
-- ═══════════════════════════════════════════════════════════════

-- ─── users ────────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on users" ON users;
CREATE POLICY "Allow public read on users"
  ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on users" ON users;
CREATE POLICY "Allow public insert on users"
  ON users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on users" ON users;
CREATE POLICY "Allow public update on users"
  ON users FOR UPDATE USING (true) WITH CHECK (true);

-- ─── resources ────────────────────────────────────────────────
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on resources" ON resources;
CREATE POLICY "Allow public read on resources"
  ON resources FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on resources" ON resources;
CREATE POLICY "Allow public insert on resources"
  ON resources FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on resources" ON resources;
CREATE POLICY "Allow public update on resources"
  ON resources FOR UPDATE USING (true) WITH CHECK (true);

-- ─── bookings ─────────────────────────────────────────────────
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on bookings" ON bookings;
CREATE POLICY "Allow public read on bookings"
  ON bookings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on bookings" ON bookings;
CREATE POLICY "Allow public insert on bookings"
  ON bookings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on bookings" ON bookings;
CREATE POLICY "Allow public update on bookings"
  ON bookings FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete on bookings" ON bookings;
CREATE POLICY "Allow public delete on bookings"
  ON bookings FOR DELETE USING (true);

-- ─── maintenance_tickets ─────────────────────────────────────
ALTER TABLE maintenance_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on maintenance_tickets" ON maintenance_tickets;
CREATE POLICY "Allow public read on maintenance_tickets"
  ON maintenance_tickets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on maintenance_tickets" ON maintenance_tickets;
CREATE POLICY "Allow public insert on maintenance_tickets"
  ON maintenance_tickets FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on maintenance_tickets" ON maintenance_tickets;
CREATE POLICY "Allow public update on maintenance_tickets"
  ON maintenance_tickets FOR UPDATE USING (true) WITH CHECK (true);

-- ─── notifications ───────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on notifications" ON notifications;
CREATE POLICY "Allow public read on notifications"
  ON notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on notifications" ON notifications;
CREATE POLICY "Allow public insert on notifications"
  ON notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on notifications" ON notifications;
CREATE POLICY "Allow public update on notifications"
  ON notifications FOR UPDATE USING (true) WITH CHECK (true);

-- ─── reports ─────────────────────────────────────────────────
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on reports" ON reports;
CREATE POLICY "Allow public read on reports"
  ON reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on reports" ON reports;
CREATE POLICY "Allow public insert on reports"
  ON reports FOR INSERT WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- Done! RLS policies are now in place.
-- ═══════════════════════════════════════════════════════════════
