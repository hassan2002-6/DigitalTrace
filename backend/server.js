
const express = require('express');

const app = express();

const PORT = 5000;

app.use(express.json());

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
