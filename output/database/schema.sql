CREATE DATABASE IF NOT EXISTS urms_dev;
USE urms_dev;

-- Sprint 1: Users Table
CREATE TABLE IF NOT EXISTS users (
    userid INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role ENUM('admin', 'lecturer', 'student', 'maintenance') NOT NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sprint 1: Resources Table
CREATE TABLE IF NOT EXISTS resources (
    resourceid INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category ENUM('lecture_hall', 'lab', 'seminar_room', 'vehicle', 'equipment') NOT NULL,
    capacity INT DEFAULT 1,
    location VARCHAR(100),
    status ENUM('available', 'booked', 'maintenance') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sprint 1 Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_resources_category ON resources(category);
CREATE INDEX idx_resources_status ON resources(status);

-- Sprint 2: Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    bookingid INT AUTO_INCREMENT PRIMARY KEY,
    userid INT NOT NULL,
    resourceid INT NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('pending', 'approved', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE,
    CONSTRAINT fk_resource FOREIGN KEY (resourceid) REFERENCES resources(resourceid) ON DELETE RESTRICT
);

-- Sprint 2 Indexes
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_userid ON bookings(userid);
CREATE INDEX idx_bookings_resourceid ON bookings(resourceid);
CREATE UNIQUE INDEX idx_bookings_unique_slot ON bookings(userid, resourceid, booking_date, start_time);
