const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const loginLimiter = require('../middleware/loginLimiter');

function validatePassword(password) {
    if (password.length < 8) {
        return 'Password must contain at least 8 characters';
    }

    if (!/[A-Z]/.test(password)) {
        return 'Password must contain at least one uppercase letter';
    }

    if (!/[a-z]/.test(password)) {
        return 'Password must contain at least one lowercase letter';
    }

    if (!/[0-9]/.test(password)) {
        return 'Password must contain at least one number';
    }

    return null;
}

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

        const passwordError = validatePassword(password);

        if (passwordError) {
            return res.status(400).json({
                message: passwordError
            });
        }

        const existing = await db.query(
            'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
            [email]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({
                message: 'Email already registered'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
            [name, email, hashedPassword]
        );

        res.status(201).json({
            message: 'User registered successfully'
        });

    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({
                message: 'Email already registered'
            });
        }

        console.error('Register error:', error.message);

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

        const result = await db.query(
            'SELECT id, name, email, password FROM users WHERE LOWER(email) = LOWER($1)',
            [normalizedEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const user = result.rows[0];

        const isMatch = await bcrypt.compare(password, user.password);

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
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error.message);

        res.status(500).json({
            message: 'Error logging in'
        });
    }
});

// Get logged-in user profile
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, name, email, created_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Profile error:', error.message);

        res.status(500).json({
            message: 'Error fetching profile'
        });
    }
});

// Update display name
router.patch('/profile', authMiddleware, async (req, res) => {
    try {
        const { name } = req.body;

        if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
            return res.status(400).json({
                message: 'Name must be between 1 and 100 characters'
            });
        }

        const result = await db.query(
            `UPDATE users
             SET name = $1
             WHERE id = $2
             RETURNING id, name, email, created_at`,
            [name.trim(), req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.json({
            message: 'Profile updated successfully',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Profile update error:', error.message);

        res.status(500).json({
            message: 'Error updating profile'
        });
    }
});

module.exports = router;
