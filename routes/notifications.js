const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Get all notifications for logged in user
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM notifications 
            WHERE user_id = $1 
            ORDER BY sent_at DESC`,
            [req.user.user_id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create notification
router.post('/', verifyToken, async (req, res) => {
    const { user_id, appointment_id, message, notification_type } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO notifications (user_id, appointment_id, message, notification_type)
            VALUES ($1, $2, $3, $4) RETURNING *`,
            [user_id, appointment_id, message, notification_type]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark notification as read
router.put('/:id/read', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE notifications SET is_read = true
            WHERE notification_id = $1 AND user_id = $2 RETURNING *`,
            [req.params.id, req.user.user_id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Notification not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark all notifications as read
router.put('/read/all', verifyToken, async (req, res) => {
    try {
        await pool.query(
            `UPDATE notifications SET is_read = true WHERE user_id = $1`,
            [req.user.user_id]
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;