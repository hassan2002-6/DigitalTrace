
const express = require('express');
const router = express.Router();
const csv = require('csv-parser');
const { Readable } = require('stream');

const db = require('../config/db');
const upload = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const getDateFilter = require('../utils/dateFilter');
const getWebsiteCategory = require('../services/categoryService');

// Get browser history of the logged-in user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { condition, values } = getDateFilter(req.query);

        const [history] = await db.query(
            `SELECT
                bh.id,
                bh.website_url,
                bh.page_title,
                bh.visit_time,
                wc.category_name
            FROM browser_history bh
            LEFT JOIN website_categories wc
                ON bh.category_id = wc.id
            INNER JOIN uploaded_files uf
                ON bh.upload_id = uf.id
            WHERE uf.user_id = ? ${condition}
            ORDER BY bh.visit_time DESC, bh.id DESC`,
            [req.user.id, ...values]
        );

        res.json(history);

    } catch (error) {
        res.status(400).json({
            message: error.message || 'Error fetching browser history'
        });
    }
});

// Get uploaded files of the logged-in user
router.get('/uploads', authMiddleware, async (req, res) => {
    try {
        const [files] = await db.query(
            `SELECT id, file_name, file_type, upload_date, status
             FROM uploaded_files
             WHERE user_id = ?
             ORDER BY upload_date DESC`,
            [req.user.id]
        );

        res.json(files);

    } catch (error) {
        res.status(500).json({
            message: 'Error fetching uploaded files'
        });
    }
});

// Delete an uploaded file and its browsing records
router.delete('/uploads/:id', authMiddleware, async (req, res) => {
    const uploadId = Number(req.params.id);

    if (!Number.isInteger(uploadId) || uploadId <= 0) {
        return res.status(400).json({
            message: 'Invalid file ID'
        });
    }

    let connection;

    try {
        connection = await db.getConnection();

        await connection.beginTransaction();

        // Check whether the file belongs to the logged-in user
        const [files] = await connection.query(
            `SELECT id
             FROM uploaded_files
             WHERE id = ? AND user_id = ?
             FOR UPDATE`,
            [uploadId, req.user.id]
        );

        if (files.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: 'Uploaded file not found'
            });
        }

        // Delete browsing records connected to this file
        await connection.query(
            'DELETE FROM browser_history WHERE upload_id = ?',
            [uploadId]
        );

        // Delete the uploaded file record
        await connection.query(
            'DELETE FROM uploaded_files WHERE id = ?',
            [uploadId]
        );

        await connection.commit();

        res.json({
            message: 'Uploaded file and its browsing history deleted successfully'
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        res.status(500).json({
            message: 'Error deleting uploaded file'
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Upload browser history CSV
router.post(
    '/upload',
    authMiddleware,
    upload.single('file'),
    async (req, res) => {
        if (!req.file) {
            return res.status(400).json({
                message: 'Please select a CSV file'
            });
        }

        try {
            const records = [];

            await new Promise((resolve, reject) => {
                Readable.from([req.file.buffer])
                    .pipe(csv())
                    .on('data', (row) => {
                        records.push(row);
                    })
                    .on('end', resolve)
                    .on('error', reject);
            });

            if (records.length === 0) {
                return res.status(400).json({
                    message: 'CSV file is empty'
                });
            }

            const history = [];

            for (const row of records) {
                const url = row.url?.trim();
                const title = row.title?.trim() || null;
                const visitTime = row.time?.trim();

                if (!url || !visitTime) {
                    return res.status(400).json({
                        message: 'CSV contains missing URL or time values'
                    });
                }

                try {
                    const parsedUrl = new URL(url);

                    if (
                        parsedUrl.protocol !== 'http:' &&
                        parsedUrl.protocol !== 'https:'
                    ) {
                        throw new Error('Invalid URL');
                    }
                } catch (error) {
                    return res.status(400).json({
                        message: 'CSV contains an invalid website URL'
                    });
                }

                if (
                    !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(visitTime) ||
                    Number.isNaN(Date.parse(visitTime))
                ) {
                    return res.status(400).json({
                        message: 'CSV contains an invalid date or time'
                    });
                }

                history.push({
                    url,
                    title,
                    visitTime
                });
            }

            const connection = await db.getConnection();

            try {
                await connection.beginTransaction();

                // Get available website categories
                const [categories] = await connection.query(
                    'SELECT id, category_name FROM website_categories'
                );

                const categoryMap = new Map();

                for (const category of categories) {
                    categoryMap.set(
                        category.category_name,
                        category.id
                    );
                }

                // Save uploaded file information
                const [fileResult] = await connection.query(
                    `INSERT INTO uploaded_files
                    (user_id, file_name, file_type, status)
                    VALUES (?, ?, ?, ?)`,
                    [
                        req.user.id,
                        req.file.originalname,
                        'csv',
                        'Completed'
                    ]
                );

                const uploadId = fileResult.insertId;

                // Save browsing records with automatic categories
                for (const record of history) {
                    const categoryName = getWebsiteCategory(record.url);

                    const categoryId = categoryMap.get(categoryName) || null;

                    await connection.query(
                        `INSERT INTO browser_history
                        (category_id, website_url, page_title, visit_time, upload_id)
                        VALUES (?, ?, ?, ?, ?)`,
                        [
                            categoryId,
                            record.url,
                            record.title,
                            record.visitTime,
                            uploadId
                        ]
                    );
                }

                await connection.commit();

                res.status(201).json({
                    message: 'Browser history uploaded successfully',
                    file_id: uploadId,
                    total_records: history.length
                });

            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }

        } catch (error) {
            res.status(500).json({
                message: 'Error uploading browser history'
            });
        }
    }
);

module.exports = router;
