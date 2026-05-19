-- Stripe Price IDs refreshed after the £4.99/£29.99/£39 reshuffle.
-- Stripe Prices are immutable, so changing an amount creates a new Price ID;
-- the old IDs were archived in the Stripe dashboard and now return
-- "No such price" at checkout. These three updates point the products table
-- back at the live, active Prices.
update public.products
set stripe_price_id = 'price_1THutoQpytN7wEoxtWp1eirq'
where product_type = 'subscription';

update public.products
set stripe_price_id = 'price_1THutnQpytN7wEoxvFpjGgse'
where product_type = 'subscription_annual';

update public.products
set stripe_price_id = 'price_1THutrQpytN7wEox1ImF2qng'
where product_type = 'full_bundle';
