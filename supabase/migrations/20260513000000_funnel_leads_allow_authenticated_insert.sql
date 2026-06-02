-- The original policy only granted INSERT to `anon`. Because the supabase
-- client persists sessions in localStorage, any visitor who has previously
-- signed up / signed in arrives at the funnel with `authenticated` role and
-- the policy does not apply — every submit failed with
-- "new row violates row-level security policy".
drop policy if exists "Anyone can insert funnel leads" on public.funnel_leads;

create policy "Anyone can insert funnel leads"
  on public.funnel_leads
  for insert
  to anon, authenticated
  with check (true);
