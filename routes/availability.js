const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.post('/', verifyToken, verifyRole([2]), async (req, res) => {
    const { slot_start, slot_end } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO availability (provider_id, slot_start, slot_end)
            VALUES ($1, $2, $3) RETURNING *`,
            [req.user.user_id, slot_start, slot_end]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:provider_id', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM availability
            WHERE provider_id = $1 AND is_booked = false
            AND slot_start > NOW()
            ORDER BY slot_start ASC`,
            [req.params.provider_id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id/book', verifyToken, verifyRole([1]), async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE availability SET is_booked = true
            WHERE availability_id = $1 RETURNING *`,
            [req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;