-- Funnel leads table for ad landing pages
create table if not exists public.funnel_leads (
  id uuid primary key default gen_random_uuid(),
  child_name text,
  email text not null,
  source text not null,  -- e.g. 'wrong-books', 'free-assessment', '3-minute-check', 'the-gap'
  created_at timestamptz default now()
);

-- Allow anonymous inserts (funnel visitors aren't logged in)
alter table public.funnel_leads enable row level security;

create policy "Anyone can insert funnel leads"
  on public.funnel_leads
  for insert
  to anon
  with check (true);

-- Only authenticated (admin) can read
create policy "Authenticated users can read funnel leads"
  on public.funnel_leads
  for select
  to authenticated
  using (true);
