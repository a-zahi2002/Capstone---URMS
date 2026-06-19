-- ────────────────────────────────────────────────────────────
-- UniLink URMS - Full Text Indexing Schema (PostgreSQL/Supabase)
-- ────────────────────────────────────────────────────────────
-- Run this script in your Supabase SQL Editor to enable full-text
-- indexing on the resources, maintenance_tickets, and users tables.
-- ────────────────────────────────────────────────────────────

-- 1. RESOURCES TABLE FTS INDEXING
-- Combines name, type, location, department, and elements of equipment array
ALTER TABLE resources ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(name, '')) ||
  to_tsvector('english', coalesce(type, '')) ||
  to_tsvector('english', coalesce(location, '')) ||
  to_tsvector('english', coalesce(department, '')) ||
  jsonb_to_tsvector('english', coalesce(equipment, '[]'::jsonb), '["string"]')
) STORED;

CREATE INDEX IF NOT EXISTS resources_fts_idx ON resources USING gin(fts);

-- 2. MAINTENANCE TICKETS TABLE FTS INDEXING
-- Combines title, description, priority, status, outcome
ALTER TABLE maintenance_tickets ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(title, '')) ||
  to_tsvector('english', coalesce(description, '')) ||
  to_tsvector('english', coalesce(priority, '')) ||
  to_tsvector('english', coalesce(status, '')) ||
  to_tsvector('english', coalesce(outcome, ''))
) STORED;

CREATE INDEX IF NOT EXISTS maintenance_tickets_fts_idx ON maintenance_tickets USING gin(fts);

-- 3. USERS TABLE FTS INDEXING
-- Combines name, email, role, department
ALTER TABLE users ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(name, '')) ||
  to_tsvector('english', coalesce(email, '')) ||
  to_tsvector('english', coalesce(role, '')) ||
  to_tsvector('english', coalesce(department, ''))
) STORED;

CREATE INDEX IF NOT EXISTS users_fts_idx ON users USING gin(fts);
