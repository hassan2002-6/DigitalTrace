/**
 * Shared PostgreSQL connection settings for the API pool and the
 * migration script.
 *
 * DATABASE_URL  - pooled Neon connection string (used by the API)
 * DIRECT_URL    - direct connection string (used by migrations)
 * PGSSL         - set to "disable" for a local PostgreSQL without TLS
 */
function getPgConfig(connectionString, options = {}) {
    if (!connectionString) {
        throw new Error(
            'DATABASE_URL is not set. Copy backend/.env.example to backend/.env ' +
            'and add your Neon connection string.'
        );
    }

    const ssl = process.env.PGSSL === 'disable'
        ? false
        : { rejectUnauthorized: false };

    return {
        connectionString,
        ssl,
        max: Number(process.env.PGPOOL_MAX) || (options.migrate ? 1 : 5),
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000
    };
}

function getMigrationUrl() {
    return process.env.DIRECT_URL || process.env.DATABASE_URL;
}

module.exports = { getPgConfig, getMigrationUrl };
