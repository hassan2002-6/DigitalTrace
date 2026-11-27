const express = require('express');
const router = express.Router();

const db = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, category_name FROM website_categories ORDER BY id'
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Categories error:', error.message);

        res.status(500).json({
            message: 'Error fetching categories'
        });
    }
});

module.exports = router;