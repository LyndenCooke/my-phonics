-- Members-only downloads, £5.99 Premium, £1,000 consultation (2026-10-21).
--
--   * The free plan's weekly allowance (1 book + 5 worksheets) is gone: every
--     download now needs Premium (founding member, paid or admin). Non-members
--     get reason 'premium_only' for books, worksheets and packs alike.
--   * "Premium for life" goes from £4.99 to £5.99.
--   * New product: a 1:1 video consultation with Lynden, £1,000 (one-off).
--
-- Replaces request_download() from 20261021120000_premium_daily_cap.sql;
-- the Premium daily cap is unchanged. Idempotent: safe to re-run.

UPDATE public.products SET price_pence = 599
WHERE product_type = 'premium_lifetime' AND price_pence <> 599;

INSERT INTO public.products (name, description, product_type, price_pence, currency, levels_included, is_active, sort_order)
SELECT '1:1 consultation with Lynden',
       'A private video call with Lynden: your child''s reading assessed and a personal plan of what to read next.',
       'consultation', 100000, 'GBP', '{}', true, 95
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE product_type = 'consultation');

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

  -- Downloads are for members only.
  IF v_reason IS NULL THEN
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

  IF v_reason <> 'admin' THEN
    -- One request at a time per user, so a double-tap can't slip past the cap.
    PERFORM pg_advisory_xact_lock(hashtext('mpb_dl_' || v_uid::text));
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
  END IF;

  INSERT INTO public.download_events (user_id, kind, item) VALUES (v_uid, p_kind, p_item);
  RETURN jsonb_build_object('allowed', true, 'plan', public.mpb_plan_snapshot(v_uid));
END;
$$;
REVOKE ALL ON FUNCTION public.request_download(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_download(text, text) TO authenticated;
