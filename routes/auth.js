const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

router.post('/register', async (req, res) => {
    const { first_name, last_name, email, password, phone, date_of_birth, address, emergency_contact, health_fund } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (first_name, last_name, email, password_hash, phone, date_of_birth, address, emergency_contact, health_fund, role_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1) RETURNING *`,
            [first_name, last_name, email, hashedPassword, phone, date_of_birth, address, emergency_contact, health_fund]
        );
        res.json({ message: 'User registered successfully', user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign(
            { user_id: user.user_id, role_id: user.role_id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({ token, role_id: user.role_id, user_id: user.user_id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;