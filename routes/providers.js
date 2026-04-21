const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, verifyRole } = require('../middleware/auth');

// Get all providers (patients can view)
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.user_id, u.first_name, u.last_name, u.email, u.phone,
            p.specialisation, p.degree, p.spoken_language, p.bio, p.sex
            FROM users u
            LEFT JOIN provider_profiles p ON u.user_id = p.provider_id
            WHERE u.role_id = 2`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single provider by id
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.user_id, u.first_name, u.last_name, u.email, u.phone,
            p.specialisation, p.degree, p.spoken_language, p.bio, p.sex
            FROM users u
            LEFT JOIN provider_profiles p ON u.user_id = p.provider_id
            WHERE u.user_id = $1 AND u.role_id = 2`,
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Provider not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create or update provider profile (provider only)
router.post('/profile', verifyToken, verifyRole([2]), async (req, res) => {
    const { specialisation, degree, sex, spoken_language, bio } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO provider_profiles (provider_id, specialisation, degree, sex, spoken_language, bio)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (provider_id) 
            DO UPDATE SET specialisation = $2, degree = $3, sex = $4, spoken_language = $5, bio = $6
            RETURNING *`,
            [req.user.user_id, specialisation, degree, sex, spoken_language, bio]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;