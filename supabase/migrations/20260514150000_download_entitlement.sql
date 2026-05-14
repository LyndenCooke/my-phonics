-- Download entitlement function. Determines whether a user can download a
-- specific book right now, based on their tier and recent download history.
--
-- Tiers:
--   bundle  — full_bundle, founders_club, or subscription_annual  → unlimited
--   monthly — active subscription                                   → 1 new book / 7 days
--   free    — no paid product                                        → 1 download lifetime
--
-- A "new book" download means a book_id this user has never downloaded before.
-- Re-downloading the same book (e.g. A4 after already grabbing A5) is always
-- free and uncounted — fair to the parent, keeps the throttle on *new* books only.
--
-- Returns JSON:
--   { allowed: bool, tier: text, reason?: text, cooldown_until?: timestamptz, message?: text }

CREATE OR REPLACE FUNCTION public.check_download_entitlement(
  p_user_id uuid,
  p_book_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier text := 'free';
  v_already_downloaded boolean;
  v_distinct_in_window int;
  v_cooldown_until timestamptz;
  v_total_distinct int;
BEGIN
  -- Has this user ever downloaded this exact book? Same-book re-downloads
  -- (e.g. A4 after A5) are always free — no double-counting.
  SELECT EXISTS(
    SELECT 1 FROM public.download_log
    WHERE user_id = p_user_id AND book_id = p_book_id
  ) INTO v_already_downloaded;

  -- Tier detection — bundle wins over monthly wins over free.
  IF EXISTS (
    SELECT 1 FROM public.purchases p
    JOIN public.products pr ON pr.id = p.product_id
    WHERE p.user_id = p_user_id
      AND p.status = 'completed'
      AND pr.product_type IN ('full_bundle', 'founders_club', 'subscription_annual')
  ) THEN
    v_tier := 'bundle';
  ELSIF EXISTS (
    SELECT 1 FROM public.purchases p
    JOIN public.products pr ON pr.id = p.product_id
    WHERE p.user_id = p_user_id
      AND p.status = 'completed'
      AND pr.product_type = 'subscription'
  ) THEN
    v_tier := 'monthly';
  END IF;

  -- Bundle: always allowed.
  IF v_tier = 'bundle' THEN
    RETURN jsonb_build_object('allowed', true, 'tier', v_tier);
  END IF;

  -- Re-downloading an already-owned book is always allowed for any tier.
  IF v_already_downloaded THEN
    RETURN jsonb_build_object('allowed', true, 'tier', v_tier, 'reason', 'already_owned');
  END IF;

  -- Monthly: 1 distinct new book per rolling 7 days.
  IF v_tier = 'monthly' THEN
    SELECT COUNT(DISTINCT book_id)
      FROM public.download_log
      WHERE user_id = p_user_id
        AND downloaded_at > now() - interval '7 days'
      INTO v_distinct_in_window;

    IF v_distinct_in_window < 1 THEN
      RETURN jsonb_build_object('allowed', true, 'tier', v_tier);
    END IF;

    SELECT MIN(downloaded_at) + interval '7 days'
      FROM public.download_log
      WHERE user_id = p_user_id
        AND downloaded_at > now() - interval '7 days'
      INTO v_cooldown_until;

    RETURN jsonb_build_object(
      'allowed', false,
      'tier', v_tier,
      'reason', 'weekly_limit_reached',
      'cooldown_until', v_cooldown_until,
      'message', 'Monthly subscribers can download one new book per week.'
    );
  END IF;

  -- Free: 1 distinct book lifetime.
  SELECT COUNT(DISTINCT book_id)
    FROM public.download_log
    WHERE user_id = p_user_id
    INTO v_total_distinct;

  IF v_total_distinct < 1 THEN
    RETURN jsonb_build_object('allowed', true, 'tier', v_tier);
  END IF;

  RETURN jsonb_build_object(
    'allowed', false,
    'tier', v_tier,
    'reason', 'free_limit_reached',
    'message', 'Free accounts get one book download. Upgrade to read more.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_download_entitlement(uuid, uuid) TO authenticated;

CREATE INDEX IF NOT EXISTS idx_download_log_user_time ON public.download_log(user_id, downloaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_download_log_user_book ON public.download_log(user_id, book_id);
