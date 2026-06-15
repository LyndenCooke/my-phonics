-- Widen children.current_level to the 8-level reading journey.
--
-- The parent assessment now places children on the journey-8 scale (see
-- src/lib/levels8.ts) and writes that level straight to children.current_level.
-- The original CHECK constraint (BETWEEN 1 AND 6, from the initial schema in
-- 20260318173340) would reject journey levels 7 and 8, so relax it to 1-8.
--
-- Idempotent: safe to re-run. The inline CHECK from the original CREATE TABLE
-- is named children_current_level_check by Postgres.

ALTER TABLE public.children
  DROP CONSTRAINT IF EXISTS children_current_level_check;

ALTER TABLE public.children
  ADD CONSTRAINT children_current_level_check
  CHECK (current_level BETWEEN 1 AND 8);
