-- Premium daily cap + heavy-downloader flags (2026-10-21).
--
-- Premium (founding members and paid) was uncapped, so a brand-new founding
-- account could take the whole library in one sitting. Premium now gets a
-- generous daily allowance of NEW items per rolling 24 hours:
--   books 3 · worksheets 20 · whole packs 3
-- Re-downloading anything taken in the last 7 days stays free. Admins are
-- uncapped. Reading online is untouched (not a download).
--
-- Every time a premium account hits the cap it is written to
-- download_flags (once per account, kind and day), and heavy_downloaders
-- lists the busiest accounts of the last 7 days for the admin.
--
-- Replaces request_download() and mpb_plan_snapshot() from
-- 20261005120000_premium_founding_500.sql. Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS public.download_flags (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind        text NOT NULL,
  used_24h    integer NOT NULL,
  flagged_on  date NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/London')::date,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, flagged_on)
);
ALTER TABLE public.download_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can see download flags" ON public.download_flags;
CREATE POLICY "Admins can see download flags" ON public.download_flags
  FOR SELECT USING (public.has_role((SELECT auth.uid()), 'admin'));

-- Daily allowance of new items for premium accounts.
CREATE OR REPLACE FUNCTION public.mpb_premium_daily_cap(p_kind text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_kind WHEN 'book' THEN 3 WHEN 'worksheet' THEN 20 ELSE 3 END;
$$;
REVOKE ALL ON FUNCTION public.mpb_premium_daily_cap(text) FROM PUBLIC, anon, authenticated;

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
  v_books_day integer;
  v_sheets_day integer;
BEGIN
  SELECT member_number INTO v_num FROM public.founding_members WHERE user_id = p_user_id;
  SELECT COUNT(DISTINCT item) FILTER (WHERE kind = 'book'),
         COUNT(DISTINCT item) FILTER (WHERE kind = 'worksheet'),
         COUNT(DISTINCT item) FILTER (WHERE kind = 'book' AND created_at > now() - interval '24 hours'),
         COUNT(DISTINCT item) FILTER (WHERE kind = 'worksheet' AND created_at > now() - interval '24 hours')
    INTO v_books, v_sheets, v_books_day, v_sheets_day
  FROM public.download_events
  WHERE user_id = p_user_id AND created_at > now() - interval '7 days';

  RETURN jsonb_build_object(
    'plan', CASE WHEN v_reason IS NULL THEN 'free' ELSE 'premium' END,
    'premium_reason', v_reason,
    'founding_number', v_num,
    'limits', jsonb_build_object('books', 1, 'worksheets', 5),
    'used', jsonb_build_object('books', v_books, 'worksheets', v_sheets),
    'daily_limits', jsonb_build_object(
      'books', public.mpb_premium_daily_cap('book'),
      'worksheets', public.mpb_premium_daily_cap('worksheet'),
      'packs', public.mpb_premium_daily_cap('worksheet_pack')),
    'used_today', jsonb_build_object('books', v_books_day, 'worksheets', v_sheets_day),
    'spots', public.mpb_founding_spots()
  );
END;
$$;
REVOKE ALL ON FUNCTION public.mpb_plan_snapshot(uuid) FROM PUBLIC, anon, authenticated;

-- Ask to download one item. Logs it and answers { allowed: true } or
-- { allowed: false, reason: 'sign_in' | 'limit' | 'premium_only' | 'daily_cap', next_at }.
CREATE OR REPLACE FUNCTION public.request_download(p_kind text, p_item text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_reason text;
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
  v_reason := public.mpb_premium_reason(v_uid);

  IF p_kind = 'worksheet_pack' AND v_reason IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'premium_only',
                              'plan', public.mpb_plan_snapshot(v_uid));
  END IF;

  -- Taking the same thing again inside a week is always free.
  IF EXISTS (
    SELECT 1 FROM public.download_events
    WHERE user_id = v_uid AND kind = p_kind AND item = p_item
      AND created_at > now() - interval '7 days'
  ) THEN
    RETURN jsonb_build_object('allowed', true, 'plan', public.mpb_plan_snapshot(v_uid));
  END IF;

  IF v_reason = 'admin' THEN
    INSERT INTO public.download_events (user_id, kind, item) VALUES (v_uid, p_kind, p_item);
    RETURN jsonb_build_object('allowed', true, 'plan', public.mpb_plan_snapshot(v_uid));
  END IF;

  -- One request at a time per user, so a double-tap can't slip past a cap.
  PERFORM pg_advisory_xact_lock(hashtext('mpb_dl_' || v_uid::text));

  IF v_reason IS NOT NULL THEN
    -- Premium: daily allowance of new items.
    v_limit := public.mpb_premium_daily_cap(p_kind);
    SELECT COUNT(DISTINCT item), MIN(created_at) + interval '24 hours'
      INTO v_used, v_next
    FROM public.download_events
    WHERE user_id = v_uid AND kind = p_kind AND created_at > now() - interval '24 hours';

    IF v_used >= v_limit THEN
      INSERT INTO public.download_flags (user_id, kind, used_24h)
      VALUES (v_uid, p_kind, v_used)
      ON CONFLICT (user_id, kind, flagged_on) DO UPDATE SET used_24h = EXCLUDED.used_24h;
      RETURN jsonb_build_object('allowed', false, 'reason', 'daily_cap', 'next_at', v_next,
                                'plan', public.mpb_plan_snapshot(v_uid));
    END IF;
  ELSE
    -- Free plan: weekly allowance.
    v_limit := CASE p_kind WHEN 'book' THEN 1 ELSE 5 END;
    SELECT COUNT(DISTINCT item), MIN(created_at) + interval '7 days'
      INTO v_used, v_next
    FROM public.download_events
    WHERE user_id = v_uid AND kind = p_kind AND created_at > now() - interval '7 days';

    IF v_used >= v_limit THEN
      RETURN jsonb_build_object('allowed', false, 'reason', 'limit', 'next_at', v_next,
                                'plan', public.mpb_plan_snapshot(v_uid));
    END IF;
  END IF;

  INSERT INTO public.download_events (user_id, kind, item) VALUES (v_uid, p_kind, p_item);
  RETURN jsonb_build_object('allowed', true, 'plan', public.mpb_plan_snapshot(v_uid));
END;
$$;
REVOKE ALL ON FUNCTION public.request_download(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_download(text, text) TO authenticated;

-- The busiest downloaders of the last 7 days, for the admin. Not exposed to
-- the API (no grant); read it from the SQL editor or the service role.
CREATE OR REPLACE VIEW public.heavy_downloaders AS
SELECT e.user_id,
       u.email,
       fm.member_number AS founding_number,
       COUNT(DISTINCT e.item) FILTER (WHERE e.kind = 'book')           AS books_7d,
       COUNT(DISTINCT e.item) FILTER (WHERE e.kind = 'worksheet')      AS worksheets_7d,
       COUNT(DISTINCT e.item) FILTER (WHERE e.kind = 'worksheet_pack') AS packs_7d,
       (SELECT COUNT(*) FROM public.download_flags f
         WHERE f.user_id = e.user_id AND f.created_at > now() - interval '7 days') AS cap_hits_7d,
       u.created_at AS signed_up_at,
       MAX(e.created_at) AS last_download_at
FROM public.download_events e
JOIN auth.users u ON u.id = e.user_id
LEFT JOIN public.founding_members fm ON fm.user_id = e.user_id
WHERE e.created_at > now() - interval '7 days'
GROUP BY e.user_id, u.email, fm.member_number, u.created_at
ORDER BY books_7d DESC, worksheets_7d DESC;
REVOKE ALL ON public.heavy_downloaders FROM PUBLIC, anon, authenticated;
