-- ────────────────────────────────────────────────────────────
-- 0003_search_indexing.up.sql
-- UniLink URMS - Full Text Search Indexing
-- ────────────────────────────────────────────────────────────

-- 1. RESOURCES TABLE FTS INDEXING
ALTER TABLE resources ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(name, '')) ||
  to_tsvector('english', coalesce(type, '')) ||
  to_tsvector('english', coalesce(location, '')) ||
  to_tsvector('english', coalesce(department, '')) ||
  jsonb_to_tsvector('english', coalesce(equipment, '[]'::jsonb), '["string"]')
) STORED;

CREATE INDEX IF NOT EXISTS resources_fts_idx ON resources USING gin(fts);

-- 2. MAINTENANCE TICKETS TABLE FTS INDEXING
ALTER TABLE maintenance_tickets ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(title, '')) ||
  to_tsvector('english', coalesce(description, '')) ||
  to_tsvector('english', coalesce(priority, '')) ||
  to_tsvector('english', coalesce(status, '')) ||
  to_tsvector('english', coalesce(outcome, ''))
) STORED;

CREATE INDEX IF NOT EXISTS maintenance_tickets_fts_idx ON maintenance_tickets USING gin(fts);

-- 3. USERS TABLE FTS INDEXING
ALTER TABLE users ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(name, '')) ||
  to_tsvector('english', coalesce(email, '')) ||
  to_tsvector('english', coalesce(role, '')) ||
  to_tsvector('english', coalesce(department, ''))
) STORED;

CREATE INDEX IF NOT EXISTS users_fts_idx ON users USING gin(fts);
