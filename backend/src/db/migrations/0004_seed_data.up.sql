-- ────────────────────────────────────────────────────────────
-- 0004_seed_data.up.sql
-- UniLink URMS - Mock Data Seeding (Idempotent)
-- ────────────────────────────────────────────────────────────

-- 1. MOCK USERS
-- Precomputed bcrypt hash for 'Password123' is '$2a$10$7Z2v/oFzHwE9lT5tL6nO0uNl/V5xYpDszuN4Z.wH7z7p8u8wz9yOi'
INSERT INTO users (id, name, email, role, department, password_hash)
VALUES
('mock-admin', 'System Admin', 'admin@demo.lk', 'admin', 'Faculty of Computing', '$2a$10$7Z2v/oFzHwE9lT5tL6nO0uNl/V5xYpDszuN4Z.wH7z7p8u8wz9yOi'),
('mock-lecturer', 'Dr. Smith', 'smith@demo.lk', 'lecturer', 'Faculty of Computing', '$2a$10$7Z2v/oFzHwE9lT5tL6nO0uNl/V5xYpDszuN4Z.wH7z7p8u8wz9yOi'),
('mock-student', 'John Student', 'student@demo.lk', 'student', 'Faculty of Applied Sciences', '$2a$10$7Z2v/oFzHwE9lT5tL6nO0uNl/V5xYpDszuN4Z.wH7z7p8u8wz9yOi'),
('mock-maintenance', 'Mike Technician', 'mike@demo.lk', 'maintenance', 'Faculty of Computing', '$2a$10$7Z2v/oFzHwE9lT5tL6nO0uNl/V5xYpDszuN4Z.wH7z7p8u8wz9yOi')
ON CONFLICT (id) DO NOTHING;

-- 2. USER PREFERENCES
INSERT INTO user_preferences (user_id, email_bookings, email_maintenance, email_system, push_bookings, push_maintenance, push_system)
VALUES
('mock-admin', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE),
('mock-lecturer', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE),
('mock-student', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE),
('mock-maintenance', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE)
ON CONFLICT (user_id) DO NOTHING;

-- 3. RESOURCES
-- Using stable UUIDs to prevent duplicates on repeated migrations
INSERT INTO resources (id, name, type, capacity, location, availability_status, department, equipment)
VALUES
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Lecture Hall 01', 'Lecture Halls', 150, 'Block B', 'Available', 'Faculty of Computing', '["Projector", "Whiteboard", "AC"]'),
('b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e', 'Physics Lab', 'Labs', 40, 'Science Block', 'Available', 'Faculty of Applied Sciences', '["Oscilloscopes", "Multimeters"]'),
('c3d4e5f6-7a8b-9c0d-1e2f-3a4b5c6d7e8f', 'Meeting Room A', 'Rooms', 20, 'Admin Block', 'Available', 'Faculty of Management', '["Conference Phone", "Display Screen"]'),
('d4e5f67a-8b9c-0d1e-2f3a-4b5c6d7e8f9a', 'Faculty Van 01', 'Vehicles', 14, 'Transport Pool', 'Available', 'Faculty of Engineering', '["GPS", "AC"]'),
('e5f67a8b-9c0d-1e2f-3a4b-5c6d7e8f9a0b', 'Seminar Room 2', 'Rooms', 30, 'Block C', 'Under Maintenance', 'Faculty of Applied Sciences', '["Smart Board"]')
ON CONFLICT (id) DO NOTHING;

-- 4. BOOKINGS
-- Idempotent check: only insert if booking doesn't exist for the timeframe
INSERT INTO bookings (id, resource_id, user_id, start_time, end_time, status)
VALUES
('f1e2d3c4-b5a6-7988-9766-554433221100', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'mock-lecturer', NOW() - INTERVAL '1 day', NOW() - INTERVAL '22 hours', 'Completed'),
('00112233-4455-6677-8899-aabbccddeeff', 'b2c3d4e5-f67a-8b9c-0d1e-2f3a4b5c6d7e', 'mock-student', NOW(), NOW() + INTERVAL '3 hours', 'Approved')
ON CONFLICT (id) DO NOTHING;

-- 5. MAINTENANCE TICKETS
INSERT INTO maintenance_tickets (id, resource_id, title, description, priority, status, created_by)
VALUES
('99887766-5544-3322-1100-aabbccddeeff', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'AC Maintenance', 'Blowing warm air', 'Medium', 'OPEN', 'mock-lecturer')
ON CONFLICT (id) DO NOTHING;

-- 6. NOTIFICATIONS
INSERT INTO notifications (id, user_id, title, message, type, is_read)
VALUES
('a7b6c5d4-e3f2-1a0b-9c8d-7e6f5a4b3c2d', 'mock-admin', 'System Initialized', 'UniLink URMS database has been cleaned and set up with resources.', 'success', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 7. REPORT SCHEDULES
INSERT INTO report_schedules (id, report_types, recipients, delivery_day, delivery_time, format, is_enabled)
VALUES
('11223344-5566-7788-9900-aabbccddeeff', ARRAY['overview'], ARRAY['admin@demo.lk'], 1, '09:00:00', 'pdf', TRUE)
ON CONFLICT (id) DO NOTHING;
