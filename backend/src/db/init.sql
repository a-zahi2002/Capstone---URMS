CREATE DATABASE IF NOT EXISTS urms_db_new;
USE urms_db_new;

CREATE TABLE IF NOT EXISTS resources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL DEFAULT 'Lecture Halls',
  capacity VARCHAR(100) NOT NULL DEFAULT '0',
  location VARCHAR(255) NOT NULL,
  availability_status VARCHAR(50) NOT NULL DEFAULT 'Available',
  equipment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  resource_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Approved',
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
);

-- Insert dummy data (only if table is empty)
INSERT INTO resources (name, type, capacity, location, availability_status)
SELECT * FROM (SELECT
  'Main Auditorium' AS name, 'Lecture Halls' AS type, '500' AS capacity, 'Block A' AS location, 'Available' AS availability_status
) AS tmp WHERE NOT EXISTS (SELECT 1 FROM resources LIMIT 1);
