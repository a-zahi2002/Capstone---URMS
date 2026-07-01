-- UP migration: Add indexes to optimize date range query filtering on created_at column
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_maint_created_at ON maintenance_tickets(created_at);
