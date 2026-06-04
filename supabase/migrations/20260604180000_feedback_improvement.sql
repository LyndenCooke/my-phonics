-- ============================================================
-- Split feedback into praise vs. improvement.
--
-- The feedback dialog now has two boxes: "What did you love?" and
-- "What could be better?". The existing `reviews.feedback` column holds
-- the praise (the featurable testimonial text); this adds `improvement`
-- for the private "could be better" text, which is NEVER shown publicly
-- even when consent_marketing is given.
-- ============================================================

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS improvement TEXT;
