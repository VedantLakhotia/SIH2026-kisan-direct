-- ============================================
-- KisanDirect F2C — Complete Database Schema
-- ============================================

-- Drop existing tables (in dependency order)
DROP TABLE IF EXISTS delivery_tracking CASCADE;
DROP TABLE IF EXISTS deliveries CASCADE;
DROP TABLE IF EXISTS batch_items CASCADE;
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS pickup_requests CASCADE;
DROP TABLE IF EXISTS direct_orders CASCADE;
DROP TABLE IF EXISTS pool_orders CASCADE;
DROP TABLE IF EXISTS society_pools CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS price_data CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users (Farmer, Consumer, Lead, Admin, Driver)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('Farmer','Consumer','Lead','Admin','Driver')),
  phone VARCHAR(15),
  address TEXT,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  society_name VARCHAR(100),
  society_id INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Listings (Farmer produce for sale)
CREATE TABLE listings (
  id SERIAL PRIMARY KEY,
  farmer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  crop_name VARCHAR(50) NOT NULL,
  quantity_kg NUMERIC(10,2) NOT NULL,
  price_per_kg NUMERIC(10,2) NOT NULL,
  grade CHAR(1) DEFAULT 'B' CHECK (grade IN ('A','B','C')),
  harvest_date DATE,
  photo_url TEXT,
  organic_cert BOOLEAN DEFAULT FALSE,
  description TEXT,
  status VARCHAR(20) DEFAULT 'Available' CHECK (status IN ('Available','Sold','Expired')),
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Society Pools (Community group buying)
CREATE TABLE society_pools (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  society_id INTEGER NOT NULL,
  crop_name VARCHAR(50) NOT NULL,
  target_kg NUMERIC(10,2) NOT NULL,
  current_kg NUMERIC(10,2) DEFAULT 0,
  price_per_kg NUMERIC(10,2),
  discount_percent NUMERIC(5,2) DEFAULT 10,
  description TEXT,
  deadline TIMESTAMP,
  status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open','Locked','Fulfilled','Cancelled')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Pool Orders (Consumer orders within pools)
CREATE TABLE pool_orders (
  id SERIAL PRIMARY KEY,
  consumer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  pool_id INTEGER REFERENCES society_pools(id) ON DELETE CASCADE,
  quantity_kg NUMERIC(10,2) NOT NULL,
  delivery_type VARCHAR(20) CHECK (delivery_type IN ('Hub Pickup','Doorstep')),
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending','Confirmed','Delivered','Cancelled')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Direct Orders (Marketplace purchases)
CREATE TABLE direct_orders (
  id SERIAL PRIMARY KEY,
  consumer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
  quantity_kg NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  delivery_type VARCHAR(20) CHECK (delivery_type IN ('Hub Pickup','Doorstep')),
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending','Confirmed','Shipped','Delivered','Cancelled')),
  delivery_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Pickup Requests (Farmer freight pickups)
CREATE TABLE pickup_requests (
  id SERIAL PRIMARY KEY,
  farmer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
  quantity_kg NUMERIC(10,2) NOT NULL,
  preferred_date DATE,
  preferred_time VARCHAR(20),
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  address TEXT,
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending','Batched','Assigned','PickedUp','Completed','Cancelled')),
  batch_id INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Batches (Grouped pickups for truck optimization)
CREATE TABLE batches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  total_kg NUMERIC(10,2) DEFAULT 0,
  truck_capacity_kg NUMERIC(10,2) DEFAULT 1000,
  utilization_percent NUMERIC(5,2) DEFAULT 0,
  route_data JSONB,
  estimated_distance_km NUMERIC(10,2),
  status VARCHAR(20) DEFAULT 'Planned' CHECK (status IN ('Planned','InProgress','Completed')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Batch Items (Pickups assigned to a batch)
CREATE TABLE batch_items (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE,
  pickup_id INTEGER REFERENCES pickup_requests(id) ON DELETE CASCADE,
  stop_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Deliveries (End-to-end delivery assignments)
CREATE TABLE deliveries (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
  driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  order_type VARCHAR(20) CHECK (order_type IN ('Pool','Direct')),
  order_id INTEGER,
  pickup_lat DECIMAL(10,7),
  pickup_lng DECIMAL(10,7),
  destination_lat DECIMAL(10,7),
  destination_lng DECIMAL(10,7),
  destination_address TEXT,
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending','PickedUp','InTransit','Delivered')),
  estimated_arrival TIMESTAMP,
  actual_arrival TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 10. Delivery Tracking (GPS breadcrumb trail)
CREATE TABLE delivery_tracking (
  id SERIAL PRIMARY KEY,
  delivery_id INTEGER REFERENCES deliveries(id) ON DELETE CASCADE,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- 11. Price Data (Mandi market prices)
CREATE TABLE price_data (
  id SERIAL PRIMARY KEY,
  crop_name VARCHAR(50) NOT NULL,
  market_name VARCHAR(100) NOT NULL,
  min_price NUMERIC(10,2),
  max_price NUMERIC(10,2),
  modal_price NUMERIC(10,2),
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 12. Notifications
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200),
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_listings_farmer ON listings(farmer_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_crop ON listings(crop_name);
CREATE INDEX idx_pool_orders_consumer ON pool_orders(consumer_id);
CREATE INDEX idx_pool_orders_pool ON pool_orders(pool_id);
CREATE INDEX idx_direct_orders_consumer ON direct_orders(consumer_id);
CREATE INDEX idx_pickup_requests_farmer ON pickup_requests(farmer_id);
CREATE INDEX idx_pickup_requests_status ON pickup_requests(status);
CREATE INDEX idx_deliveries_driver ON deliveries(driver_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_delivery_tracking_delivery ON delivery_tracking(delivery_id);
CREATE INDEX idx_price_data_crop ON price_data(crop_name);
CREATE INDEX idx_notifications_user ON notifications(user_id);