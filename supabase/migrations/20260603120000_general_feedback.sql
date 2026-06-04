-- ============================================================
-- General feedback / testimonials.
--
-- Re-uses the existing `reviews` table (rating, feedback,
-- consent_marketing, consent_named) which previously only held the
-- auto-scheduled Founders 24h/1-week prompts. We now let any signed-in
-- parent submit ad-hoc `kind='general'` feedback from:
--   - the "Share your feedback" card in their Profile, and
--   - a one-time returning-user pop-up.
--
-- Each submission is mirrored to the GHL CRM (note + triage tags) by the
-- ghl-sync edge function so feedback can be turned into website
-- testimonials (consent_marketing/consent_named) or actioned as an issue.
-- ============================================================

-- Where the feedback came from ('profile', 'returning_popup', …) so the
-- CRM and admin can tell solicited pop-up feedback from volunteered.
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS source TEXT;

-- Parents can create their OWN general feedback rows. Founders prompts are
-- still seeded by trigger (SECURITY DEFINER) and only updated by the user,
-- so this INSERT path is deliberately scoped to kind='general'.
DROP POLICY IF EXISTS "Users insert own general reviews" ON public.reviews;
CREATE POLICY "Users insert own general reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id AND kind = 'general');

-- Admins can read every review so the in-app CRM (CustomerDetail →
-- Feedback tab) can surface ratings + testimonials per customer.
DROP POLICY IF EXISTS "Admins read all reviews" ON public.reviews;
CREATE POLICY "Admins read all reviews" ON public.reviews
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Fast lookup of a customer's submitted feedback for the admin detail view.
CREATE INDEX IF NOT EXISTS idx_reviews_user_submitted
  ON public.reviews (user_id, submitted_at DESC)
  WHERE submitted_at IS NOT NULL;
