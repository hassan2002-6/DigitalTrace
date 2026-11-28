const express = require('express');
const router = express.Router();

const db = require('../config/db');
const upload = require('../middleware/uploadMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const getWebsiteCategory = require('../services/categoryService');
const { parseHistoryCsv, CsvValidationError } = require('../services/csvParser');
const { buildDateFilter } = require('../utils/dateFilterPg');

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

function toPositiveInt(value, fallback) {
    const parsed = Number.parseInt(value, 10);

    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getHostname(url) {
    try {
        return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    } catch (error) {
        return null;
    }
}

// Get shared browser history for all team members (paginated + searchable)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const page = toPositiveInt(req.query.page, 1);
        const limit = Math.min(toPositiveInt(req.query.limit, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
        const offset = (page - 1) * limit;
        const search = typeof req.query.search === 'string'
            ? req.query.search.trim().slice(0, 100)
            : '';

        const { conditions, values } = buildDateFilter(req.query, 1);
        const where = [...conditions];

        if (search) {
            const index = values.length + 1;
            where.push(
                `(bh.website_url ILIKE $${index} OR bh.page_title ILIKE $${index} OR d.hostname ILIKE $${index})`
            );
            values.push(`%${search}%`);
        }

        const whereSql = where.length ? where.join(' AND ') : 'TRUE';
        const queryValues = values;

        const countResult = await db.query(
            `SELECT COUNT(*)::int AS total
             FROM browser_history bh
             LEFT JOIN domains d ON bh.domain_id = d.id
             WHERE ${whereSql}`,
            queryValues
        );

        const total = countResult.rows[0].total;

        const historyResult = await db.query(
            `SELECT
                bh.id,
                bh.website_url,
                bh.page_title,
                bh.visit_time,
                bh.visit_count,
                d.hostname,
                u.name AS uploader_name,
                wc.category_name
             FROM browser_history bh
             INNER JOIN uploaded_files uf ON bh.upload_id = uf.id
             INNER JOIN users u ON uf.user_id = u.id
             LEFT JOIN domains d ON bh.domain_id = d.id
             LEFT JOIN website_categories wc ON d.category_id = wc.id
             WHERE ${whereSql}
             ORDER BY bh.visit_time DESC, bh.id DESC
             LIMIT $${queryValues.length + 1} OFFSET $${queryValues.length + 2}`,
            [...queryValues, limit, offset]
        );

        res.json({
            records: historyResult.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit))
            }
        });

    } catch (error) {
        res.status(400).json({
            message: error.message || 'Error fetching browser history'
        });
    }
});

