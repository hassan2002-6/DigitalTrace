const express = require('express');
const router = express.Router();

const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const { buildDateFilter } = require('../utils/dateFilterPg');

const PERIODS = new Set(['daily', 'weekly', 'monthly']);
const PERIOD_UNITS = {
    daily: 'day',
    weekly: 'week',
    monthly: 'month'
};

function getPeriod(value) {
    return PERIODS.has(value) ? value : 'daily';
}

function whereFor(req, startIndex = 1) {
    const { conditions, values } = buildDateFilter(req.query, startIndex);

    return {
        sql: conditions.length ? conditions.join(' AND ') : 'TRUE',
        values
    };
}

// Get dashboard summary
router.get('/summary', authMiddleware, async (req, res) => {
    try {
        const where = whereFor(req);

        const totalsResult = await db.query(
            `SELECT
                COALESCE(SUM(bh.visit_count), 0)::int AS total_visits,
                COUNT(DISTINCT bh.domain_id)::int AS unique_websites
             FROM browser_history bh
             WHERE ${where.sql}`,
            where.values
        );

        const filesResult = await db.query(
            'SELECT COUNT(*)::int AS total_files FROM uploaded_files'
        );

        const popularResult = await db.query(
            `SELECT
                d.hostname AS website_url,
                COALESCE(SUM(bh.visit_count), 0)::int AS total_visits
             FROM browser_history bh
             INNER JOIN domains d ON bh.domain_id = d.id
             WHERE ${where.sql}
             GROUP BY d.hostname
             ORDER BY total_visits DESC, d.hostname ASC
             LIMIT 1`,
            where.values
        );

        res.json({
            total_visits: totalsResult.rows[0].total_visits,
            unique_websites: totalsResult.rows[0].unique_websites,
            total_files: filesResult.rows[0].total_files,
            most_visited_website: popularResult.rows[0] || null
        });

    } catch (error) {
        res.status(400).json({
            message: error.message || 'Error fetching dashboard summary'
        });
    }
});

// Visits per category
router.get('/categories', authMiddleware, async (req, res) => {
    try {
        const where = whereFor(req);

        const result = await db.query(
            `SELECT
                COALESCE(wc.category_name, 'Uncategorized') AS category_name,
                COALESCE(SUM(bh.visit_count), 0)::int AS total_visits
             FROM browser_history bh
             LEFT JOIN domains d ON bh.domain_id = d.id
             LEFT JOIN website_categories wc ON d.category_id = wc.id
             WHERE ${where.sql}
             GROUP BY COALESCE(wc.category_name, 'Uncategorized')
             ORDER BY total_visits DESC, category_name ASC`,
            where.values
        );

        res.json(result.rows);

    } catch (error) {
        res.status(400).json({
            message: error.message || 'Error fetching category analytics'
        });
    }
});

// Most visited websites (domain level)
router.get('/websites', authMiddleware, async (req, res) => {
    try {
        const where = whereFor(req);

        const result = await db.query(
            `SELECT
                d.hostname AS website_url,
                COALESCE(SUM(bh.visit_count), 0)::int AS total_visits
             FROM browser_history bh
             INNER JOIN domains d ON bh.domain_id = d.id
             WHERE ${where.sql}
             GROUP BY d.hostname
             ORDER BY total_visits DESC, d.hostname ASC`,
            where.values
        );

        res.json(result.rows);

    } catch (error) {
        res.status(400).json({
            message: error.message || 'Error fetching website analytics'
        });
    }
});

