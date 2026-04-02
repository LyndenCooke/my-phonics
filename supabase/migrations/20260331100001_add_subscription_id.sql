-- Add stripe_subscription_id to purchases for subscription tracking
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
