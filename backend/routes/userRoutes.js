
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const loginLimiter = require('../middleware/loginLimiter');

// Register a new user
router.post('/register', async (req, res) => {
    try {
        let { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        if (
            typeof name !== 'string' ||
            typeof email !== 'string' ||
            typeof password !== 'string'
        ) {
            return res.status(400).json({
                message: 'Invalid input types'
            });
        }

        name = name.trim();
        email = email.trim().toLowerCase();

        if (!name || name.length > 100) {
            return res.status(400).json({
                message: 'Name must be between 1 and 100 characters'
            });
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email) || email.length > 150) {
            return res.status(400).json({
                message: 'Please enter a valid email address'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: 'Password must contain at least 8 characters'
            });
        }

        if (!/[A-Z]/.test(password)) {
            return res.status(400).json({
                message: 'Password must contain at least one uppercase letter'
            });
        }

        if (!/[a-z]/.test(password)) {
            return res.status(400).json({
                message: 'Password must contain at least one lowercase letter'
            });
        }

        if (!/[0-9]/.test(password)) {
            return res.status(400).json({
                message: 'Password must contain at least one number'
            });
        }

        const [existingUsers] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: 'Email already registered'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        res.status(201).json({
            message: 'User registered successfully'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Error registering user'
        });
    }
});

// User login with rate limiting
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [users] = await db.query(
            'SELECT id, name, email, password FROM users WHERE email = ?',
            [normalizedEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Login successful',
            token: token
        });

    } catch (error) {
        res.status(500).json({
            message: 'Error logging in'
        });
    }
});

// Get logged-in user profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, name, email, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.json(users[0]);

    } catch (error) {
        res.status(500).json({
            message: 'Error fetching profile'
        });
    }
});

module.exports = router;
