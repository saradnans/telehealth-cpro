const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, verifyRole } = require('../middleware/auth');

// Get all reports (admin only)
router.get('/', verifyToken, verifyRole([3]), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT r.*, u.first_name, u.last_name
            FROM reports r
            JOIN users u ON r.generated_by = u.user_id
            ORDER BY r.generated_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generate appointments report (admin only)
router.post('/appointments', verifyToken, verifyRole([3]), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT COUNT(*) as total_appointments,
            COUNT(CASE WHEN status = 'Confirmed' THEN 1 END) as confirmed,
            COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled,
            COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending,
            COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed
            FROM appointments`
        );
        const output = JSON.stringify(result.rows[0]);
        await pool.query(
            `INSERT INTO reports (generated_by, report_type, parameters, output)
            VALUES ($1, 'Appointments', 'All appointments', $2)`,
            [req.user.user_id, output]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generate users report (admin only)
router.post('/users', verifyToken, verifyRole([3]), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT COUNT(*) as total_users,
            COUNT(CASE WHEN role_id = 1 THEN 1 END) as total_patients,
            COUNT(CASE WHEN role_id = 2 THEN 1 END) as total_providers,
            COUNT(CASE WHEN account_status = 'Active' THEN 1 END) as active_users,
            COUNT(CASE WHEN account_status = 'Inactive' THEN 1 END) as inactive_users
            FROM users`
        );
        const output = JSON.stringify(result.rows[0]);
        await pool.query(
            `INSERT INTO reports (generated_by, report_type, parameters, output)
            VALUES ($1, 'Users', 'All users', $2)`,
            [req.user.user_id, output]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Generate providers report (admin only)
router.post('/providers', verifyToken, verifyRole([3]), async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.user_id, u.first_name, u.last_name, 
            p.specialisation, p.degree,
            COUNT(a.appointment_id) as total_appointments
            FROM users u
            LEFT JOIN provider_profiles p ON u.user_id = p.provider_id
            LEFT JOIN appointments a ON u.user_id = a.provider_id
            WHERE u.role_id = 2
            GROUP BY u.user_id, u.first_name, u.last_name, p.specialisation, p.degree`
        );
        const output = JSON.stringify(result.rows);
        await pool.query(
            `INSERT INTO reports (generated_by, report_type, parameters, output)
            VALUES ($1, 'Providers', 'All providers', $2)`,
            [req.user.user_id, output]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;