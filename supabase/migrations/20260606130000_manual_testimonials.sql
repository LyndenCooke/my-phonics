-- ============================================================
-- Manual testimonials — quotes that didn't come through in-app feedback
-- (e.g. an email, a TPT review, a tweet). Admin-managed; unioned into the
-- public testimonials wall alongside featured in-app reviews.
-- ============================================================

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  author_name text,
  rating int not null default 5,
  featured boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.testimonials enable row level security;

drop policy if exists "Public read featured testimonials" on public.testimonials;
create policy "Public read featured testimonials" on public.testimonials
  for select using (featured = true);

drop policy if exists "Admins manage testimonials" on public.testimonials;
create policy "Admins manage testimonials" on public.testimonials
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Public wall = featured+consented in-app reviews UNION featured manual quotes.
create or replace view public.public_testimonials as
select
  r.id, r.rating, r.feedback as quote,
  case when r.consent_named then nullif(split_part(coalesce(p.full_name, ''), ' ', 1), '') end as first_name,
  r.submitted_at
from public.reviews r
left join public.profiles p on p.id = r.user_id
where r.featured = true and r.consent_marketing = true and r.feedback is not null and r.submitted_at is not null
union all
select t.id, t.rating, t.quote, nullif(t.author_name, '') as first_name, t.created_at as submitted_at
from public.testimonials t
where t.featured = true;

grant select on public.public_testimonials to anon, authenticated;
