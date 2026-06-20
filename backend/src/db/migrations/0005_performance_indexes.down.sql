-- DOWN migration: Drop performance indexes on created_at
DROP INDEX IF EXISTS idx_bookings_created_at;
DROP INDEX IF EXISTS idx_maint_created_at;
