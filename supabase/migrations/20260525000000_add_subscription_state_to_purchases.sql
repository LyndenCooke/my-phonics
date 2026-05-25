-- Adds a lifecycle column on purchases so the in-app CRM pipeline can
-- derive Free Trial vs Subscribed vs Churned without re-hitting Stripe
-- at read time. Written by stripe-webhook on:
--   * checkout.session.completed     → 'trialing' or 'active'
--   * customer.subscription.updated  → 'active' (on trial→active)
--   * customer.subscription.deleted  → 'cancelled'
-- NULL for one-time purchases and any pre-tracking rows.

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS subscription_state TEXT;

COMMENT ON COLUMN public.purchases.subscription_state IS
  'Lifecycle state for subscription purchases: trialing | active | cancelled. NULL for one-time purchases or pre-tracking rows.';

CREATE INDEX IF NOT EXISTS purchases_subscription_state_idx
  ON public.purchases (subscription_state)
  WHERE subscription_state IS NOT NULL;
