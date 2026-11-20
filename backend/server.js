
const express = require('express');
const helmet = require('helmet');
const multer = require('multer');
const cors = require('cors');

const categoryRoutes = require('./routes/categoryRoutes');
const userRoutes = require('./routes/userRoutes');
const historyRoutes = require('./routes/historyRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

const PORT = 5000;

// Allow requests from the React frontend
app.use(cors({
    origin: 'http://localhost:5173'
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

app.get('/api/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'Backend server is working'
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

    res.status(500).json({
        message: 'An unexpected server error occurred'
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
