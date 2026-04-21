const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/profile', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT user_id, first_name, last_name, email, phone, 
            date_of_birth, address, emergency_contact, health_fund, 
            account_status, created_at
            FROM users WHERE user_id = $1`,
            [req.user.user_id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/profile', verifyToken, async (req, res) => {
    const { first_name, last_name, phone, address, emergency_contact, health_fund } = req.body;
    try {
        const result = await pool.query(
            `UPDATE users SET first_name = $1, last_name = $2, phone = $3, 
            address = $4, emergency_contact = $5, health_fund = $6
            WHERE user_id = $7 
            RETURNING user_id, first_name, last_name, email, phone, 
            date_of_birth, address, emergency_contact, health_fund, account_status`,
            [first_name, last_name, phone, address, emergency_contact, health_fund, req.user.user_id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/', verifyToken, verifyRole([3]), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.user_id, u.first_name, u.last_name, u.email, 
            u.phone, u.account_status, r.role_name
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            ORDER BY u.user_id ASC`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/deactivate', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE users SET account_status = 'Inactive'
            WHERE user_id = $1 RETURNING user_id, account_status`,
            [req.user.user_id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;