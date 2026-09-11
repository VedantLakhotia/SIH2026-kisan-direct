const pool = require('./db');

async function updateDb() {
  try {
    await pool.query('DROP TABLE IF EXISTS payout_ledgers CASCADE;');
    await pool.query('DROP TABLE IF EXISTS orders CASCADE;');
    await pool.query(`
      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        total_amount NUMERIC(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ESCROW_HELD', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'SETTLED')),
        razorpay_order_id VARCHAR(100),
        razorpay_payment_id VARCHAR(100),
        farmer_amount NUMERIC(10,2),
        driver_amount NUMERIC(10,2),
        lead_amount NUMERIC(10,2),
        platform_fee NUMERIC(10,2),
        farmer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        lead_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE payout_ledgers (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        recipient_type VARCHAR(20) CHECK (recipient_type IN ('FARMER', 'DRIVER', 'COMMUNITY_LEAD', 'PLATFORM')),
        recipient_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        amount NUMERIC(10,2) NOT NULL,
        payout_method VARCHAR(20) CHECK (payout_method IN ('UPI', 'IMPS', 'WALLET')),
        status VARCHAR(20) DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'PROCESSING', 'TRANSFERRED', 'FAILED')),
        razorpay_payout_id VARCHAR(100),
        transferred_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Database updated successfully');
  } catch (error) {
    console.error('Error updating database:', error);
  } finally {
    process.exit();
  }
}

updateDb();
