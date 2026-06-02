-- ============================================================
-- Two-tier affiliate system
-- Generated 2026-06-01
--
-- Tier 1: 50% commission to the direct referrer
-- Tier 2: 10% commission to whoever recruited that referrer
-- Both tiers apply to monthly recurring AND lifetime one-off.
-- ============================================================

-- ─── 1. Add recruited_by to referrals ───
-- Tracks who referred this user to the platform. Set at signup via
-- raw_user_meta_data->>'ref_code' or retroactively by the client
-- calling claim_recruited_by() after login.
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS recruited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS total_tier2_earnings_pence INT NOT NULL DEFAULT 0;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS total_recruits INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_referrals_recruited_by ON referrals(recruited_by) WHERE recruited_by IS NOT NULL;

-- ─── 2. Add tier column to referral_attributions ───
-- 1 = direct referrer commission, 2 = recruiter commission.
-- Each purchase can generate up to 2 attribution rows.
ALTER TABLE referral_attributions ADD COLUMN IF NOT EXISTS tier INT NOT NULL DEFAULT 1;

-- Drop the old unique constraint on stripe_session_id (a single session
-- can now produce TWO attribution rows: tier 1 + tier 2).
-- Try both the default constraint name and the index name in case it
-- was created as a unique index rather than a constraint.
ALTER TABLE referral_attributions DROP CONSTRAINT IF EXISTS referral_attributions_stripe_session_id_key;
DROP INDEX IF EXISTS referral_attributions_stripe_session_id_key;

-- Replace with a composite unique: one row per session per tier.
CREATE UNIQUE INDEX IF NOT EXISTS idx_attributions_session_tier
  ON referral_attributions(stripe_session_id, tier);

-- ─── 3. Update handle_new_user_referral trigger ───
-- Now reads raw_user_meta_data->>'ref_code' to set recruited_by and
-- bump total_recruits on the recruiter's row.
-- IMPORTANT: keeps the EXCEPTION guard from 20260503100000 so a failure
-- here never crashes the auth.users INSERT transaction.
CREATE OR REPLACE FUNCTION public.handle_new_user_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ref_code TEXT;
  v_recruiter_id UUID;
BEGIN
  BEGIN
    INSERT INTO referrals (user_id, code) VALUES (NEW.id, generate_referral_code())
    ON CONFLICT (user_id) DO NOTHING;

    -- Check if this user was referred by someone
    v_ref_code := UPPER(TRIM(COALESCE(NEW.raw_user_meta_data->>'ref_code', '')));
    IF v_ref_code <> '' AND v_ref_code ~ '^[A-Z0-9]{4,12}$' THEN
      SELECT user_id INTO v_recruiter_id
      FROM referrals WHERE code = v_ref_code;

      -- Guard: no self-referral, no circular (recruiter already recruited by this user)
      IF v_recruiter_id IS NOT NULL
         AND v_recruiter_id <> NEW.id
         AND NOT EXISTS (SELECT 1 FROM referrals WHERE user_id = v_recruiter_id AND recruited_by = NEW.id)
      THEN
        UPDATE referrals
        SET recruited_by = v_recruiter_id
        WHERE user_id = NEW.id;

        -- Only bump total_recruits (not total_signups — that tracks direct ref link clicks)
        UPDATE referrals
        SET total_recruits = total_recruits + 1
        WHERE user_id = v_recruiter_id;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user_referral failed for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

-- ─── 4. Retroactive claim for existing users ───
-- If a user signed up before the referral link existed, or the ref_code
-- wasn't in user_metadata at signup, the client can call this after login
-- to set the relationship. Only works if recruited_by is still NULL
-- (first-touch attribution — no overwriting).
CREATE OR REPLACE FUNCTION claim_recruited_by(p_ref_code TEXT) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_caller UUID := auth.uid();
  v_recruiter_id UUID;
  v_already_set BOOLEAN;
BEGIN
  IF v_caller IS NULL THEN RETURN FALSE; END IF;

  -- Already claimed?
  SELECT (recruited_by IS NOT NULL) INTO v_already_set
  FROM referrals WHERE user_id = v_caller;
  IF v_already_set THEN RETURN FALSE; END IF;

  -- Look up the referrer
  SELECT user_id INTO v_recruiter_id
  FROM referrals WHERE code = UPPER(TRIM(p_ref_code));

  IF v_recruiter_id IS NULL OR v_recruiter_id = v_caller THEN RETURN FALSE; END IF;

  -- Circular check: reject if the would-be recruiter was recruited by the caller
  IF EXISTS (SELECT 1 FROM referrals WHERE user_id = v_recruiter_id AND recruited_by = v_caller) THEN
    RETURN FALSE;
  END IF;

  UPDATE referrals SET recruited_by = v_recruiter_id WHERE user_id = v_caller AND recruited_by IS NULL;

  UPDATE referrals
  SET total_recruits = total_recruits + 1
  WHERE user_id = v_recruiter_id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION claim_recruited_by(TEXT) TO authenticated;

-- ─── 5. Tier 2 stat-bump RPC ───
CREATE OR REPLACE FUNCTION increment_tier2_stats(p_user_id UUID, p_commission INT) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE referrals
  SET total_tier2_earnings_pence = total_tier2_earnings_pence + p_commission
  WHERE user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_tier2_stats(UUID, INT) TO service_role;

-- ─── 6. Lookup helper for the webhook ───
-- Given a referrer user_id, return who recruited them (if anyone).
-- Used by the stripe-webhook to compute Tier 2 commission.
CREATE OR REPLACE FUNCTION get_recruiter_of(p_user_id UUID) RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT recruited_by FROM referrals WHERE user_id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION get_recruiter_of(UUID) TO service_role;
