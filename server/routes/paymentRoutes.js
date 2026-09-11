const express = require('express');
const router = express.Router();
const { createOrder, verifyEscrow } = require('../controllers/paymentController');

router.post('/create-order', createOrder);
router.post('/verify-escrow', verifyEscrow);

module.exports = router;
