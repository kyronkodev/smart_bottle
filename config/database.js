const mysql = require('mysql2/promise');
const loadEnv = require('./env');

// 환경변수 로드
loadEnv();

// MySQL pool configuration
const mysqlConfig = {
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE_DATABASE,
    // Connection pool settings
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

// Create MySQL pool
const mysqlPool = mysql.createPool(mysqlConfig);

// Test connection
mysqlPool.getConnection()
    .then(connection => {
        console.log('MySQL database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to MySQL database:', err);
    });

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    try {
        await mysqlPool.end();
        console.log('MySQL pool has ended');
        process.exit(0);
    } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
    }
});

module.exports = mysqlPool;
