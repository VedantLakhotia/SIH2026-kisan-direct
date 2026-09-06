const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', async (req, res) => {
  const { batch_id, driver_id, order_type, order_id, pickup_lat, pickup_lng, destination_lat, destination_lng, destination_address } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO deliveries (batch_id, driver_id, order_type, order_id, pickup_lat, pickup_lng, destination_lat, destination_lng, destination_address, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Pending') RETURNING *`,
      [batch_id, driver_id, order_type, order_id, pickup_lat, pickup_lng, destination_lat, destination_lng, destination_address]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/driver/:driverId', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM deliveries WHERE driver_id = $1 ORDER BY id DESC', [req.params.driverId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/active', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT d.*, 
             (SELECT row_to_json(dt) FROM delivery_tracking dt WHERE dt.delivery_id = d.id ORDER BY dt.recorded_at DESC LIMIT 1) as latest_tracking
      FROM deliveries d 
      WHERE d.status != 'Delivered'
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/location', async (req, res) => {
  const { lat, lng } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO delivery_tracking (delivery_id, lat, lng) VALUES ($1, $2, $3) RETURNING *`,
      [req.params.id, lat, lng]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/track', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM delivery_tracking WHERE delivery_id = $1 ORDER BY recorded_at ASC', [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    let query = 'UPDATE deliveries SET status = $1 WHERE id = $2 RETURNING *';
    let params = [status, req.params.id];
    
    if (status === 'Delivered') {
      query = 'UPDATE deliveries SET status = $1, actual_arrival = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
    }

    const result = await db.query(query, params);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
