const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../db');

// Fallback logic for mock payouts in hackathon environment
const ENABLE_MOCK_PAYOUTS = process.env.ENABLE_MOCK_PAYOUTS === 'true';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_fallback',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_fallback',
});

// Helper for Mock Payout
const simulatePayout = async (amount, type) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: `pout_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        status: 'processed',
        amount: amount,
        type,
      });
    }, 300); // 300ms latency
  });
};

const createOrder = async (req, res) => {
  try {
    const { amount, farmerId, driverId, leadId } = req.body;
    
    if (!amount || amount < 1) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    
    // Dynamic price breakdown (example: 75% farmer, 9% driver, 9% lead, 7% platform)
    // Adjust based on items in real scenario, here using proportional split
    const farmerAmount = Math.round(amount * 0.75);
    const driverAmount = Math.round(amount * 0.09);
    const leadAmount = Math.round(amount * 0.09);
    const platformFee = amount - (farmerAmount + driverAmount + leadAmount);

    let rzpOrderId = `mock_order_${Date.now()}`;
    if (!ENABLE_MOCK_PAYOUTS && process.env.RAZORPAY_KEY_ID) {
        const options = {
          amount: amount * 100, // amount in smallest currency unit (paise)
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
        };
        const order = await razorpay.orders.create(options);
        rzpOrderId = order.id;
    }

    const newOrder = await db.query(
      `INSERT INTO orders 
        (total_amount, status, razorpay_order_id, farmer_amount, driver_amount, lead_amount, platform_fee, farmer_id, driver_id, lead_id) 
       VALUES ($1, 'PENDING', $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [amount, rzpOrderId, farmerAmount, driverAmount, leadAmount, platformFee, farmerId, driverId, leadId]
    );

    res.json({
      success: true,
      order: newOrder.rows[0],
      splitBreakdown: { farmerAmount, driverAmount, leadAmount, platformFee },
      razorpayOrderId: rzpOrderId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
};

const verifyEscrow = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    if (!ENABLE_MOCK_PAYOUTS && process.env.RAZORPAY_KEY_SECRET) {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');
  
      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Invalid signature' });
      }
    }

    await db.query(
      `UPDATE orders SET status = 'ESCROW_HELD', razorpay_payment_id = $1 WHERE id = $2`,
      [razorpay_payment_id, orderId]
    );

    const orderRes = await db.query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
    const order = orderRes.rows[0];

    // Initialize pending ledgers
    const ledgers = [
      { type: 'FARMER', id: order.farmer_id, amt: order.farmer_amount },
      { type: 'DRIVER', id: order.driver_id, amt: order.driver_amount },
      { type: 'COMMUNITY_LEAD', id: order.lead_id, amt: order.lead_amount },
      { type: 'PLATFORM', id: null, amt: order.platform_fee },
    ];

    for (let l of ledgers) {
      await db.query(
        `INSERT INTO payout_ledgers (order_id, recipient_type, recipient_id, amount, payout_method, status) 
         VALUES ($1, $2, $3, $4, 'IMPS', 'QUEUED')`,
        [orderId, l.type, l.id, l.amt]
      );
    }

    res.json({ success: true, message: 'Payment verified and escrow held', orderId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to verify escrow' });
  }
};

module.exports = { createOrder, verifyEscrow, ENABLE_MOCK_PAYOUTS, simulatePayout, razorpay };
