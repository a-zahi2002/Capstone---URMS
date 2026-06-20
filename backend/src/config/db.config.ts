import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'urms_db_new',
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
};

// Create a connection pool to handle multiple concurrent connections
export const pool = mysql.createPool(dbConfig);

// To use promises for async/await pattern
export const promisePool = pool.promise();

// Event listeners for the pool to monitor health
pool.on('connection', (connection) => {
    // console.log('New connection established in pool');
});

pool.on('acquire', (connection) => {
    // console.log('Connection %d acquired', connection.threadId);
});

pool.on('enqueue', () => {
    console.warn('Waiting for available connection slot...');
});

pool.on('release', (connection) => {
    // console.log('Connection %d released', connection.threadId);
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database pool error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('⚠️ Database connection was closed. Reconnecting...');
    } else if (err.code === 'ER_CON_COUNT_ERROR') {
        console.error('❌ Database has too many connections.');
    } else if (err.code === 'ECONNREFUSED') {
        console.error('❌ Database connection was refused.');
    }
});

/**
 * Utility to check database connection health
 */
export async function checkConnection(): Promise<boolean> {
    try {
        const connection = await promisePool.getConnection();
        connection.release();
        return true;
    } catch (error) {
        return false;
    }
}
