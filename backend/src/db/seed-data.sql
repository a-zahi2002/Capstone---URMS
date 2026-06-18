
-- ────────────────────────────────────────────────────────────
-- URMS Mock Data Seed (SQL Version)
-- ────────────────────────────────────────────────────────────
-- Run this in your Supabase SQL Editor to populate the tables.
-- ────────────────────────────────────────────────────────────

-- 1. Resources
INSERT INTO resources (name, type, capacity, location, availability_status, equipment)
VALUES 
('Lecture Hall 01', 'Lecture Halls', '150', 'Block B', 'Available', '["Projector", "Whiteboard", "AC"]'),
('Physics Lab', 'Labs', '40', 'Science Block', 'Available', '["Oscilloscopes", "Multimeters"]'),
('Mini Auditorium', 'Lecture Halls', '200', 'Main Building', 'Available', '["Sound System", "Projector", "Stage"]'),
('Meeting Room A', 'Rooms', '20', 'Admin Block', 'Available', '["Conference Phone", "Display Screen"]'),
('Chemistry Lab', 'Labs', '50', 'Science Block', 'Available', '["Fume Hoods", "Microscopes"]'),
('Computer Lab 01', 'Labs', '60', 'IT Center', 'Available', '["60 PCs", "Projector", "High-Speed Internet"]'),
('Faculty Van 01', 'Vehicles', '14', 'Transport Pool', 'Available', '["GPS", "AC"]'),
('Projector X1', 'Equipment', '1', 'IT Desk', 'Available', '["VGA Cable", "Remote"]'),
('Seminar Room 2', 'Rooms', '30', 'Block C', 'Maintenance', '["Smart Board"]'),
('Hall 7', 'Lecture Halls', '100', 'Block D', 'Booked', '["Projector"]');

-- 2. Mock Users (Required for Bookings and Tickets)
-- Note: Replace these with real Firebase UIDs if you have them.
INSERT INTO users (id, name, email, role)
VALUES 
('mock-admin', 'System Admin', 'admin@demo.lk', 'admin'),
('mock-student', 'John Student', 'student@demo.lk', 'student'),
('mock-lecturer', 'Dr. Smith', 'smith@demo.lk', 'lecturer'),
('mock-maintenance', 'Mike Technician', 'mike@demo.lk', 'maintenance');

-- 3. Bookings
INSERT INTO bookings (resource_id, user_id, start_time, end_time, status)
SELECT id, 'mock-lecturer', NOW() - INTERVAL '1 day', NOW() - INTERVAL '22 hours', 'Completed' FROM resources WHERE name = 'Lecture Hall 01' LIMIT 1;

INSERT INTO bookings (resource_id, user_id, start_time, end_time, status)
SELECT id, 'mock-student', NOW(), NOW() + INTERVAL '3 hours', 'Approved' FROM resources WHERE name = 'Physics Lab' LIMIT 1;

-- 4. Maintenance Tickets
INSERT INTO maintenance_tickets (resource_id, title, description, priority, status, created_by)
SELECT id, 'AC Maintenance', 'Blowing warm air', 'Medium', 'OPEN', 'mock-lecturer' FROM resources WHERE name = 'Lecture Hall 01' LIMIT 1;
