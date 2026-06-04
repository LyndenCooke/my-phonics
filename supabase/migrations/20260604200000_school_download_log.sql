-- ============================================================
-- School resource download logging.
--
-- The consumer `download_log` is keyed by `book_id` (uuid), which doesn't
-- fit school resources (worksheets / sound books use string keys like
-- '1_1', '3_2'). This table records every school PDF download, written
-- server-side by the `school-download` edge function (service role) after
-- it verifies the caller's school membership and mints a signed URL.
-- ============================================================

create table if not exists public.school_download_log (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  resource_type text not null,          -- 'storybook' | 'worksheet_pack' | 'sound_book'
  resource_key text not null,           -- e.g. '1_1', '3_2'
  format text,                          -- 'a4' | 'a5' | null
  downloaded_at timestamptz not null default now()
);

alter table public.school_download_log enable row level security;

-- Rows are inserted server-side via the service role (bypasses RLS). These
-- policies only govern reads.
drop policy if exists "Admins read school download log" on public.school_download_log;
create policy "Admins read school download log" on public.school_download_log
  for select using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Members read own school download log" on public.school_download_log;
create policy "Members read own school download log" on public.school_download_log
  for select using (
    exists (
      select 1 from public.school_memberships m
      where m.school_id = school_download_log.school_id
        and m.user_id = auth.uid()
    )
  );

create index if not exists idx_school_download_log_school
  on public.school_download_log (school_id, downloaded_at desc);
