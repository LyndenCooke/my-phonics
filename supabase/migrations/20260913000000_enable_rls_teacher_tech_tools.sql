-- teacher_tech_tools had RLS disabled, so anyone holding the public key could
-- read or write every row. Nothing in the app references the table and it is
-- empty. Enable RLS with no policies: service-role only until it is needed.
-- Applied to production on 2026-09-13.
ALTER TABLE public.teacher_tech_tools ENABLE ROW LEVEL SECURITY;
