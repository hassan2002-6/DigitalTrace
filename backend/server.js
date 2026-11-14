
const express = require('express');

const categoryRoutes = require('./routes/categoryRoutes');
const userRoutes = require('./routes/userRoutes');
const historyRoutes = require('./routes/historyRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

const PORT = 5000;

app.use(express.json());

app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/', (req, res) => {
    res.send('Personal Digital Footprint Dashboard API is running!');
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'Backend server is working'
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
