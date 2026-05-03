-- ============================================================
-- Self-heal unlock RPC — ensure_my_books_unlocked()
--
-- Bug: Founders Club buyers occasionally see "Ready!" on the payment-
-- success page but their books aren't unlocked. The Stripe webhook
-- creates the purchase row (so hasAnyPaid is true) but for unknown
-- reasons fails to insert all the user_books rows. By the time the
-- user notices, they've left the success page and we're getting
-- support emails.
--
-- This function lets the CLIENT trigger the same unlock the webhook
-- would have done, scoped strictly to the calling user's own completed
-- purchases. It's idempotent (ON CONFLICT DO NOTHING) so calling it
-- repeatedly is safe.
--
-- Returns the number of book rows newly inserted.
-- ============================================================

CREATE OR REPLACE FUNCTION public.ensure_my_books_unlocked()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_purchase RECORD;
  v_levels INTEGER[];
  v_book RECORD;
  v_inserted_count INTEGER := 0;
  v_is_subscription BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Walk every completed purchase the caller owns and ensure the
  -- corresponding books are unlocked. This handles both the "webhook
  -- partly ran" case and the "user has multiple purchases" case.
  FOR v_purchase IN
    SELECT p.id, p.product_id, pr.product_type, pr.levels_included
    FROM purchases p
    JOIN products pr ON pr.id = p.product_id
    WHERE p.user_id = v_user_id
      AND p.status = 'completed'
  LOOP
    v_is_subscription := v_purchase.product_type IN ('subscription', 'subscription_annual');

    IF v_is_subscription THEN
      -- Subscriptions unlock every book in the catalogue
      FOR v_book IN SELECT id FROM books LOOP
        INSERT INTO user_books (user_id, book_id, source, purchase_id)
        VALUES (v_user_id, v_book.id, 'subscription', v_purchase.id)
        ON CONFLICT (user_id, book_id) DO NOTHING;
        IF FOUND THEN v_inserted_count := v_inserted_count + 1; END IF;
      END LOOP;
    ELSIF v_purchase.levels_included IS NOT NULL AND array_length(v_purchase.levels_included, 1) > 0 THEN
      -- One-time purchase (founders_club, full_bundle, free_sample, level_pack)
      FOR v_book IN
        SELECT id FROM books WHERE level = ANY(v_purchase.levels_included)
      LOOP
        INSERT INTO user_books (user_id, book_id, source, purchase_id)
        VALUES (v_user_id, v_book.id, 'purchase', v_purchase.id)
        ON CONFLICT (user_id, book_id) DO NOTHING;
        IF FOUND THEN v_inserted_count := v_inserted_count + 1; END IF;
      END LOOP;
    END IF;
  END LOOP;

  RETURN v_inserted_count;
END;
$$;

-- Lock down: only authenticated users, only callable for the calling
-- user's own purchases (enforced by auth.uid() inside the function).
REVOKE ALL ON FUNCTION public.ensure_my_books_unlocked() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_my_books_unlocked() TO authenticated;
