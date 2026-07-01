-- ────────────────────────────────────────────────────────────
-- 0004_seed_data.down.sql
-- UniLink URMS - Rollback Seeding (Delete Specific Mock Data Only)
-- ────────────────────────────────────────────────────────────

-- Delete report schedules
DELETE FROM report_schedules WHERE id = '11223344-5566-7788-9900-aabbccddeeff';

-- Delete notifications
DELETE FROM notifications WHERE id = 'a7b6c5d4-e3f2-1a0b-9c8d-7e6f5a4b3c2d';

-- Delete tickets
DELETE FROM maintenance_tickets WHERE id = '99887766-5544-3322-1100-aabbccddeeff';

-- Delete bookings
DELETE FROM bookings WHERE id IN (
  'f1e2d3c4-b5a6-7988-9766-554433221100',
  '00112233-4455-6677-8899-aabbccddeeff'
);

-- Delete resources
DELETE FROM resources WHERE id IN (
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e',
  'c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f',
  'd4e5f67a-8b9c-0d1e-2f3a-4b5c6d7e8f9a',
  'e5f67a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b'
);

-- Delete user preferences
DELETE FROM user_preferences WHERE user_id IN (
  'mock-admin',
  'mock-lecturer',
  'mock-student',
  'mock-maintenance'
);

-- Delete users
DELETE FROM users WHERE id IN (
  'mock-admin',
  'mock-lecturer',
  'mock-student',
  'mock-maintenance'
);
