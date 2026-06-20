-- ────────────────────────────────────────────────────────────
-- 0001_initial_schema.down.sql
-- UniLink URMS - Rollback Core Database Schema
-- ────────────────────────────────────────────────────────────

-- Drop tables in reverse-dependency order
DROP TABLE IF EXISTS user_preferences;
DROP TABLE IF EXISTS report_schedules;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS maintenance_tickets;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS users;
