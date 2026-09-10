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
      `SELECT do.id as order_id, do.id, do.consumer_id, do.listing_id, do.quantity_kg, do.total_price,
              do.delivery_type, do.status, do.delivery_id, do.created_at,
              l.crop_name, l.price_per_kg, 'Direct' as order_type, 'direct' as order_category 
       FROM direct_orders do 
       JOIN listings l ON do.listing_id = l.id 
       WHERE do.consumer_id = $1`,
      [req.params.consumerId]
    );
    const poolOrders = await db.query(
      `SELECT po.id as order_id, po.id, po.consumer_id, po.pool_id, po.quantity_kg,
              ROUND((po.quantity_kg * sp.price_per_kg)::numeric, 2) as total_price,
              po.delivery_type, po.status, NULL as delivery_id, po.created_at,
              sp.crop_name, sp.price_per_kg, 'Pool' as order_type, 'pool' as order_category 
       FROM pool_orders po 
       JOIN society_pools sp ON po.pool_id = sp.id 
       WHERE po.consumer_id = $1`,
      [req.params.consumerId]
    );
    const allOrders = [...directOrders.rows, ...poolOrders.rows].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    res.json(allOrders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  const { type } = req.query;
  try {
    let order = null;
    if (type?.toLowerCase() === 'pool') {
      const poolOrderRes = await db.query(
        `SELECT po.*, po.id as order_id, sp.crop_name, sp.price_per_kg,
                ROUND((po.quantity_kg * sp.price_per_kg)::numeric, 2) as total_price,
                'Pool' as order_type
         FROM pool_orders po
         JOIN society_pools sp ON po.pool_id = sp.id
         WHERE po.id = $1`,
        [req.params.id]
      );
      order = poolOrderRes.rows[0];
    } else {
      const directOrderRes = await db.query(
        `SELECT do.*, do.id as order_id, l.crop_name, l.price_per_kg, 'Direct' as order_type
         FROM direct_orders do
         JOIN listings l ON do.listing_id = l.id
         WHERE do.id = $1`,
        [req.params.id]
      );
      order = directOrderRes.rows[0];
      if (!order) {
        const poolOrderRes = await db.query(
          `SELECT po.*, po.id as order_id, sp.crop_name, sp.price_per_kg,
                  ROUND((po.quantity_kg * sp.price_per_kg)::numeric, 2) as total_price,
                  'Pool' as order_type
           FROM pool_orders po
           JOIN society_pools sp ON po.pool_id = sp.id
           WHERE po.id = $1`,
          [req.params.id]
        );
        order = poolOrderRes.rows[0];
      }
    }
    res.json(order || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
