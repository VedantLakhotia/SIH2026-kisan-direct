const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

async function runDemo() {
  console.log("=== Starting KisanSetu Live Demo Journey ===");
  try {
    // 1. Create Order (Consumer Checkout)
    console.log("\n[1] Consumer initiates checkout (₹280 total)...");
    const { data: orderRes } = await axios.post(`${API_BASE}/payment/create-order`, {
      amount: 280,
      farmerId: 1, // Assume user 1 is Farmer
      driverId: 5, // Assume user 5 is Driver
      leadId: 3    // Assume user 3 is Lead
    });
    const orderId = orderRes.order.id;
    console.log(`✓ Order Created (ID: ${orderId}, RZP ID: ${orderRes.razorpayOrderId})`);
    console.log("   Split Breakdown:", orderRes.splitBreakdown);

    // 2. Verify Escrow (Consumer Payment Success)
    console.log("\n[2] Consumer payment successful, verifying escrow...");
    const { data: escrowRes } = await axios.post(`${API_BASE}/payment/verify-escrow`, {
      orderId,
      razorpay_order_id: orderRes.razorpayOrderId,
      razorpay_payment_id: `mock_pay_${Date.now()}`,
      razorpay_signature: "mock_signature" 
    });
    console.log(`✓ Escrow Verified! Funds are now securely held.`);

    // 3. Driver Scans QR at Farm Gate
    console.log("\n[3] Driver arrives at farm gate, scans Produce QR...");
    const { data: pickupRes } = await axios.post(`${API_BASE}/logistics/verify-pickup`, {
      orderId,
      crateQrCode: 'CRATE-1234',
      driverId: 5
    });
    console.log(`✓ Pickup Verified! -> ${pickupRes.message}`);
    console.log(`   Farmer payout of ₹${pickupRes.farmerAmount} has been processed.`);

    // 4. Community Lead Confirms Hub Reception
    console.log("\n[4] Driver arrives at Society Hub. Lead confirms reception...");
    const { data: deliveryRes } = await axios.post(`${API_BASE}/logistics/complete-delivery`, {
      orderId,
      societyHubId: 1,
      leadVerificationPin: '9999'
    });
    console.log(`✓ Delivery Complete! -> ${deliveryRes.message}`);
    console.log("   Escrow is now fully SETTLED.");
    
    console.log("\n=== Demo Journey Completed Successfully in ~2 seconds ===");
  } catch (err) {
    console.error("Demo failed:", err.response ? err.response.data : err.message);
  }
}

runDemo();
