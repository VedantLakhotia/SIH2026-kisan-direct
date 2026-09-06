-- ============================================
-- KisanDirect F2C — Seed Data
-- ============================================

-- Users: 5 Farmers, 5 Consumers, 2 Leads, 1 Admin, 2 Drivers
INSERT INTO users (name, role, phone, address, lat, lng, society_name, society_id) VALUES
  -- Farmers (rural areas around Delhi-NCR)
  ('Ramesh Kumar',   'Farmer',   '9876543210', 'Village Khandawli, Meerut, UP',        28.9845, 77.7064, NULL, NULL),
  ('Sunita Devi',    'Farmer',   '9876543211', 'Village Pilkhuwa, Hapur, UP',           28.7440, 77.7756, NULL, NULL),
  ('Mahesh Singh',   'Farmer',   '9876543212', 'Village Dadri, Greater Noida, UP',      28.4744, 77.5040, NULL, NULL),
  ('Lakshmi Yadav',  'Farmer',   '9876543213', 'Village Sikandrabad, Bulandshahr, UP',  28.4070, 77.8498, NULL, NULL),
  ('Bhola Prasad',   'Farmer',   '9876543214', 'Village Charthawal, Muzaffarnagar, UP', 29.4727, 77.7085, NULL, NULL),

  -- Consumers (urban apartments)
  ('Priya Sharma',   'Consumer', '9812345670', 'Flat 302, Amrapali, Sector 62, Noida',  28.6270, 77.3653, 'Amrapali Society',   1),
  ('Amit Verma',     'Consumer', '9812345671', 'Flat 505, ATS, Sector 18, Noida',       28.5700, 77.3230, 'ATS Greens',         2),
  ('Neha Gupta',     'Consumer', '9812345672', 'Flat 101, DLF Phase 3, Gurgaon',        28.4595, 77.0266, 'DLF Residents',      3),
  ('Rahul Jain',     'Consumer', '9812345673', 'B-42, Vasant Kunj, New Delhi',          28.5194, 77.1571, 'Vasant Kunj RWA',    1),
  ('Kavita Singh',   'Consumer', '9812345674', 'Flat 208, Mahagun, Ghaziabad',          28.6692, 77.4538, 'Mahagun Residents',  1),

  -- Community Leads
  ('Deepak Tiwari',  'Lead',     '9898765430', 'Sector 62, Noida',                      28.6270, 77.3653, 'Amrapali Society',   1),
  ('Anita Kumari',   'Lead',     '9898765431', 'DLF Phase 3, Gurgaon',                  28.4595, 77.0266, 'DLF Residents',      3),

  -- Admin
  ('Vikram Mehta',   'Admin',    '9900112233', 'Connaught Place, New Delhi',             28.6139, 77.2090, NULL, NULL),

  -- Drivers
  ('Suresh Pal',     'Driver',   '9911223344', 'Loni, Ghaziabad',                       28.7500, 77.2800, NULL, NULL),
  ('Rajesh Chauhan', 'Driver',   '9911223345', 'Karol Bagh, New Delhi',                 28.6519, 77.1905, NULL, NULL);

-- Listings (Farmer produce)
INSERT INTO listings (farmer_id, crop_name, quantity_kg, price_per_kg, grade, harvest_date, organic_cert, description, status, lat, lng) VALUES
  (1, 'Tomato',      200, 25.00, 'A', CURRENT_DATE - INTERVAL '1 day',  FALSE, 'Fresh red tomatoes, firm and ripe',                 'Available', 28.9845, 77.7064),
  (1, 'Onion',       500, 18.00, 'A', CURRENT_DATE - INTERVAL '2 days', FALSE, 'Premium quality onions, no sprouting',              'Available', 28.9845, 77.7064),
  (2, 'Potato',      300, 15.00, 'B', CURRENT_DATE - INTERVAL '1 day',  FALSE, 'Medium size potatoes, good for cooking',            'Available', 28.7440, 77.7756),
  (2, 'Cauliflower', 150, 30.00, 'A', CURRENT_DATE,                     TRUE,  'Organic cauliflower, pesticide-free',               'Available', 28.7440, 77.7756),
  (3, 'Spinach',     100, 20.00, 'A', CURRENT_DATE,                     TRUE,  'Fresh morning harvest organic spinach',             'Available', 28.4744, 77.5040),
  (3, 'Cabbage',     200, 12.00, 'B', CURRENT_DATE - INTERVAL '1 day',  FALSE, 'Green cabbage, medium heads',                       'Available', 28.4744, 77.5040),
  (4, 'Wheat',      1000, 22.00, 'A', CURRENT_DATE - INTERVAL '5 days', FALSE, 'Premium wheat grain, clean and dry',                'Available', 28.4070, 77.8498),
  (4, 'Rice',        800, 35.00, 'A', CURRENT_DATE - INTERVAL '3 days', FALSE, 'Basmati rice, aged, long grain',                    'Available', 28.4070, 77.8498),
  (5, 'Mango',       250, 60.00, 'A', CURRENT_DATE - INTERVAL '1 day',  FALSE, 'Dasheri mangoes, sweet and juicy',                  'Available', 29.4727, 77.7085),
  (5, 'Banana',      400, 25.00, 'B', CURRENT_DATE,                     FALSE, 'Ripe yellow bananas, ready to eat',                 'Available', 29.4727, 77.7085),
  (1, 'Carrot',      150, 28.00, 'A', CURRENT_DATE,                     TRUE,  'Organic red carrots, freshly pulled',               'Available', 28.9845, 77.7064),
  (3, 'Brinjal',     120, 22.00, 'B', CURRENT_DATE - INTERVAL '1 day',  FALSE, 'Purple brinjal, medium size',                       'Available', 28.4744, 77.5040),
  (2, 'Okra',        100, 35.00, 'A', CURRENT_DATE,                     FALSE, 'Tender okra, hand-picked',                          'Available', 28.7440, 77.7756),
  (4, 'Peas',        200, 40.00, 'A', CURRENT_DATE - INTERVAL '2 days', TRUE,  'Organic green peas, sweet variety',                 'Available', 28.4070, 77.8498);

