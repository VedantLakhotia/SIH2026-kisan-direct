const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/direct', async (req, res) => {
  const { consumer_id, listing_id, quantity_kg, delivery_type } = req.body;
  try {
    await db.query('BEGIN');
    const listingRes = await db.query('SELECT price_per_kg FROM listings WHERE id = $1', [listing_id]);
    const listing = listingRes.rows[0];
    const total_price = parseFloat(listing.price_per_kg) * parseFloat(quantity_kg);

    const result = await db.query(
      `INSERT INTO direct_orders (consumer_id, listing_id, quantity_kg, total_price, delivery_type, status)
       VALUES ($1, $2, $3, $4, $5, 'Pending') RETURNING *`,
      [consumer_id, listing_id, quantity_kg, total_price, delivery_type]
    );

    await db.query('UPDATE listings SET quantity_kg = quantity_kg - $1 WHERE id = $2', [quantity_kg, listing_id]);
    await db.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

router.get('/consumer/:consumerId', async (req, res) => {
  try {
    const directOrders = await db.query(
      `SELECT do.*, l.crop_name, 'direct' as order_category 
       FROM direct_orders do 
       JOIN listings l ON do.listing_id = l.id 
       WHERE do.consumer_id = $1`,
      [req.params.consumerId]
    );
    const poolOrders = await db.query(
      `SELECT po.*, sp.crop_name, 'pool' as order_category 
       FROM pool_orders po 
       JOIN society_pools sp ON po.pool_id = sp.id 
       WHERE po.consumer_id = $1`,
      [req.params.consumerId]
    );
    res.json([...directOrders.rows, ...poolOrders.rows]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  // Needs to handle either order type, assumes caller knows or we check direct first
  try {
    let order = await db.query('SELECT * FROM direct_orders WHERE id = $1', [req.params.id]);
    if (order.rows.length === 0) {
      order = await db.query('SELECT * FROM pool_orders WHERE id = $1', [req.params.id]);
    }
    res.json(order.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
