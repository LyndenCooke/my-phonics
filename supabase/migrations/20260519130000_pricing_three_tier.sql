-- Pricing reshuffle:
--   monthly  £4.99  (unchanged)
--   annual   £29.99 (was £39.99)
--   one-off  £39.00 (was £49.99 lifetime bundle)
--
-- NOTE: price_pence here drives what the Pricing card displays. Stripe will
-- still charge whatever price the stripe_price_id resolves to. New Stripe
-- prices must be created in the Stripe dashboard and their IDs swapped in
-- before live checkouts will match these numbers.

update public.products
set price_pence = 2999,
    name        = 'Annual Access',
    description = 'All books, assessments and progress tracking for a year'
where product_type = 'subscription_annual';

update public.products
set price_pence = 3900,
    name        = 'Lifetime Access',
    description = 'Everything — all 33 books across all 6 levels, yours forever'
where product_type = 'full_bundle';
