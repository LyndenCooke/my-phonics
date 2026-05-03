-- ============================================================
-- THE bug: user_books.UNIQUE(user_id, book_id) was missing in production.
--
-- Discovered when the founders backfill query
--   ON CONFLICT (user_id, book_id) DO NOTHING
-- failed with 42P10 "no unique or exclusion constraint matching the ON
-- CONFLICT specification".
--
-- The original 20260318 migration declares the constraint inline as
-- `UNIQUE(user_id, book_id)` but it never made it onto the live DB
-- (probably because the table was hand-edited at some point, or the
-- migration ran partially). The Stripe webhook's upsert relies on this
-- constraint — without it, EVERY founders-club book unlock has been
-- silently failing for weeks.
--
-- Idempotent: drop-if-exists then re-add, so this migration is safe to
-- re-run.
-- ============================================================

ALTER TABLE public.user_books
  DROP CONSTRAINT IF EXISTS user_books_user_id_book_id_key;

ALTER TABLE public.user_books
  ADD CONSTRAINT user_books_user_id_book_id_key UNIQUE (user_id, book_id);

-- Backfill any user who has a completed purchase but no user_books rows.
-- Now that the unique constraint exists, ON CONFLICT works.
INSERT INTO public.user_books (user_id, book_id, source, purchase_id)
SELECT p.user_id, b.id,
       CASE WHEN pr.product_type LIKE 'subscription%' THEN 'subscription' ELSE 'purchase' END,
       p.id
FROM public.purchases p
JOIN public.products pr ON pr.id = p.product_id
JOIN public.books b ON (
  pr.product_type LIKE 'subscription%'
  OR b.level = ANY(pr.levels_included)
)
WHERE p.status = 'completed'
ON CONFLICT (user_id, book_id) DO NOTHING;
