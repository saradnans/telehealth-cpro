const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.post('/', verifyToken, verifyRole([1]), async (req, res) => {
    const { provider_id, appointment_datetime, reason, notes } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO appointments (patient_id, provider_id, appointment_datetime, reason, notes)
            VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [req.user.user_id, provider_id, appointment_datetime, reason, notes]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/my', verifyToken, verifyRole([1]), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT a.*, u.first_name, u.last_name, p.specialisation
            FROM appointments a
            JOIN users u ON a.provider_id = u.user_id
            LEFT JOIN provider_profiles p ON u.user_id = p.provider_id
            WHERE a.patient_id = $1
            ORDER BY a.appointment_datetime DESC`,
            [req.user.user_id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/provider', verifyToken, verifyRole([2]), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT a.*, u.first_name, u.last_name
            FROM appointments a
            JOIN users u ON a.patient_id = u.user_id
            WHERE a.provider_id = $1
            ORDER BY a.appointment_datetime DESC`,
            [req.user.user_id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id/cancel', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE appointments SET status = 'Cancelled'
            WHERE appointment_id = $1 RETURNING *`,
            [req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id/confirm', verifyToken, verifyRole([2]), async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE appointments SET status = 'Confirmed'
            WHERE appointment_id = $1 RETURNING *`,
            [req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id/reschedule', verifyToken, verifyRole([1]), async (req, res) => {
    const { appointment_datetime } = req.body;
    try {
        const result = await pool.query(
            `UPDATE appointments SET appointment_datetime = $1, status = 'Pending'
            WHERE appointment_id = $2 AND patient_id = $3 RETURNING *`,
            [appointment_datetime, req.params.id, req.user.user_id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;