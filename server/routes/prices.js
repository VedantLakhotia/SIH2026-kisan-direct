const express = require('express');
const router = express.Router();
const priceEngine = require('../utils/priceEngine');

router.get('/:crop', async (req, res) => {
  try {
    const prices = await priceEngine.getMandiPrices(req.params.crop);
    res.json(prices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recommend/:crop', async (req, res) => {
  try {
    const grade = req.query.grade || 'B';
    const quantity = parseFloat(req.query.quantity) || 100;
    const rec = await priceEngine.getRecommendedPrice(req.params.crop, grade, quantity);
    res.json(rec);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    await priceEngine.refreshPrices();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
