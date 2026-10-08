-- Premium + founding members (2026-10-05).
--
-- Plans:
--   free     — 1 book and 5 worksheets per rolling 7 days (signed-in account)
--   premium  — unlimited downloads, including whole-pack worksheet PDFs
--
-- Who is premium:
--   * a founding member — the first 500 accounts get Premium for life, free
--   * anyone with a completed paid plan (lifetime / founders club / the new
--     "Premium for life" product / a subscription that is not cancelled)
--   * admins
--
-- Founding spots are claimed lazily by get_download_plan() the first time a
-- signed-in account loads the app (never by a trigger on auth.users, so a
-- bug here can never block a sign-up). Spots are numbered 1..500 and never
-- recycled, so the public tally only ever goes up.
--
-- Idempotent: safe to re-run.

-- ── Tables ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.founding_members (
  user_id       uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  member_number integer NOT NULL UNIQUE CHECK (member_number BETWEEN 1 AND 500),
  claimed_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.founding_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can see own founding spot" ON public.founding_members;
CREATE POLICY "Members can see own founding spot" ON public.founding_members
  FOR SELECT USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Admins can see founding members" ON public.founding_members;
CREATE POLICY "Admins can see founding members" ON public.founding_members
  FOR SELECT USING (public.has_role((SELECT auth.uid()), 'admin'));

-- One row per NEW item a user downloads (re-downloads of the same item inside
-- the window are not re-logged). Written only by request_download().
CREATE TABLE IF NOT EXISTS public.download_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN ('book', 'worksheet', 'worksheet_pack')),
  item       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS download_events_user_kind_created_idx
  ON public.download_events (user_id, kind, created_at DESC);
ALTER TABLE public.download_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see own download events" ON public.download_events;
CREATE POLICY "Users can see own download events" ON public.download_events
  FOR SELECT USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Admins can see download events" ON public.download_events;
CREATE POLICY "Admins can see download events" ON public.download_events
  FOR SELECT USING (public.has_role((SELECT auth.uid()), 'admin'));

-- ── Backfill: every existing account is a founding member, oldest first ───
INSERT INTO public.founding_members (user_id, member_number, claimed_at)
SELECT u.id, n.rn, now()
FROM (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS rn
  FROM auth.users
) n
JOIN auth.users u ON u.id = n.id
WHERE n.rn <= 500
  AND NOT EXISTS (SELECT 1 FROM public.founding_members)
ON CONFLICT DO NOTHING;

-- ── "Premium for life" product (£4.99 one-off, sold once the 500 are gone) ─
-- Checkout builds the Stripe line item inline from price_pence, so no Stripe
-- Price has to exist. levels_included is empty: the webhook's per-level
-- unlock is a no-op, premium is derived from the completed purchase row.
INSERT INTO public.products (name, description, product_type, price_pence, currency, levels_included, is_active, sort_order)
SELECT 'Premium for life',
       'Unlimited book and worksheet downloads, for good. One payment, no subscription.',
       'premium_lifetime', 499, 'GBP', '{}', true, 90
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE product_type = 'premium_lifetime');

-- ── Internal helpers (not callable from the API) ──────────────────────────
CREATE OR REPLACE FUNCTION public.mpb_claim_founding_spot(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_num integer;
  v_max integer;
BEGIN
  SELECT member_number INTO v_num FROM public.founding_members WHERE user_id = p_user_id;
  IF v_num IS NOT NULL THEN
    RETURN v_num;
  END IF;

  -- Serialise claims so two sign-ups can never take the same number.
  PERFORM pg_advisory_xact_lock(hashtext('mpb_founding_members'));
  SELECT member_number INTO v_num FROM public.founding_members WHERE user_id = p_user_id;
  IF v_num IS NOT NULL THEN
    RETURN v_num;
  END IF;
  SELECT COALESCE(MAX(member_number), 0) INTO v_max FROM public.founding_members;
  IF v_max >= 500 THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.founding_members (user_id, member_number)
  VALUES (p_user_id, v_max + 1);
  RETURN v_max + 1;
END;
$$;

-- 'founding' | 'paid' | 'admin' | NULL (free plan).
CREATE OR REPLACE FUNCTION public.mpb_premium_reason(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.founding_members WHERE user_id = p_user_id) THEN
    RETURN 'founding';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.purchases p
    JOIN public.products pr ON pr.id = p.product_id
    WHERE p.user_id = p_user_id
      AND p.status = 'completed'
      AND (
        pr.product_type IN ('premium_lifetime', 'full_bundle', 'founders_club')
        OR (pr.product_type IN ('subscription', 'subscription_annual')
            AND p.subscription_state IS DISTINCT FROM 'cancelled')
      )
  ) THEN
    RETURN 'paid';
  END IF;
  IF public.has_role(p_user_id, 'admin') THEN
    RETURN 'admin';
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.mpb_founding_spots()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total', 500,
    'claimed', COALESCE(MAX(member_number), 0),
    'remaining', 500 - COALESCE(MAX(member_number), 0)
  )
  FROM public.founding_members;
