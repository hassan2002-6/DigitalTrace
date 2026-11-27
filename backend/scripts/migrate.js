/**
 * Runs the PostgreSQL schema and any migration files.
 *
 *   npm run db:migrate
 *
 * Uses DIRECT_URL when available (recommended for Neon migrations),
 * otherwise DATABASE_URL.
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const { getPgConfig, getMigrationUrl } = require('../config/pgConfig');

const projectRoot = path.resolve(__dirname, '..', '..');
const schemaFile = path.join(projectRoot, 'database', 'schema.postgres.sql');
const migrationsDir = path.join(projectRoot, 'database', 'migrations', 'postgres');

async function runSqlFile(client, filePath) {
    const sql = fs.readFileSync(filePath, 'utf8');

    if (!sql.trim()) {
        return;
    }

    await client.query(sql);
    console.log(`  applied ${path.relative(projectRoot, filePath)}`);
}

async function main() {
    const url = getMigrationUrl();

    if (!url) {
        throw new Error(
            'No database URL found. Set DATABASE_URL (and optionally DIRECT_URL) in backend/.env.'
        );
    }

    const client = new Client(getPgConfig(url, { migrate: true }));

    console.log('Connecting to PostgreSQL...');
    await client.connect();

    try {
        const { rows } = await client.query('SELECT version() AS version, current_database() AS db');
        console.log(`Connected: ${rows[0].db} (${rows[0].version.split(',')[0]})`);

        if (!fs.existsSync(schemaFile)) {
            throw new Error(`Schema file not found: ${schemaFile}`);
        }

        console.log('Applying base schema...');
        await runSqlFile(client, schemaFile);

        if (fs.existsSync(migrationsDir)) {
            const files = fs.readdirSync(migrationsDir)
                .filter((file) => file.endsWith('.sql'))
                .sort();

            for (const file of files) {
                await runSqlFile(client, path.join(migrationsDir, file));
            }
        }

        const categories = await client.query('SELECT COUNT(*)::int AS count FROM website_categories');
        console.log(`Done. Seeded categories: ${categories.rows[0].count}`);
    } finally {
        await client.end();
    }
}

main().catch((error) => {
    console.error('Migration failed:', error.message);
    process.exit(1);
});
