-- Founders Club copy update: switch from a quantity cap (first 1,000
-- founding families) to a time cap (first 2 weeks of launch). The end
-- date is enforced in the UI via FOUNDERS_END_AT in src/lib/foundersClub.ts;
-- this migration just brings the products.description text in line so the
-- shop page doesn't render contradictory copy.
UPDATE products
SET description = 'Lifetime access to all 33 books, every assessment, all future releases — for our first 2 weeks only.'
WHERE product_type = 'founders_club';
