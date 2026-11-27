require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const multer = require('multer');
const cors = require('cors');

const categoryRoutes = require('./routes/categoryRoutes');
const userRoutes = require('./routes/userRoutes');
const historyRoutes = require('./routes/historyRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const db = require('./config/db');

const app = express();

// Allow requests from the React frontend. CLIENT_ORIGIN accepts a
// comma-separated list so localhost and deployed URLs can coexist.
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: allowedOrigins
}));

// Security headers
app.use(helmet());

// Parse JSON requests with a 10 KB limit
app.use(express.json({ limit: '10kb' }));

app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/', (req, res) => {
    res.send('DigitalTrace API is running!');
});

app.get('/api/health', async (req, res) => {
    try {
        await db.query('SELECT 1');

        res.json({
            status: 'success',
            message: 'Backend server is working',
            database: 'connected'
        });
    } catch (error) {
        console.error('Health check database error:', error.message);

        res.status(503).json({
            status: 'error',
            message: 'Backend is running but the database is unavailable',
            database: 'unavailable'
        });
    }
});

// Unknown API routes return JSON instead of the default HTML page
app.use((req, res) => {
    res.status(404).json({
        message: 'API route not found'
    });
});

// Centralized error handler
app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    if (error.type === 'entity.too.large') {
        return res.status(413).json({
            message: 'Request body exceeds the 10 KB limit'
        });
    }

    if (error instanceof multer.MulterError) {
        const statusCode =
            error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;

        return res.status(statusCode).json({
            message: error.code === 'LIMIT_FILE_SIZE'
                ? 'File size exceeds the 5 MB limit'
                : 'File upload rejected'
        });
    }

    if (error.message === 'Only valid CSV files are allowed') {
        return res.status(400).json({
            message: error.message
        });
    }

    console.error('Unhandled server error:', error);

    res.status(500).json({
        message: 'An unexpected server error occurred'
    });
});

module.exports = app;
