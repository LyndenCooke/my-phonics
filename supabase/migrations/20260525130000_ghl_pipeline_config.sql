-- GHL pipeline + stage IDs are discovered (or created) on first sync and
-- cached here so the edge function self-bootstraps without env-var churn.
-- Keys are stable strings: 'pipeline_id', 'stage:New Lead', 'stage:Assessed',
-- etc. Service role writes; nothing reads from the client.
CREATE TABLE IF NOT EXISTS public.ghl_pipeline_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ghl_pipeline_config ENABLE ROW LEVEL SECURITY;

-- Only admins can read this from the client (it's effectively system config).
DROP POLICY IF EXISTS "admins read ghl config" ON public.ghl_pipeline_config;
CREATE POLICY "admins read ghl config" ON public.ghl_pipeline_config
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );
