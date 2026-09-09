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
  let query = 'SELECT l.*, u.name as farmer_name FROM listings l LEFT JOIN users u ON l.farmer_id = u.id WHERE l.status = $1';
  const params = ['Available'];
  let paramIndex = 2;

  if (req.query.crop) { query += ` AND l.crop_name ILIKE $${paramIndex++}`; params.push(`%${req.query.crop}%`); }
  if (req.query.grade) { query += ` AND l.grade = $${paramIndex++}`; params.push(req.query.grade); }
  if (req.query.organic) { query += ` AND l.organic_cert = $${paramIndex++}`; params.push(req.query.organic === 'true'); }
  if (req.query.minPrice) { query += ` AND l.price_per_kg >= $${paramIndex++}`; params.push(req.query.minPrice); }
  if (req.query.maxPrice) { query += ` AND l.price_per_kg <= $${paramIndex++}`; params.push(req.query.maxPrice); }
  if (req.query.search) {
    query += ` AND (l.crop_name ILIKE $${paramIndex} OR l.description ILIKE $${paramIndex})`;
    params.push(`%${req.query.search}%`);
    paramIndex++;
  }

  query += ' ORDER BY l.id DESC';

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
    if (result.rows.length === 0) return res.status(404).json({ error: 'Listing not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { crop_name, quantity_kg, price_per_kg, description, farmer_id } = req.body;
  try {
    // Check existence
    const check = await db.query('SELECT * FROM listings WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Listing not found' });
    // Check authorization
    if (farmer_id && check.rows[0].farmer_id !== parseInt(farmer_id)) {
      return res.status(403).json({ error: 'Not authorized to edit this listing' });
    }
    // Only allow editing Available listings
    if (check.rows[0].status !== 'Available') {
      return res.status(400).json({ error: 'Cannot edit a listing that is not Available' });
    }
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
    const { farmer_id } = req.body; // frontend must send farmer_id
    const check = await db.query('SELECT * FROM listings WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Listing not found' });
    if (farmer_id && check.rows[0].farmer_id !== parseInt(farmer_id)) {
      return res.status(403).json({ error: 'Not authorized to delete this listing' });
    }
    const result = await db.query(
      "DELETE FROM listings WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    res.json(result.rows[0]); // Return the deleted listing so frontend can update state
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
