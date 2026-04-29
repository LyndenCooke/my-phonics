-- ============================================================
-- Founders Club reviews — terms-of-entry feedback loop.
--
-- The £1 Founders Club is sold as "limited launch — share your honest
-- feedback at 24h and 1 week so we can fix bugs and improve fast." This
-- table tracks the prompts we owe each Founder.
--
-- Two prompts auto-scheduled per purchase via trigger:
--   - founders_24h (due 24h after purchase) — early reactions, what's
--     broken, what's missing
--   - founders_1week (due 7 days after) — testimonial-grade reflection
--     after they've actually used it with their child
--
-- Reviews with consent_marketing=TRUE are usable in social posts /
-- landing-page testimonials. consent_named adds permission to attribute.
-- ============================================================

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('founders_24h', 'founders_1week', 'general')),
  due_at TIMESTAMPTZ NOT NULL,
  prompted_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  consent_marketing BOOLEAN NOT NULL DEFAULT FALSE,
  consent_named BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_user_due ON reviews(user_id, due_at) WHERE submitted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_marketing ON reviews(consent_marketing) WHERE consent_marketing = TRUE AND submitted_at IS NOT NULL;

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own reviews" ON reviews;
CREATE POLICY "Users see own reviews" ON reviews FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own reviews" ON reviews;
CREATE POLICY "Users update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION schedule_founders_reviews() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  pt TEXT;
BEGIN
  IF NEW.status <> 'completed' OR (OLD.status IS NOT DISTINCT FROM 'completed') THEN
    RETURN NEW;
  END IF;
  SELECT product_type INTO pt FROM products WHERE id = NEW.product_id;
  IF pt = 'founders_club' THEN
    INSERT INTO reviews (user_id, purchase_id, kind, due_at)
      VALUES (NEW.user_id, NEW.id, 'founders_24h', NEW.completed_at + INTERVAL '24 hours')
    ON CONFLICT DO NOTHING;
    INSERT INTO reviews (user_id, purchase_id, kind, due_at)
      VALUES (NEW.user_id, NEW.id, 'founders_1week', NEW.completed_at + INTERVAL '7 days')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_purchase_completed_schedule_reviews ON purchases;
CREATE TRIGGER on_purchase_completed_schedule_reviews
  AFTER INSERT OR UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION schedule_founders_reviews();
