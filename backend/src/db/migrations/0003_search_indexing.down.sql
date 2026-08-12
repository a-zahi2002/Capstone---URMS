-- ────────────────────────────────────────────────────────────
-- 0003_search_indexing.down.sql
-- UniLink URMS - Rollback Full Text Search Indexing
-- ────────────────────────────────────────────────────────────

-- 1. DROP GIN INDEXES
DROP INDEX IF EXISTS users_fts_idx;
DROP INDEX IF EXISTS maintenance_tickets_fts_idx;
DROP INDEX IF EXISTS resources_fts_idx;

-- 2. DROP GENERATED COLUMNS
ALTER TABLE users DROP COLUMN IF EXISTS fts;
ALTER TABLE maintenance_tickets DROP COLUMN IF EXISTS fts;
ALTER TABLE resources DROP COLUMN IF EXISTS fts;
