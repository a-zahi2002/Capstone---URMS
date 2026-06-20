-- ────────────────────────────────────────────────────────────
-- 0001_initial_schema.up.sql
-- UniLink URMS - Core Database Schema
-- ────────────────────────────────────────────────────────────

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLES

-- 2.1 USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,              -- Firebase UID
    name          TEXT NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    role          TEXT NOT NULL DEFAULT 'student',
    department    TEXT,
    password_hash TEXT,                          -- Nullable for Firebase-only users
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_users_role CHECK (role IN ('student', 'lecturer', 'admin', 'maintenance'))
);

-- 2.2 RESOURCES TABLE
CREATE TABLE IF NOT EXISTS resources (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT NOT NULL,
    type                TEXT NOT NULL DEFAULT 'Lecture Halls',
    capacity            INTEGER NOT NULL DEFAULT 0,
    location            TEXT NOT NULL,
    availability_status TEXT NOT NULL DEFAULT 'Available',
    department          TEXT,
    equipment           JSONB DEFAULT '[]'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_resources_type CHECK (type IN ('Lecture Halls', 'Labs', 'Rooms', 'Vehicles', 'Equipment')),
    CONSTRAINT valid_resources_capacity CHECK (capacity >= 0),
    CONSTRAINT valid_resources_status CHECK (availability_status IN ('Available', 'Booked', 'Under Maintenance', 'Inactive', 'Maintenance'))
);

-- 2.3 BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    user_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
    start_time  TIMESTAMPTZ NOT NULL,
    end_time    TIMESTAMPTZ NOT NULL,
    status      TEXT NOT NULL DEFAULT 'Pending',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT valid_booking_status CHECK (status IN ('Pending', 'Approved', 'Completed', 'Cancelled', 'Rejected'))
);

-- 2.4 MAINTENANCE TICKETS TABLE
CREATE TABLE IF NOT EXISTS maintenance_tickets (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id  UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    title        TEXT NOT NULL,
    description  TEXT,
    priority     TEXT NOT NULL DEFAULT 'Medium',
    status       TEXT NOT NULL DEFAULT 'OPEN',
    created_by   TEXT REFERENCES users(id) ON DELETE SET NULL,
    assigned_to  TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    outcome      TEXT,
    
    CONSTRAINT valid_maint_priority CHECK (priority IN ('Low', 'Medium', 'High')),
    CONSTRAINT valid_maint_status CHECK (status IN ('OPEN', 'IN_PROGRESS', 'COMPLETED')),
    CONSTRAINT valid_maint_outcome CHECK (outcome IS NULL OR outcome IN ('Fixed', 'Faulty', 'Decommissioned'))
);

-- 2.5 NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title     TEXT,
    message   TEXT NOT NULL,
    type      TEXT NOT NULL DEFAULT 'info',
    is_read   BOOLEAN NOT NULL DEFAULT FALSE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_notification_type CHECK (type IN ('info', 'success', 'warning', 'error', 'alert'))
);

-- 2.6 REPORTS TABLE
CREATE TABLE IF NOT EXISTS reports (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    report_type  TEXT NOT NULL,
    file_path    TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_report_type CHECK (report_type IN ('maintenance', 'usage', 'booking', 'overview'))
);

-- 2.7 REPORT SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS report_schedules (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_types  TEXT[] NOT NULL,
    recipients    TEXT[] NOT NULL,
    delivery_day  INTEGER NOT NULL DEFAULT 1,
    delivery_time TIME NOT NULL DEFAULT '09:00:00',
    format        TEXT NOT NULL DEFAULT 'pdf',
    is_enabled    BOOLEAN NOT NULL DEFAULT TRUE,
    last_run_at   TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_schedule_format CHECK (format IN ('pdf', 'excel')),
    CONSTRAINT valid_schedule_delivery_day CHECK (delivery_day BETWEEN 0 AND 6)
);

-- 2.8 USER PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id           TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email_bookings    BOOLEAN NOT NULL DEFAULT TRUE,
    email_maintenance BOOLEAN NOT NULL DEFAULT TRUE,
    email_system      BOOLEAN NOT NULL DEFAULT TRUE,
    push_bookings     BOOLEAN NOT NULL DEFAULT TRUE,
    push_maintenance  BOOLEAN NOT NULL DEFAULT TRUE,
    push_system       BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. INDEXES
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
