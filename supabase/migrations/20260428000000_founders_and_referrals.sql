-- ============================================================
-- Founders Club product + Affiliate referral system
-- Generated 2026-04-28 for the launch.
-- ============================================================

-- ─── 1. Founders Club product ───
-- £1 lifetime access to all 33 books. Marked as a 'founders_club'
-- product_type so the Shop UI + edge fns can recognise it. The
-- stripe_price_id is NULL here — set it manually after creating the
-- product/price in your Stripe dashboard:
--   stripe products create --name "Founders Club" --metadata=...
--   stripe prices create --product=prod_... --unit-amount=100 --currency=gbp
--   UPDATE products SET stripe_price_id = 'price_...' WHERE product_type = 'founders_club';
INSERT INTO products (name, description, product_type, price_pence, currency, levels_included, sort_order, is_active, stripe_price_id)
VALUES (
  'Founders Club',
  'Lifetime access to all 33 books, every assessment, all future releases — for our first 1,000 founding families.',
  'founders_club',
  100,
  'gbp',
  ARRAY[1,2,3,4,5,6],
  0,
  true,
  NULL
)
ON CONFLICT DO NOTHING;

-- ─── 2. referrals table ───
-- One row per user. Code is generated server-side on signup via the
-- handle_new_user_referral trigger below. Code is uppercase alphanumeric,
-- 6 chars (~2.1B combinations — collisions extremely rare for our scale).
CREATE TABLE IF NOT EXISTS referrals (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  total_clicks INT NOT NULL DEFAULT 0,
  total_signups INT NOT NULL DEFAULT 0,
  total_conversions INT NOT NULL DEFAULT 0,
  total_earnings_pence INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(code);

-- ─── 3. referral_attributions table ───
-- One row per attributed conversion. Written by the stripe-webhook when a
-- checkout completes that carried a ref_code in metadata. Tracks the
-- referrer (who shared the link), the buyer (who paid), the order, and
-- the commission earned. paid_out flag for future payout reconciliation.
CREATE TABLE IF NOT EXISTS referral_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_email TEXT,
  ref_code TEXT NOT NULL,
  stripe_session_id TEXT UNIQUE,
  product_id UUID REFERENCES products(id),
  amount_pence INT NOT NULL DEFAULT 0,
  commission_pence INT NOT NULL DEFAULT 0,
  paid_out BOOLEAN NOT NULL DEFAULT FALSE,
  paid_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attributions_referrer ON referral_attributions(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_attributions_ref_code ON referral_attributions(ref_code);
CREATE INDEX IF NOT EXISTS idx_attributions_unpaid ON referral_attributions(paid_out) WHERE paid_out = FALSE;

-- ─── 4. Code generator ───
-- 6-char uppercase alphanumeric. We exclude visually ambiguous chars
-- (0/O, 1/I/L) so users reading codes off a screen don't make typos.
CREATE OR REPLACE FUNCTION generate_referral_code() RETURNS TEXT
LANGUAGE plpgsql AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
  attempt INT := 0;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    -- Collision check — re-roll on the off chance.
    IF NOT EXISTS (SELECT 1 FROM referrals WHERE code = result) THEN
      RETURN result;
    END IF;
    attempt := attempt + 1;
    IF attempt > 10 THEN
      RAISE EXCEPTION 'Could not generate unique referral code after 10 attempts';
    END IF;
  END LOOP;
END;
$$;

-- ─── 5. Auto-create referral row on user signup ───
CREATE OR REPLACE FUNCTION handle_new_user_referral() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO referrals (user_id, code) VALUES (NEW.id, generate_referral_code())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_referral ON auth.users;
CREATE TRIGGER on_auth_user_created_referral
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_referral();

-- ─── 6. Backfill: every existing user gets a code ───
INSERT INTO referrals (user_id, code)
SELECT u.id, generate_referral_code()
FROM auth.users u
LEFT JOIN referrals r ON r.user_id = u.id
WHERE r.user_id IS NULL;

-- ─── 7. RLS ───
-- Each user can read their own referral row + their own attributions.
-- Service role (edge fns) bypasses RLS.
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_attributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own referral" ON referrals;
CREATE POLICY "Users see own referral" ON referrals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users see own attributions" ON referral_attributions;
CREATE POLICY "Users see own attributions" ON referral_attributions
  FOR SELECT USING (auth.uid() = referrer_user_id);

-- ─── 8. Anonymous code-lookup RPC ───
-- The landing page captures ?ref=CODE before the visitor signs in. We need
-- a public way to validate the code (and increment the click counter)
-- without exposing the referrals table to anonymous reads.
CREATE OR REPLACE FUNCTION track_referral_click(p_code TEXT) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  found BOOLEAN;
BEGIN
  UPDATE referrals SET total_clicks = total_clicks + 1 WHERE code = p_code RETURNING TRUE INTO found;
  RETURN COALESCE(found, FALSE);
END;
$$;

GRANT EXECUTE ON FUNCTION track_referral_click(TEXT) TO anon, authenticated;

-- ─── 9. Atomic stat-bump RPC (used by stripe-webhook on attribution) ───
CREATE OR REPLACE FUNCTION increment_referral_stats(p_user_id UUID, p_commission INT) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE referrals
  SET total_conversions = total_conversions + 1,
      total_earnings_pence = total_earnings_pence + p_commission
  WHERE user_id = p_user_id;
END;
$$;

-- service_role bypasses RLS but still needs EXECUTE on SECURITY DEFINER fns
GRANT EXECUTE ON FUNCTION increment_referral_stats(UUID, INT) TO service_role;
