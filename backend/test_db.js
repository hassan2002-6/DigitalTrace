const db = require('./config/db');

async function testConnection() {
    try {
        const connection = await db.getConnection();

        console.log('MySQL database connected successfully!');

        connection.release();
    } catch (error) {
        console.log('Database connection failed:', error.message);
    } finally {
        await db.end();
    }
}

testConnection();