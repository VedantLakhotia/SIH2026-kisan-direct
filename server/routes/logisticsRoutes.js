const express = require('express');
const router = express.Router();
const { verifyPickup, completeDelivery } = require('../controllers/logisticsController');

router.post('/verify-pickup', verifyPickup);
router.post('/complete-delivery', completeDelivery);

module.exports = router;
