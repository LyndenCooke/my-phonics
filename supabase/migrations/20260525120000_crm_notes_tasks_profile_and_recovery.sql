-- Pivot notes/tasks to attach directly to profiles (the actual customer
-- identity) and optionally to a specific purchase. The legacy contact_id
-- referenced crm_contacts.id which the new derived pipeline doesn't write
-- to — so notes silently broke. Adding profile_id as the canonical link
-- and relaxing the FK on contact_id to nullable lets both old + new code
-- paths coexist while we migrate consumers.

ALTER TABLE public.crm_notes
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE;

ALTER TABLE public.crm_tasks
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Recovery-queue lifecycle: a purchase that's been manually dismissed
-- (we gave up / customer responded out-of-band) won't show in the queue.
-- Marked-recovered is also possible (paid via bank transfer, etc.).
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS dismissed_from_recovery_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dismissed_from_recovery_reason TEXT;

CREATE INDEX IF NOT EXISTS crm_notes_profile_id_idx ON public.crm_notes (profile_id) WHERE profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS crm_notes_purchase_id_idx ON public.crm_notes (purchase_id) WHERE purchase_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS crm_tasks_profile_id_idx ON public.crm_tasks (profile_id) WHERE profile_id IS NOT NULL;

ALTER TABLE public.crm_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins manage notes" ON public.crm_notes;
CREATE POLICY "admins manage notes" ON public.crm_notes
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins manage tasks" ON public.crm_tasks;
CREATE POLICY "admins manage tasks" ON public.crm_tasks
  FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
