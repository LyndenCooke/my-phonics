-- ============================================================
-- New pricing: seed products table
-- Run AFTER creating Stripe products/prices in your Stripe dashboard
-- Then UPDATE the stripe_price_id values below with real Stripe IDs
-- ============================================================

-- Clear old products
DELETE FROM products;

-- 1. Free Sample (1 book at assessed level — no Stripe needed)
INSERT INTO products (name, description, product_type, price_pence, currency, levels_included, sort_order, is_active, stripe_price_id)
VALUES (
  'Free Sample Book',
  'One free book at your child''s reading level after assessment',
  'free_sample',
  0,
  'gbp',
  ARRAY[1,2,3,4,5,6],
  1,
  true,
  NULL
);

-- 2. All Books Bundle (one-time £49.99)
INSERT INTO products (name, description, product_type, price_pence, currency, levels_included, sort_order, is_active, stripe_price_id)
VALUES (
  'Complete Library',
  'All 32 interactive phonics books across all 6 levels — yours forever',
  'full_bundle',
  4999,
  'gbp',
  ARRAY[1,2,3,4,5,6],
  2,
  true,
  'REPLACE_WITH_STRIPE_PRICE_ID_BUNDLE'
);

-- 3. Monthly Subscription (£4.99/mo with 7-day free trial)
INSERT INTO products (name, description, product_type, price_pence, currency, levels_included, sort_order, is_active, stripe_price_id)
VALUES (
  'Monthly Access',
  'All books, assessments & progress tracking — 7-day free trial, cancel anytime',
  'subscription',
  499,
  'gbp',
  ARRAY[1,2,3,4,5,6],
  3,
  true,
  'REPLACE_WITH_STRIPE_PRICE_ID_MONTHLY'
);

-- 4. Annual Subscription (£39.99/year — launch deal, locked forever)
INSERT INTO products (name, description, product_type, price_pence, currency, levels_included, sort_order, is_active, stripe_price_id)
VALUES (
  'Annual Access — Launch Deal',
  'All books for a year at our lowest ever price — locked in forever when you join now',
  'subscription_annual',
  3999,
  'gbp',
  ARRAY[1,2,3,4,5,6],
  4,
  true,
  'REPLACE_WITH_STRIPE_PRICE_ID_ANNUAL'
);
