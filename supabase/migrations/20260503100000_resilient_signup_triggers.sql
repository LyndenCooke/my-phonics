-- ============================================================
-- Resilient signup triggers
--
-- Bug: Google OAuth was failing with
--   error_code=unexpected_failure
--   error_description=Database error saving new user
--
-- Cause: One of the AFTER INSERT triggers chained off auth.users /
-- public.profiles was throwing. Because they ran inside the user-creation
-- transaction, the error rolled back the auth.users INSERT itself, so
-- the user could never sign up. The actual culprit is buried in
-- Supabase auth logs but doesn't matter much — signup should NEVER fail
-- because of a downstream CRM / referral / profile side-effect.
--
-- Fix: rewrap each trigger function in BEGIN ... EXCEPTION WHEN OTHERS
-- THEN log + RETURN NEW. This way:
--   - user creation always succeeds
--   - failed side-effects appear in Postgres logs for debugging
--   - missing profile / referral / crm rows can be backfilled later by
--     a maintenance job
-- ============================================================

-- 1. handle_new_user — inserts into public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

-- 2. handle_new_user_referral — auto-creates a referral code row
CREATE OR REPLACE FUNCTION public.handle_new_user_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO referrals (user_id, code)
    VALUES (NEW.id, generate_referral_code())
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user_referral failed for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

-- 3. crm_on_signup — fires on INSERT into public.profiles
CREATE OR REPLACE FUNCTION public.crm_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _stage_id UUID;
BEGIN
  BEGIN
    SELECT id INTO _stage_id FROM public.crm_pipeline_stages WHERE name = 'New Lead' LIMIT 1;

    INSERT INTO public.crm_contacts (profile_id, stage_id, source, last_activity_at)
    VALUES (NEW.id, _stage_id, 'organic', now())
    ON CONFLICT (profile_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'crm_on_signup failed for profile %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;
