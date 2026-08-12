-- ────────────────────────────────────────────────────────────
-- UniLink URMS - Comprehensive Database Schema (PostgreSQL/Supabase)
-- ────────────────────────────────────────────────────────────
-- This script initializes the database tables, relationships,
-- indexes, and integrity constraints for the URMS platform.
-- ────────────────────────────────────────────────────────────

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLES

-- 2.1 USERS TABLE
-- Tracks both Supabase Auth users and external Firebase users
CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY,           -- Firebase UID
    name       TEXT NOT NULL,
    email      TEXT UNIQUE NOT NULL,
    role       TEXT NOT NULL DEFAULT 'student', -- 'student', 'lecturer', 'admin', 'maintenance'
    department TEXT,                       -- Added for department-wise analytics
    password_hash TEXT,                    -- Bcrypt hash for secure password storage (nullable for legacy/mock users)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 RESOURCES TABLE
-- Physical assets available for booking
CREATE TABLE IF NOT EXISTS resources (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT NOT NULL,
    type                TEXT NOT NULL DEFAULT 'Lecture Halls', -- 'Lecture Halls', 'Labs', 'Rooms', 'Vehicles', 'Equipment'
    capacity            INTEGER NOT NULL DEFAULT 0,            -- Changed from TEXT to INTEGER for math
    location            TEXT NOT NULL,
    availability_status TEXT NOT NULL DEFAULT 'Available',     -- 'Available', 'Booked', 'Under Maintenance', 'Inactive'
    department          TEXT,                                  -- Added for department-wise analytics
    equipment           JSONB DEFAULT '[]'::jsonb,             -- Changed from TEXT to JSONB for querying
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 BOOKINGS TABLE
-- Tracks resource reservations by users
CREATE TABLE IF NOT EXISTS bookings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    user_id     TEXT REFERENCES users(id) ON DELETE SET NULL, -- Reference to users table
    start_time  TIMESTAMPTZ NOT NULL,
    end_time    TIMESTAMPTZ NOT NULL,
    status      TEXT DEFAULT 'Pending',    -- 'Pending', 'Approved', 'Completed', 'Cancelled', 'Rejected'
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT valid_booking_status CHECK (status IN ('Pending', 'Approved', 'Completed', 'Cancelled', 'Rejected'))
);

-- 2.4 MAINTENANCE TICKETS TABLE
-- Tracks issues and repairs for resources
CREATE TABLE IF NOT EXISTS maintenance_tickets (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id  UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    title        TEXT NOT NULL,
    description  TEXT,
    priority     TEXT DEFAULT 'Medium',    -- 'Low', 'Medium', 'High'
    status       TEXT DEFAULT 'OPEN',      -- 'OPEN', 'IN_PROGRESS', 'COMPLETED'
    created_by   TEXT REFERENCES users(id) ON DELETE SET NULL,
    assigned_to  TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,              -- Timestamp when status becomes COMPLETED
    outcome      TEXT,                     -- 'Fixed', 'Faulty', 'Decommissioned'
    
    CONSTRAINT valid_maint_priority CHECK (priority IN ('Low', 'Medium', 'High')),
    CONSTRAINT valid_maint_status CHECK (status IN ('OPEN', 'IN_PROGRESS', 'COMPLETED')),
    CONSTRAINT valid_maint_outcome CHECK (outcome IS NULL OR outcome IN ('Fixed', 'Faulty', 'Decommissioned'))
);

-- 2.5 NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title        TEXT,                     -- Added for notification headers
    message      TEXT NOT NULL,
    type         TEXT DEFAULT 'info',      -- 'info', 'success', 'warning', 'error', 'alert'
    is_read      BOOLEAN DEFAULT FALSE,
    timestamp    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.6 REPORTS TABLE
-- Tracks system-generated analytics reports
CREATE TABLE IF NOT EXISTS reports (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    report_type  TEXT NOT NULL,            -- 'maintenance', 'usage', 'booking', 'overview'
    file_path    TEXT,                     -- URL to stored file
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.7 REPORT SCHEDULES TABLE
-- Tracks automated weekly report configurations
CREATE TABLE IF NOT EXISTS report_schedules (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_types TEXT[] NOT NULL,          -- ['booking', 'usage', 'maintenance', 'overview']
    recipients   TEXT[] NOT NULL,          -- Array of emails or user IDs
    delivery_day INTEGER NOT NULL DEFAULT 1, -- 0=Sunday, 1=Monday, etc.
    delivery_time TIME NOT NULL DEFAULT '09:00:00',
    format       TEXT NOT NULL DEFAULT 'pdf', -- 'pdf', 'excel'
    is_enabled   BOOLEAN DEFAULT TRUE,
    last_run_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. INDEXES (Optimized for Analytics & Search)
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_resources_department ON resources(department);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_availability ON resources(availability_status);
CREATE INDEX IF NOT EXISTS idx_bookings_resource_id ON bookings(resource_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_time ON bookings(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_maint_resource_id ON maintenance_tickets(resource_id);
CREATE INDEX IF NOT EXISTS idx_maint_status ON maintenance_tickets(status);
CREATE INDEX IF NOT EXISTS idx_maint_assigned_to ON maintenance_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;

-- 4. HELPER FUNCTIONS (For RLS & Context)
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

-- 2.8 USER PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id           TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email_bookings    BOOLEAN DEFAULT TRUE,
    email_maintenance BOOLEAN DEFAULT TRUE,
    email_system      BOOLEAN DEFAULT TRUE,
    push_bookings     BOOLEAN DEFAULT TRUE,
    push_maintenance  BOOLEAN DEFAULT TRUE,
    push_system       BOOLEAN DEFAULT TRUE,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ENABLE RLS ON user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR user_preferences
CREATE POLICY select_user_preferences ON user_preferences
    FOR SELECT TO public
    USING (get_urms_uid() = user_id);

CREATE POLICY upsert_user_preferences ON user_preferences
    FOR ALL TO public
    USING (get_urms_uid() = user_id)
    WITH CHECK (get_urms_uid() = user_id);
