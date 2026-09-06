require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Ensure uploads directories exist
const uploadDir = path.join(__dirname, 'uploads');
const tempDir = path.join(uploadDir, 'temp');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

// Serve static uploads
app.use('/uploads', express.static(uploadDir));

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/voice', require('./routes/voice'));
app.use('/api/prices', require('./routes/prices'));
app.use('/api/pools', require('./routes/pools'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/pickups', require('./routes/pickups'));
app.use('/api/batches', require('./routes/batches'));
app.use('/api/deliveries', require('./routes/deliveries'));

const priceEngine = require('./utils/priceEngine');

// Cron job: Fetch live prices from Agmarknet every day at 6:00 AM
cron.schedule('0 6 * * *', async () => {
  console.log('Running morning cron job to fetch real Agmarknet prices...');
  await priceEngine.refreshPrices();
});

// Cron job: Check open pools past deadline
cron.schedule('0 22 * * *', async () => {
  console.log('Running nightly cron job to check pool deadlines...');
  try {
    const res = await db.query(`
      SELECT id, target_kg, current_kg 
      FROM society_pools 
      WHERE status = 'Open' AND deadline < CURRENT_DATE
    `);
    
    for (let pool of res.rows) {
      if (pool.current_kg >= pool.target_kg) {
        await db.query(`UPDATE society_pools SET status = 'Locked' WHERE id = $1`, [pool.id]);
        console.log(`Locked pool ${pool.id}`);
      } else {
        await db.query(`UPDATE society_pools SET status = 'Expired' WHERE id = $1`, [pool.id]);
        console.log(`Expired pool ${pool.id}`);
      }
    }
  } catch (err) {
    console.error('Error in cron job:', err);
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});