// Get uploads from every team member
router.get('/uploads', authMiddleware, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT uf.id, uf.file_name, uf.file_type, uf.upload_date, uf.status,
                    uf.row_count, uf.visit_count, uf.duplicate_count,
                    u.name AS uploader_name,
                    (uf.user_id = $1) AS can_delete
             FROM uploaded_files uf
             INNER JOIN users u ON uf.user_id = u.id
             ORDER BY uf.upload_date DESC`,
            [req.user.id]
        );

        res.json(result.rows);

    } catch (error) {
        console.error('Uploads list error:', error.message);

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

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const files = await client.query(
            `SELECT id
             FROM uploaded_files
             WHERE id = $1 AND user_id = $2
             FOR UPDATE`,
            [uploadId, req.user.id]
        );

        if (files.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                message: 'Uploaded file not found'
            });
        }

        // Foreign keys cascade to browser_history.
        await client.query(
            'DELETE FROM uploaded_files WHERE id = $1',
            [uploadId]
        );

        await client.query('COMMIT');

        res.json({
            message: 'Uploaded file and its browsing history deleted successfully'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Delete upload error:', error.message);

        res.status(500).json({
            message: 'Error deleting uploaded file'
        });

    } finally {
        client.release();
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
            const { records } = await parseHistoryCsv(req.file.buffer);

            const client = await db.connect();

            try {
                await client.query('BEGIN');

                const categoriesResult = await client.query(
                    'SELECT id, category_name FROM website_categories'
                );

                const categoryMap = new Map(
                    categoriesResult.rows.map((row) => [row.category_name, row.id])
                );

                const fileResult = await client.query(
                    `INSERT INTO uploaded_files
                        (user_id, file_name, file_type, status, row_count, visit_count, duplicate_count)
                     VALUES ($1, $2, $3, $4, 0, 0, 0)
                     RETURNING id`,
                    [req.user.id, req.file.originalname, 'csv', 'Processing']
                );

                const uploadId = fileResult.rows[0].id;

                const domainCache = new Map();
                const prepared = [];

                for (const record of records) {
                    const hostname = getHostname(record.websiteUrl);
                    let domainId = null;

                    if (hostname) {
                        if (domainCache.has(hostname)) {
                            domainId = domainCache.get(hostname);
                        } else {
                            const categoryName = getWebsiteCategory(record.websiteUrl);
                            const categoryId = categoryMap.get(categoryName) || null;

                            const domainResult = await client.query(
                                `INSERT INTO domains (hostname, category_id)
                                 VALUES ($1, $2)
                                 ON CONFLICT (hostname)
                                 DO UPDATE SET category_id = COALESCE(domains.category_id, EXCLUDED.category_id)
                                 RETURNING id`,
                                [hostname, categoryId]
                            );

                            domainId = domainResult.rows[0].id;
                            domainCache.set(hostname, domainId);
                        }
                    }

                    prepared.push({
                        ...record,
                        domainId
                    });
                }

                let insertedRecords = 0;
                let insertedVisits = 0;

                const CHUNK_SIZE = 500;

                for (let start = 0; start < prepared.length; start += CHUNK_SIZE) {
                    const chunk = prepared.slice(start, start + CHUNK_SIZE);
                    const placeholders = [];
                    const values = [];

                    chunk.forEach((record, index) => {
                        const base = index * 7;
                        placeholders.push(
                            `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`
                        );
                        values.push(
                            uploadId,
                            req.user.id,
                            record.domainId,
                            record.websiteUrl,
                            record.pageTitle,
                            record.visitTime,
                            record.visitCount
                        );
                    });

                    const insertResult = await client.query(
                        `INSERT INTO browser_history
                            (upload_id, user_id, domain_id, website_url, page_title, visit_time, visit_count)
                         VALUES ${placeholders.join(', ')}
                         ON CONFLICT (user_id, website_url, visit_time) DO NOTHING
                         RETURNING visit_count`,
                        values
                    );

                    insertedRecords += insertResult.rowCount;
                    insertedVisits += insertResult.rows.reduce(
                        (sum, row) => sum + row.visit_count,
                        0
                    );
                }

                const duplicateCount = records.length - insertedRecords;
                const status = insertedRecords === 0 ? 'No new records' : 'Completed';

                await client.query(
                    `UPDATE uploaded_files
                     SET row_count = $1,
                         visit_count = $2,
                         duplicate_count = $3,
                         status = $4
                     WHERE id = $5`,
                    [records.length, insertedVisits, duplicateCount, status, uploadId]
                );

                await client.query('COMMIT');

                res.status(201).json({
                    message: insertedRecords === 0
                        ? 'All records were already imported as duplicates.'
                        : 'Browser history uploaded successfully',
                    file_id: uploadId,
                    total_records: records.length,
                    imported_records: insertedRecords,
                    duplicates: duplicateCount,
                    total_visits: insertedVisits
                });

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }

        } catch (error) {
            if (error instanceof CsvValidationError) {
                return res.status(400).json({
                    message: error.message,
                    errors: error.details
                });
            }

            console.error('Upload error:', error);

            res.status(500).json({
                message: 'Error uploading browser history'
            });
        }
    }
);

module.exports = router;
