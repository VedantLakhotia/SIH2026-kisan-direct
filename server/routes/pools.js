const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/', async (req, res) => {
  const { lead_id, society_id, crop_name, target_kg, price_per_kg, discount_percent, description, deadline } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO society_pools (lead_id, society_id, crop_name, target_kg, current_kg, price_per_kg, discount_percent, description, deadline, status)
       VALUES ($1, $2, $3, $4, 0, $5, $6, $7, $8, 'Open') RETURNING *`,
      [lead_id, society_id, crop_name, target_kg, price_per_kg, discount_percent, description, deadline]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/society/:societyId', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM society_pools WHERE society_id = $1 ORDER BY id DESC', [req.params.societyId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM society_pools WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/join', async (req, res) => {
  const { consumer_id, quantity_kg, delivery_type } = req.body;
  const poolId = req.params.id;
  try {
    await db.query('BEGIN');
    
    await db.query(
      `INSERT INTO pool_orders (consumer_id, pool_id, quantity_kg, delivery_type, status)
       VALUES ($1, $2, $3, $4, 'Pending')`,
      [consumer_id, poolId, quantity_kg, delivery_type]
    );

    const poolRes = await db.query('UPDATE society_pools SET current_kg = current_kg + $1 WHERE id = $2 RETURNING *', [quantity_kg, poolId]);
    const pool = poolRes.rows[0];

    if (pool.current_kg >= pool.target_kg && pool.status === 'Open') {
      await db.query("UPDATE society_pools SET status = 'Locked' WHERE id = $1", [poolId]);
    }

    await db.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/members', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT po.*, u.name as consumer_name, u.phone as consumer_phone, u.address as consumer_address,
              ROUND((po.quantity_kg * sp.price_per_kg)::numeric, 2) as total_price
       FROM pool_orders po 
       JOIN users u ON po.consumer_id = u.id 
       JOIN society_pools sp ON po.pool_id = sp.id
       WHERE po.pool_id = $1
       ORDER BY po.id DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/lock', async (req, res) => {
  try {
    await db.query("UPDATE society_pools SET status = 'Locked' WHERE id = $1", [req.params.id]);
    res.json({ success: true, status: 'Locked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Open', 'Locked', 'Fulfilled', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid pool status' });
  }
  try {
    const result = await db.query(
      "UPDATE society_pools SET status = $1 WHERE id = $2 RETURNING *",
      [status, req.params.id]
    );
    res.json({ success: true, pool: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/analytics/:societyId', async (req, res) => {
  try {
    const totalPoolsRes = await db.query('SELECT COUNT(*) FROM society_pools WHERE society_id = $1', [req.params.societyId]);
    const activePoolsRes = await db.query("SELECT COUNT(*) FROM society_pools WHERE society_id = $1 AND status = 'Open'", [req.params.societyId]);
    const kgRes = await db.query('SELECT SUM(current_kg) FROM society_pools WHERE society_id = $1', [req.params.societyId]);
    const avgDiscRes = await db.query('SELECT AVG(discount_percent) FROM society_pools WHERE society_id = $1', [req.params.societyId]);
    const topCropsRes = await db.query(
      `SELECT crop_name, COUNT(*) as count FROM society_pools WHERE society_id = $1 GROUP BY crop_name ORDER BY count DESC LIMIT 5`,
      [req.params.societyId]
    );

    res.json({
      total_pools: parseInt(totalPoolsRes.rows[0].count),
      active_pools: parseInt(activePoolsRes.rows[0].count),
      total_kg: parseFloat(kgRes.rows[0].sum) || 0,
      avg_discount: parseFloat(avgDiscRes.rows[0].avg) || 0,
      top_crops: topCropsRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
