const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', async (req, res) => {
  const { farmer_id, listing_id, quantity_kg, preferred_date, preferred_time, lat, lng, address, notes } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO pickup_requests (farmer_id, listing_id, quantity_kg, preferred_date, preferred_time, lat, lng, address, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending', $9) RETURNING *`,
      [farmer_id, listing_id, quantity_kg, preferred_date, preferred_time, lat, lng, address, notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/farmer/:farmerId', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, l.crop_name 
      FROM pickup_requests p 
      LEFT JOIN listings l ON p.listing_id = l.id 
      WHERE p.farmer_id = $1 
      ORDER BY p.id DESC
    `, [req.params.farmerId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE pickup_requests SET status = $1 WHERE id = $2 RETURNING *',
      [req.body.status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
