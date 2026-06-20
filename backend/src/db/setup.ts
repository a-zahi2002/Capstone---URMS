import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function setup() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    console.log('Connecting to MySQL...');
    
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing init.sql...');
    await connection.query(sql);

    // Also ensure maintenance_tickets table exists if not in init.sql
    const maintenanceTicketsTable = `
      CREATE TABLE IF NOT EXISTS maintenance_tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        resourceId INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        priority ENUM('Low', 'Medium', 'High') DEFAULT 'Low',
        status ENUM('OPEN', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'OPEN',
        createdBy VARCHAR(255) NOT NULL,
        assignedTo VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        outcome ENUM('Fixed', 'Faulty', 'Decommissioned'),
        FOREIGN KEY (resourceId) REFERENCES resources(id) ON DELETE CASCADE
      );
    `;
    
    console.log(`Ensuring maintenance_tickets table exists in ${process.env.DB_NAME || 'urms_db_new'}...`);
    await connection.query(`USE ${process.env.DB_NAME || 'urms_db_new'};`);
    await connection.query(maintenanceTicketsTable);

    console.log('Database setup completed successfully.');
  } catch (error) {
    console.error('Error during database setup:', error);
  } finally {
    await connection.end();
  }
}

setup();
