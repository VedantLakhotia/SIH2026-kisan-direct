const db = require('../db');
const { ENABLE_MOCK_PAYOUTS, simulatePayout, razorpay } = require('./paymentController');

const verifyPickup = async (req, res) => {
  try {
    const { orderId, crateQrCode, driverId } = req.body;

    const orderRes = await db.query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
    if (orderRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });
    const order = orderRes.rows[0];

    if (order.driver_id !== parseInt(driverId)) {
        return res.status(403).json({ success: false, message: 'Driver mismatch' });
    }

    await db.query(`UPDATE orders SET status = 'IN_TRANSIT' WHERE id = $1`, [orderId]);

    // Disburse Farmer payout
    let payoutId = `mock_payout_${Date.now()}`;
    if (ENABLE_MOCK_PAYOUTS) {
      const mock = await simulatePayout(order.farmer_amount, 'FARMER');
      payoutId = mock.id;
    } else {
        // Pseudo real integration 
        // const payout = await razorpay.payouts.create({ account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER, amount: order.farmer_amount * 100, currency: "INR", mode: "IMPS", purpose: "payout", fund_account_id: "fa_dummy", queue_if_low_balance: true });
        // payoutId = payout.id;
    }

    await db.query(
      `UPDATE payout_ledgers SET status = 'TRANSFERRED', transferred_at = NOW(), razorpay_payout_id = $1 
       WHERE order_id = $2 AND recipient_type = 'FARMER'`,
      [payoutId, orderId]
    );

    res.json({ success: true, message: 'Produce In-Transit | Farmer Paid', farmerAmount: order.farmer_amount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to verify pickup' });
  }
};

const completeDelivery = async (req, res) => {
  try {
    const { orderId, societyHubId, leadVerificationPin } = req.body;

    const orderRes = await db.query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
    if (orderRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });
    const order = orderRes.rows[0];

    // Disburse Driver & Lead payouts
    let dPayoutId = `mock_dpayout_${Date.now()}`;
    let lPayoutId = `mock_lpayout_${Date.now()}`;
    if (ENABLE_MOCK_PAYOUTS) {
      const dMock = await simulatePayout(order.driver_amount, 'DRIVER');
      const lMock = await simulatePayout(order.lead_amount, 'COMMUNITY_LEAD');
      dPayoutId = dMock.id;
      lPayoutId = lMock.id;
    }

    await db.query(
      `UPDATE payout_ledgers SET status = 'TRANSFERRED', transferred_at = NOW(), razorpay_payout_id = $1 
       WHERE order_id = $2 AND recipient_type = 'DRIVER'`,
      [dPayoutId, orderId]
    );

    await db.query(
      `UPDATE payout_ledgers SET status = 'TRANSFERRED', transferred_at = NOW(), razorpay_payout_id = $1 
       WHERE order_id = $2 AND recipient_type = 'COMMUNITY_LEAD'`,
      [lPayoutId, orderId]
    );

    await db.query(`UPDATE orders SET status = 'SETTLED' WHERE id = $1`, [orderId]);

    res.json({ 
        success: true, 
        message: `Trip Complete: Driver credited ₹${order.driver_amount} | Lead wallet credited ₹${order.lead_amount}`,
        driverAmount: order.driver_amount,
        leadAmount: order.lead_amount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to complete delivery' });
  }
};

module.exports = { verifyPickup, completeDelivery };
