-- ============================================================
-- Public testimonials wall.
--
-- Parents leave consented feedback (reviews.consent_marketing). An admin
-- promotes the genuine ones with `featured = true` from the CRM. Only
-- featured + consented rows are exposed publicly, via a view that shows
-- the quote + (optionally) the parent's first name — never email, never
-- the private "improvement" text.
-- ============================================================

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;

-- Admins flip `featured`. (They can already read all reviews; this lets
-- them update the flag from the CRM Feedback page.)
DROP POLICY IF EXISTS "Admins update reviews" ON public.reviews;
CREATE POLICY "Admins update reviews" ON public.reviews
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public, read-only projection. Runs with the view owner's rights so the
-- anon role can read it, but the WHERE clause restricts it to featured,
-- consented rows and the SELECT list restricts it to safe columns only.
CREATE OR REPLACE VIEW public.public_testimonials AS
SELECT
  r.id,
  r.rating,
  r.feedback AS quote,
  CASE WHEN r.consent_named THEN NULLIF(split_part(coalesce(p.full_name, ''), ' ', 1), '') END AS first_name,
  r.submitted_at
FROM public.reviews r
LEFT JOIN public.profiles p ON p.id = r.user_id
WHERE r.featured = true
  AND r.consent_marketing = true
  AND r.feedback IS NOT NULL
  AND r.submitted_at IS NOT NULL;

GRANT SELECT ON public.public_testimonials TO anon, authenticated;