// Domain breakdown with category and unique URL counts
router.get('/domains', authMiddleware, async (req, res) => {
    try {
        const where = whereFor(req);

        const result = await db.query(
            `SELECT
                d.hostname,
                COALESCE(wc.category_name, 'Uncategorized') AS category_name,
                COUNT(DISTINCT bh.website_url)::int AS unique_urls,
                COALESCE(SUM(bh.visit_count), 0)::int AS total_visits
             FROM browser_history bh
             INNER JOIN domains d ON bh.domain_id = d.id
             LEFT JOIN website_categories wc ON d.category_id = wc.id
             WHERE ${where.sql}
             GROUP BY d.hostname, wc.category_name
             ORDER BY total_visits DESC, d.hostname ASC`,
            where.values
        );

        res.json(result.rows);

    } catch (error) {
        res.status(400).json({
            message: error.message || 'Error fetching domain analytics'
        });
    }
});

// Daily, weekly or monthly activity
router.get('/activity', authMiddleware, async (req, res) => {
    try {
        const period = getPeriod(req.query.period);
        const unit = PERIOD_UNITS[period];
        const where = whereFor(req);

        const result = await db.query(
            `SELECT
                to_char(date_trunc($${where.values.length + 1}::text, bh.visit_time), 'YYYY-MM-DD') AS bucket,
                COALESCE(SUM(bh.visit_count), 0)::int AS total_visits
             FROM browser_history bh
             WHERE ${where.sql}
             GROUP BY 1
             ORDER BY 1 ASC`,
            [...where.values, unit]
        );

        res.json({
            period,
            buckets: result.rows
        });

    } catch (error) {
        res.status(400).json({
            message: error.message || 'Error fetching browsing activity'
        });
    }
});

// Visits per hour of day
router.get('/hourly', authMiddleware, async (req, res) => {
    try {
        const where = whereFor(req);

        const result = await db.query(
            `SELECT
                EXTRACT(HOUR FROM bh.visit_time)::int AS activity_hour,
                COALESCE(SUM(bh.visit_count), 0)::int AS total_visits
             FROM browser_history bh
             WHERE ${where.sql}
             GROUP BY 1
             ORDER BY 1 ASC`,
            where.values
        );

        res.json(result.rows);

    } catch (error) {
        res.status(400).json({
            message: error.message || 'Error fetching hourly activity'
        });
    }
});

// Per-hour, per-website breakdown
router.get('/hourly-websites', authMiddleware, async (req, res) => {
    try {
        const where = whereFor(req);

        const result = await db.query(
            `SELECT
                EXTRACT(HOUR FROM bh.visit_time)::int AS activity_hour,
                d.hostname AS website_url,
                COALESCE(SUM(bh.visit_count), 0)::int AS total_visits
             FROM browser_history bh
             INNER JOIN domains d ON bh.domain_id = d.id
             WHERE ${where.sql}
             GROUP BY 1, 2
             ORDER BY 1 ASC, total_visits DESC`,
            where.values
        );

        res.json(result.rows);

    } catch (error) {
        res.status(400).json({
            message: error.message || 'Error fetching hourly website analytics'
        });
    }
});

// Recent browsing activity
router.get('/recent', authMiddleware, async (req, res) => {
    try {
        const requested = Number.parseInt(req.query.limit, 10);
        const limit = Number.isInteger(requested) && requested > 0
            ? Math.min(requested, 20)
            : 5;

        const result = await db.query(
            `SELECT
                bh.id,
                bh.website_url,
                bh.page_title,
                bh.visit_time,
                bh.visit_count,
                d.hostname,
                u.name AS uploader_name,
                COALESCE(wc.category_name, 'Uncategorized') AS category_name
             FROM browser_history bh
             INNER JOIN uploaded_files uf ON bh.upload_id = uf.id
             INNER JOIN users u ON uf.user_id = u.id
             LEFT JOIN domains d ON bh.domain_id = d.id
             LEFT JOIN website_categories wc ON d.category_id = wc.id
             ORDER BY bh.visit_time DESC, bh.id DESC
             LIMIT $1`,
            [limit]
        );

        res.json(result.rows);

    } catch (error) {
        console.error('Recent activity error:', error.message);

        res.status(500).json({
            message: 'Error fetching recent activity'
        });
    }
});

module.exports = router;
