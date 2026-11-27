const { Pool, types } = require('pg');
require('dotenv').config();

const { getPgConfig } = require('./pgConfig');

// Return TIMESTAMP (without time zone) as the original wall-clock string
// instead of converting it to a JS Date. This keeps exported times stable
// regardless of the server's timezone (important on Vercel/Neon).
types.setTypeParser(1114, (value) => value);

const pool = new Pool(getPgConfig(process.env.DATABASE_URL));

pool.on('error', (error) => {
    console.error('Unexpected PostgreSQL pool error:', error.message);
});

module.exports = pool;