// ===== DATABASE.JS - MySQL connection configuration =====

const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool for better performance
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'secureshare_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Promisify for async/await usage
const promisePool = pool.promise();

// Test database connection
async function testConnection() {
    try {
        const [rows] = await promisePool.query('SELECT 1 + 1 AS result');
        console.log('✅ Database connected successfully');
        console.log('   Test query result:', rows[0].result);
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

module.exports = {
    pool: promisePool,
    testConnection
};
