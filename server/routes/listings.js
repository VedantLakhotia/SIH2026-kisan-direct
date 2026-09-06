const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Handle both JSON and multipart/form-data (photo upload) requests
const handleCreateListing = async (req, res) => {
  const { farmer_id, crop_name, quantity_kg, price_per_kg, grade, harvest_date, organic_cert, description, lat, lng } = req.body;
  const photo_url = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const result = await db.query(
      `INSERT INTO listings (farmer_id, crop_name, quantity_kg, price_per_kg, grade, harvest_date, photo_url, organic_cert, description, status, lat, lng)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Available', $10, $11) RETURNING *`,
      [farmer_id, crop_name, quantity_kg, price_per_kg, grade, harvest_date, photo_url, organic_cert, description, lat, lng]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.post('/', (req, res, next) => {
  // If the request has multipart content (file upload), use multer; otherwise skip it
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    upload.single('photo')(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      handleCreateListing(req, res);
    });
  } else {
    handleCreateListing(req, res);
  }
});

router.get('/', async (req, res) => {
  let query = 'SELECT * FROM listings WHERE status = $1';
  const params = ['Available'];
  let paramIndex = 2;

  if (req.query.crop) { query += ` AND crop_name ILIKE $${paramIndex++}`; params.push(`%${req.query.crop}%`); }
  if (req.query.grade) { query += ` AND grade = $${paramIndex++}`; params.push(req.query.grade); }
  if (req.query.organic) { query += ` AND organic_cert = $${paramIndex++}`; params.push(req.query.organic === 'true'); }
  if (req.query.minPrice) { query += ` AND price_per_kg >= $${paramIndex++}`; params.push(req.query.minPrice); }
  if (req.query.maxPrice) { query += ` AND price_per_kg <= $${paramIndex++}`; params.push(req.query.maxPrice); }
  if (req.query.search) {
    query += ` AND (crop_name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
    params.push(`%${req.query.search}%`);
    paramIndex++;
  }

  query += ' ORDER BY id DESC'; // No created_at in schema, ordering by ID roughly equivalent to DESC creation

  try {
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/farmer/:farmerId', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM listings WHERE farmer_id = $1 ORDER BY id DESC', [req.params.farmerId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM listings WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { crop_name, quantity_kg, price_per_kg, description } = req.body;
  try {
    const result = await db.query(
      'UPDATE listings SET crop_name = $1, quantity_kg = $2, price_per_kg = $3, description = $4 WHERE id = $5 RETURNING *',
      [crop_name, quantity_kg, price_per_kg, description, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query("UPDATE listings SET status = 'Expired' WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
