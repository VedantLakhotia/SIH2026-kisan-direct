const express = require('express');
const router = express.Router();
const db = require('../db');
const batchPooling = require('../utils/batchPooling');

router.post('/auto-pool', async (req, res) => {
  try {
    const batches = await batchPooling.autoPool();
    res.json(batches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT b.*, COUNT(bi.id) as item_count 
      FROM batches b 
      LEFT JOIN batch_items bi ON b.id = bi.batch_id 
      GROUP BY b.id 
      ORDER BY b.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const batchRes = await db.query('SELECT * FROM batches WHERE id = $1', [req.params.id]);
    const batch = batchRes.rows[0];
    if (!batch) return res.status(404).json({ error: 'Not found' });

    const itemsRes = await db.query(`
      SELECT bi.*, pr.quantity_kg, pr.address, u.name as farmer_name, l.crop_name
      FROM batch_items bi
      JOIN pickup_requests pr ON bi.pickup_id = pr.id
      JOIN users u ON pr.farmer_id = u.id
      JOIN listings l ON pr.listing_id = l.id
      WHERE bi.batch_id = $1
      ORDER BY bi.stop_order ASC
    `, [req.params.id]);

    res.json({ ...batch, items: itemsRes.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
