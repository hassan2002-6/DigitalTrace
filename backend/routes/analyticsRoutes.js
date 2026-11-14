
const express = require('express');
const router = express.Router();

const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const getDateFilter = require('../utils/dateFilter');

// Get dashboard summary
router.get('/summary', authMiddleware, async (req, res) => {
    try {
        const { condition, values } = getDateFilter(req.query);
        const params = [req.user.id, ...values];

        const [visits] = await db.query(
            `SELECT COUNT(*) AS total_visits
             FROM browser_history bh
             INNER JOIN uploaded_files uf
             ON bh.upload_id = uf.id
             WHERE uf.user_id = ? ${condition}`,
            params
        );

        const [websites] = await db.query(
            `SELECT COUNT(DISTINCT bh.website_url) AS unique_websites
             FROM browser_history bh
             INNER JOIN uploaded_files uf
             ON bh.upload_id = uf.id
             WHERE uf.user_id = ? ${condition}`,
            params
        );

        const [files] = await db.query(
            `SELECT COUNT(*) AS total_files
             FROM uploaded_files
             WHERE user_id = ?`,
            [req.user.id]
        );

        const [popular] = await db.query(
            `SELECT
                bh.website_url,
                COUNT(*) AS total_visits
             FROM browser_history bh
             INNER JOIN uploaded_files uf
             ON bh.upload_id = uf.id
             WHERE uf.user_id = ? ${condition}
             GROUP BY bh.website_url
             ORDER BY total_visits DESC, bh.website_url ASC
             LIMIT 1`,
            params
        );

        res.json({
            total_visits: visits[0].total_visits,
            unique_websites: websites[0].unique_websites,
            total_files: files[0].total_files,
            most_visited_website: popular.length > 0
                ? popular[0]
                : null
        });

    } catch (error) {
        res.status(400).json({
            message: error.message || 'Error fetching dashboard summary'
        });
    }
});

// Get visits by website category
router.get('/categories', authMiddleware, async (req, res) => {
    try {
        const { condition, values } = getDateFilter(req.query);

        const [categories] = await db.query(
            `SELECT
                wc.category_name,
                COUNT(bh.id) AS total_visits
             FROM browser_history bh
             INNER JOIN uploaded_files uf
                ON bh.upload_id = uf.id
             LEFT JOIN website_categories wc
                ON bh.category_id = wc.id
             WHERE uf.user_id = ? ${condition}
             GROUP BY wc.category_name
             ORDER BY total_visits DESC`,
            [req.user.id, ...values]
        );

        res.json(categories);

    } catch (error) {
        res.status(400).json({
            message: error.message || 'Error fetching category analytics'
        });
    }
});

// Get most visited websites
router.get('/websites', authMiddleware, async (req, res) => {
    try {
        const { condition, values } = getDateFilter(req.query);

        const [websites] = await db.query(
            `SELECT
                bh.website_url,
                COUNT(*) AS total_visits
             FROM browser_history bh
             INNER JOIN uploaded_files uf
                ON bh.upload_id = uf.id
             WHERE uf.user_id = ? ${condition}
             GROUP BY bh.website_url
             ORDER BY total_visits DESC, bh.website_url ASC`,
            [req.user.id, ...values]
        );

        res.json(websites);

    } catch (error) {
        res.status(400).json({
            message: error.message || 'Error fetching website analytics'
        });
    }
});

// Get daily browsing activity
router.get('/activity', authMiddleware, async (req, res) => {
    try {
        const { condition, values } = getDateFilter(req.query);

        const [activity] = await db.query(
            `SELECT
                DATE_FORMAT(bh.visit_time, '%Y-%m-%d') AS activity_date,
                COUNT(*) AS total_visits
             FROM browser_history bh
             INNER JOIN uploaded_files uf
                ON bh.upload_id = uf.id
             WHERE uf.user_id = ? ${condition}
             GROUP BY DATE_FORMAT(bh.visit_time, '%Y-%m-%d')
             ORDER BY activity_date ASC`,
            [req.user.id, ...values]
        );

        res.json(activity);

    } catch (error) {
        res.status(400).json({
            message: error.message || 'Error fetching browsing activity'
        });
    }
});

// Get hourly browsing activity
router.get('/hourly', authMiddleware, async (req, res) => {
    try {
        const { condition, values } = getDateFilter(req.query);

        const [activity] = await db.query(
            `SELECT
                HOUR(bh.visit_time) AS activity_hour,
                COUNT(*) AS total_visits
             FROM browser_history bh
             INNER JOIN uploaded_files uf
                ON bh.upload_id = uf.id
             WHERE uf.user_id = ? ${condition}
             GROUP BY HOUR(bh.visit_time)
             ORDER BY activity_hour ASC`,
            [req.user.id, ...values]
        );

        res.json(activity);

    } catch (error) {
        res.status(400).json({
            message: error.message || 'Error fetching hourly activity'
        });
    }
});

module.exports = router;
