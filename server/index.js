const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json()); // lets the server read JSON sent from React

// Test route to confirm everything is connected
app.get('/api/health', async (req, res) => {
  const result = await pool.query('SELECT NOW()');
  res.json({ status: 'connected', time: result.rows[0] });
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

app.post('/api/orders', async (req, res) => {
  const { consumer_id, pool_id, quantity_ordered, delivery_type } = req.body;

  try {
    // Step A: Insert the order
    const orderResult = await pool.query(
      `INSERT INTO orders (consumer_id, pool_id, quantity_ordered, delivery_type, status)
       VALUES (₹1,₹2, ₹3, ₹4, 'Pending') RETURNING *`,
      [consumer_id, pool_id, quantity_ordered, delivery_type]
    );

    // Step B: Update the pool's current_kg
    await pool.query(
      `UPDATE society_pools SET current_kg = current_kg + $1 WHERE id = $2`,
      [quantity_ordered, pool_id]
    );

    res.json(orderResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

app.get('/api/pools/:societyId', async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM society_pools WHERE society_id = $1`,
    [req.params.societyId]
  );
  res.json(result.rows);
});
const cron = require('node-cron');

// Runs every day at 10:00 PM
cron.schedule('0 22 * * *', async () => {
  console.log('Running cutoff check...');
  const pools = await pool.query(`SELECT * FROM society_pools WHERE status = 'Open'`);

  for (const p of pools.rows) {
    if (p.current_kg >= p.target_kg) {
      await pool.query(`UPDATE society_pools SET status = 'Locked' WHERE id = $1`, [p.id]);
      console.log(`Pool ${p.id} (${p.crop_name}) locked — target met! Notify farmer.`);
      // TODO: trigger real notification (SMS/email/push) here
    } else {
      console.log(`Pool ${p.id} (${p.crop_name}) missed target — running fallback.`);
      // Fallback example: mark as fulfilled anyway at a higher "Tier 2" price
      // await pool.query(`UPDATE society_pools SET status = 'Fulfilled' WHERE id = $1`, [p.id]);
    }
  }
});
const multer = require('multer');
const upload = multer(); // handles file uploads in memory
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/voice-listing', upload.single('audio'), async (req, res) => {
  try {
    // Step 1: Transcribe speech to text using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: req.file.buffer,
      model: 'whisper-1',
    });

    // Step 2: Ask a small language-model prompt to extract structured JSON
    const extraction = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Extract crop, quantity (number), and price (number) as JSON only from: "${transcription.text}"`
      }],
    });

    const parsed = JSON.parse(extraction.choices[0].message.content);
    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Voice parsing failed' });
  }
});