$$;

CREATE OR REPLACE FUNCTION public.mpb_plan_snapshot(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reason text := public.mpb_premium_reason(p_user_id);
  v_num integer;
  v_books integer;
  v_sheets integer;
BEGIN
  SELECT member_number INTO v_num FROM public.founding_members WHERE user_id = p_user_id;
  SELECT COUNT(DISTINCT item) FILTER (WHERE kind = 'book'),
         COUNT(DISTINCT item) FILTER (WHERE kind = 'worksheet')
    INTO v_books, v_sheets
  FROM public.download_events
  WHERE user_id = p_user_id AND created_at > now() - interval '7 days';

  RETURN jsonb_build_object(
    'plan', CASE WHEN v_reason IS NULL THEN 'free' ELSE 'premium' END,
    'premium_reason', v_reason,
    'founding_number', v_num,
    'limits', jsonb_build_object('books', 1, 'worksheets', 5),
    'used', jsonb_build_object('books', v_books, 'worksheets', v_sheets),
    'spots', public.mpb_founding_spots()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.mpb_claim_founding_spot(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mpb_premium_reason(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mpb_founding_spots() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mpb_plan_snapshot(uuid) FROM PUBLIC, anon, authenticated;

-- ── Public API ────────────────────────────────────────────────────────────
-- The tally on the website: { total, claimed, remaining }. Anyone may read it.
CREATE OR REPLACE FUNCTION public.founding_spots()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.mpb_founding_spots();
$$;

-- The signed-in account's plan. Claims a founding spot on first call while
-- any are left; `just_claimed` is true on exactly that call.
CREATE OR REPLACE FUNCTION public.get_download_plan()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_had boolean;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('plan', 'guest', 'spots', public.mpb_founding_spots());
  END IF;
  SELECT EXISTS (SELECT 1 FROM public.founding_members WHERE user_id = v_uid) INTO v_had;
  IF NOT v_had THEN
    PERFORM public.mpb_claim_founding_spot(v_uid);
  END IF;
  RETURN public.mpb_plan_snapshot(v_uid)
    || jsonb_build_object(
         'just_claimed',
         NOT v_had AND EXISTS (SELECT 1 FROM public.founding_members WHERE user_id = v_uid)
       );
END;
$$;

-- Ask to download one item. Logs it and answers { allowed: true } or
-- { allowed: false, reason: 'sign_in' | 'limit' | 'premium_only', next_at }.
--   p_kind: 'book' | 'worksheet' | 'worksheet_pack'
--   p_item: a stable id for the thing (book id / worksheet path)
-- Re-downloading something already taken in the last 7 days is always free.
CREATE OR REPLACE FUNCTION public.request_download(p_kind text, p_item text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_limit integer;
  v_used integer;
  v_next timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'sign_in');
  END IF;
  IF p_kind NOT IN ('book', 'worksheet', 'worksheet_pack')
     OR p_item IS NULL OR length(p_item) = 0 OR length(p_item) > 400 THEN
    RAISE EXCEPTION 'invalid download request';
  END IF;

  PERFORM public.mpb_claim_founding_spot(v_uid);

  IF public.mpb_premium_reason(v_uid) IS NOT NULL THEN
    INSERT INTO public.download_events (user_id, kind, item) VALUES (v_uid, p_kind, p_item);
    RETURN jsonb_build_object('allowed', true, 'plan', public.mpb_plan_snapshot(v_uid));
  END IF;

  -- Free plan from here on.
  IF p_kind = 'worksheet_pack' THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'premium_only',
                              'plan', public.mpb_plan_snapshot(v_uid));
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.download_events
    WHERE user_id = v_uid AND kind = p_kind AND item = p_item
      AND created_at > now() - interval '7 days'
  ) THEN
    RETURN jsonb_build_object('allowed', true, 'plan', public.mpb_plan_snapshot(v_uid));
  END IF;

  -- One request at a time per user, so a double-tap can't slip past the cap.
  PERFORM pg_advisory_xact_lock(hashtext('mpb_dl_' || v_uid::text));
  v_limit := CASE p_kind WHEN 'book' THEN 1 ELSE 5 END;
  SELECT COUNT(DISTINCT item), MIN(created_at) + interval '7 days'
    INTO v_used, v_next
  FROM public.download_events
  WHERE user_id = v_uid AND kind = p_kind AND created_at > now() - interval '7 days';

  IF v_used >= v_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'limit', 'next_at', v_next,
                              'plan', public.mpb_plan_snapshot(v_uid));
  END IF;

  INSERT INTO public.download_events (user_id, kind, item) VALUES (v_uid, p_kind, p_item);
  RETURN jsonb_build_object('allowed', true, 'plan', public.mpb_plan_snapshot(v_uid));
END;
$$;

REVOKE ALL ON FUNCTION public.founding_spots() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_download_plan() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.request_download(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.founding_spots() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_download_plan() TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_download(text, text) TO authenticated;
