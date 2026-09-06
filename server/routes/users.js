const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/login', async (req, res) => {
  const { name, role } = req.body;
  try {
    let result = await db.query('SELECT * FROM users WHERE name = $1 AND role = $2', [name, role]);
    if (result.rows.length === 0) {
      result = await db.query(
        'INSERT INTO users (name, role) VALUES ($1, $2) RETURNING *',
        [name, role]
      );
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/notifications/:userId', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM notifications WHERE user_id = $1 AND read = false ORDER BY id DESC', [req.params.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/notifications/:id/read', async (req, res) => {
  try {
    await db.query('UPDATE notifications SET read = true WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
