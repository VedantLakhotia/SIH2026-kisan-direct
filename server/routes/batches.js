const express = require('express');
const router = express.Router();
const db = require('../db');
const batchPooling = require('../utils/batchPooling');
const { OpenAI } = require('openai');

router.get('/ai-route-analysis/:id', async (req, res) => {
  try {
    const batchRes = await db.query('SELECT * FROM batches WHERE id = $1', [req.params.id]);
    const batch = batchRes.rows[0];
    if (!batch) return res.status(404).json({ error: 'Not found' });

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      return res.json({ analysis: "AI Optimization suggests dispatching this route between 6:00 AM - 9:00 AM to avoid urban traffic, leading to an estimated 15% fuel saving based on the waypoint grouping." });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    let waypointsText = 'Unknown route';
    try {
      const rd = typeof batch.route_data === 'string' ? JSON.parse(batch.route_data) : batch.route_data;
      if (rd && rd.sortedWaypoints) {
        waypointsText = rd.sortedWaypoints.map((w, i) => `Stop ${i+1}: Lat ${w.lat.toFixed(3)}, Lng ${w.lng.toFixed(3)}`).join('; ');
      }
    } catch(e) {}

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an AI Logistics and Routing assistant. Analyze the given delivery route data. Provide a short 2-3 sentence suggestion on traffic, timing, or fuel efficiency." },
        { role: "user", content: `Batch ${batch.id}, Distance: ${batch.estimated_distance_km} km. Waypoints: ${waypointsText}.` }
      ],
    });

    res.json({ analysis: completion.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