-- Society Pools
INSERT INTO society_pools (lead_id, society_id, crop_name, target_kg, current_kg, price_per_kg, discount_percent, description, deadline, status) VALUES
  (11, 1, 'Tomato',      100, 45,  22.00, 12, 'Weekly tomato pool — farm fresh!',            NOW() + INTERVAL '3 days', 'Open'),
  (11, 1, 'Onion',       200, 180, 16.00, 10, 'Bulk onion order — great savings',            NOW() + INTERVAL '2 days', 'Open'),
  (11, 1, 'Potato',      150, 150, 13.00, 15, 'Potato pool — target reached!',               NOW() + INTERVAL '1 day',  'Locked'),
  (12, 3, 'Spinach',      50, 20,  18.00, 10, 'Organic spinach for DLF residents',           NOW() + INTERVAL '4 days', 'Open'),
  (12, 3, 'Rice',        300, 50,  32.00,  8, 'Premium basmati rice — monthly stock',        NOW() + INTERVAL '7 days', 'Open'),
  (11, 1, 'Cauliflower',  80, 80,  27.00, 10, 'Organic cauliflower — delivered last week',   NOW() - INTERVAL '5 days', 'Fulfilled');

-- Pool Orders
INSERT INTO pool_orders (consumer_id, pool_id, quantity_kg, delivery_type, status) VALUES
  (6,  1, 15, 'Hub Pickup', 'Pending'),
  (9,  1, 10, 'Doorstep',   'Pending'),
  (10, 1, 20, 'Doorstep',   'Pending'),
  (6,  2, 50, 'Hub Pickup', 'Pending'),
  (9,  2, 60, 'Doorstep',   'Pending'),
  (10, 2, 70, 'Hub Pickup', 'Pending'),
  (6,  3, 50, 'Doorstep',   'Confirmed'),
  (9,  3, 40, 'Hub Pickup', 'Confirmed'),
  (10, 3, 60, 'Doorstep',   'Confirmed'),
  (8,  4, 10, 'Doorstep',   'Pending'),
  (8,  4, 10, 'Hub Pickup', 'Pending');

-- Direct Orders
INSERT INTO direct_orders (consumer_id, listing_id, quantity_kg, total_price, delivery_type, status) VALUES
  (6, 9, 5,  300.00, 'Doorstep',   'Delivered'),
  (7, 5, 3,   60.00, 'Hub Pickup', 'Confirmed'),
  (8, 8, 10, 350.00, 'Doorstep',   'Shipped');

-- Pickup Requests
INSERT INTO pickup_requests (farmer_id, listing_id, quantity_kg, preferred_date, preferred_time, lat, lng, address, status) VALUES
  (1, 1,  200, CURRENT_DATE + 1, 'Morning',   28.9845, 77.7064, 'Village Khandawli, Meerut',        'Pending'),
  (1, 2,  500, CURRENT_DATE + 1, 'Morning',   28.9845, 77.7064, 'Village Khandawli, Meerut',        'Pending'),
  (2, 3,  300, CURRENT_DATE + 1, 'Afternoon',  28.7440, 77.7756, 'Village Pilkhuwa, Hapur',          'Pending'),
  (3, 5,  100, CURRENT_DATE + 2, 'Morning',   28.4744, 77.5040, 'Village Dadri, Greater Noida',     'Pending'),
  (4, 7, 1000, CURRENT_DATE + 2, 'Morning',   28.4070, 77.8498, 'Village Sikandrabad, Bulandshahr', 'Pending'),
  (5, 9,  250, CURRENT_DATE + 1, 'Afternoon',  29.4727, 77.7085, 'Village Charthawal, Muzaffarnagar','Pending');

