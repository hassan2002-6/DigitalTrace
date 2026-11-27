const db = require('./config/db');

async function testConnection() {
    try {
        const result = await db.query('SELECT NOW() AS now');

        console.log('PostgreSQL connected successfully at', result.rows[0].now);
    } catch (error) {
        console.log('Database connection failed:', error.message);
    } finally {
        await db.end();
    }
}

testConnection();