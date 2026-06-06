-- ============================================================
-- Let admins delete reviews/testimonials from the CRM.
-- Reads + the featured-update policy already exist; this adds DELETE so
-- the in-app Feedback page can remove spam, test rows or retired quotes.
-- ============================================================

DROP POLICY IF EXISTS "Admins delete reviews" ON public.reviews;
CREATE POLICY "Admins delete reviews" ON public.reviews
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