-- Price Data (Mandi prices — multiple markets, today and yesterday)
INSERT INTO price_data (crop_name, market_name, min_price, max_price, modal_price, date) VALUES
  -- Today's prices
  ('Tomato',      'Azadpur, Delhi',        20, 35, 28, CURRENT_DATE),
  ('Tomato',      'Vashi, Mumbai',         22, 38, 30, CURRENT_DATE),
  ('Tomato',      'Yeshwanthpur, Bangalore',18, 32, 25, CURRENT_DATE),
  ('Tomato',      'Aminabad, Lucknow',     15, 30, 22, CURRENT_DATE),
  ('Onion',       'Azadpur, Delhi',        15, 25, 20, CURRENT_DATE),
  ('Onion',       'Vashi, Mumbai',         12, 22, 17, CURRENT_DATE),
  ('Onion',       'Yeshwanthpur, Bangalore',14, 24, 19, CURRENT_DATE),
  ('Onion',       'Aminabad, Lucknow',     10, 20, 15, CURRENT_DATE),
  ('Potato',      'Azadpur, Delhi',        12, 20, 16, CURRENT_DATE),
  ('Potato',      'Vashi, Mumbai',         14, 22, 18, CURRENT_DATE),
  ('Potato',      'Aminabad, Lucknow',     10, 18, 14, CURRENT_DATE),
  ('Cauliflower', 'Azadpur, Delhi',        25, 40, 32, CURRENT_DATE),
  ('Cauliflower', 'Vashi, Mumbai',         28, 45, 36, CURRENT_DATE),
  ('Spinach',     'Azadpur, Delhi',        15, 28, 22, CURRENT_DATE),
  ('Spinach',     'Aminabad, Lucknow',     12, 25, 18, CURRENT_DATE),
  ('Cabbage',     'Azadpur, Delhi',         8, 18, 12, CURRENT_DATE),
  ('Cabbage',     'Vashi, Mumbai',         10, 20, 14, CURRENT_DATE),
  ('Wheat',       'Azadpur, Delhi',        20, 26, 23, CURRENT_DATE),
  ('Wheat',       'Aminabad, Lucknow',     18, 24, 21, CURRENT_DATE),
  ('Rice',        'Azadpur, Delhi',        30, 42, 36, CURRENT_DATE),
  ('Rice',        'Vashi, Mumbai',         32, 45, 38, CURRENT_DATE),
  ('Mango',       'Azadpur, Delhi',        50, 80, 65, CURRENT_DATE),
  ('Mango',       'Vashi, Mumbai',         55, 85, 70, CURRENT_DATE),
  ('Banana',      'Azadpur, Delhi',        20, 30, 25, CURRENT_DATE),
  ('Banana',      'Vashi, Mumbai',         22, 32, 27, CURRENT_DATE),
  ('Carrot',      'Azadpur, Delhi',        22, 35, 28, CURRENT_DATE),
  ('Brinjal',     'Azadpur, Delhi',        18, 30, 24, CURRENT_DATE),
  ('Okra',        'Azadpur, Delhi',        30, 45, 38, CURRENT_DATE),
  ('Peas',        'Azadpur, Delhi',        35, 50, 42, CURRENT_DATE),
  ('Peas',        'Aminabad, Lucknow',     32, 48, 40, CURRENT_DATE),

  -- Yesterday's prices (for trend)
  ('Tomato',      'Azadpur, Delhi',        22, 37, 30, CURRENT_DATE - 1),
  ('Tomato',      'Vashi, Mumbai',         24, 40, 32, CURRENT_DATE - 1),
  ('Onion',       'Azadpur, Delhi',        16, 26, 21, CURRENT_DATE - 1),
  ('Onion',       'Vashi, Mumbai',         13, 23, 18, CURRENT_DATE - 1),
  ('Potato',      'Azadpur, Delhi',        13, 21, 17, CURRENT_DATE - 1),
  ('Cauliflower', 'Azadpur, Delhi',        27, 42, 34, CURRENT_DATE - 1),
  ('Spinach',     'Azadpur, Delhi',        16, 30, 23, CURRENT_DATE - 1),
  ('Wheat',       'Azadpur, Delhi',        21, 27, 24, CURRENT_DATE - 1),
  ('Rice',        'Azadpur, Delhi',        31, 43, 37, CURRENT_DATE - 1),
  ('Mango',       'Azadpur, Delhi',        52, 82, 67, CURRENT_DATE - 1),
  ('Banana',      'Azadpur, Delhi',        21, 31, 26, CURRENT_DATE - 1);

-- Notifications
INSERT INTO notifications (user_id, title, message) VALUES
  (1, 'Welcome!',           'Welcome to KisanDirect. Start listing your produce today!'),
  (6, 'Pool Update',        'Tomato pool is 45% full. Join now for 12% discount!'),
  (6, 'Order Delivered',    'Your mango order (5kg) has been delivered.'),
  (11, 'Pool Nearly Full',  'Onion pool is 90% full. Get ready to lock!'),
  (13, 'System Alert',      '6 pending pickup requests need batch assignment.');
