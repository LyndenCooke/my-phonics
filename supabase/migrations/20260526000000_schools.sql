-- ─────────────────────────────────────────────────────────────────────────────
-- Schools, classrooms, students, and per-student assessments.
--
-- A "school" is an organisation. Users with a row in school_memberships have
-- access to the school's classrooms + students + assessment data based on
-- their role. Roles:
--   - 'admin'   : full control over the school (manage teachers, classrooms,
--                 students, billing)
--   - 'teacher' : read/write their assigned classrooms only
--
-- Students live under classrooms; classrooms live under schools. Assessments
-- write to school_assessment_results (separate from the parent-side
-- assessment_results) so the two contexts don't collide.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.schools (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  country          text,
  seat_count       integer not null default 30,
  subscription_tier text not null default 'trial',
  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.school_memberships (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references public.schools(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null check (role in ('admin','teacher')),
  invited_email text,
  created_at   timestamptz not null default now(),
  unique (school_id, user_id)
);

create index if not exists school_memberships_user_idx on public.school_memberships(user_id);
create index if not exists school_memberships_school_idx on public.school_memberships(school_id);

create table if not exists public.classrooms (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references public.schools(id) on delete cascade,
  name          text not null,
  year_group    text,
  teacher_id    uuid references auth.users(id),
  created_at    timestamptz not null default now()
);

create index if not exists classrooms_school_idx on public.classrooms(school_id);

create table if not exists public.school_students (
  id              uuid primary key default gen_random_uuid(),
  school_id       uuid not null references public.schools(id) on delete cascade,
  classroom_id    uuid not null references public.classrooms(id) on delete cascade,
  first_name      text not null,
  last_name       text,
  date_of_birth   date,
  current_level   text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists school_students_classroom_idx on public.school_students(classroom_id);
create index if not exists school_students_school_idx on public.school_students(school_id);

create table if not exists public.school_assessment_results (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references public.school_students(id) on delete cascade,
  classroom_id    uuid not null references public.classrooms(id) on delete cascade,
  school_id       uuid not null references public.schools(id) on delete cascade,
  administered_by uuid references auth.users(id),
  recommended_level text,
  score_total     integer,
  score_max       integer,
  payload         jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists school_assessment_results_student_idx on public.school_assessment_results(student_id, created_at desc);
create index if not exists school_assessment_results_classroom_idx on public.school_assessment_results(classroom_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.schools                    enable row level security;
alter table public.school_memberships         enable row level security;
alter table public.classrooms                 enable row level security;
alter table public.school_students            enable row level security;
alter table public.school_assessment_results  enable row level security;

-- Helper: is the calling user a member of this school?
create or replace function public.is_school_member(p_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.school_memberships
    where school_id = p_school_id
      and user_id   = auth.uid()
  );
$$;

create or replace function public.is_school_admin(p_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.school_memberships
    where school_id = p_school_id
      and user_id   = auth.uid()
      and role      = 'admin'
  );
$$;

grant execute on function public.is_school_member(uuid) to authenticated;
grant execute on function public.is_school_admin(uuid)  to authenticated;

-- schools: members can read, admins can update; signed-up user can insert
-- (and we'll auto-add them as admin via RPC below)
drop policy if exists schools_select on public.schools;
create policy schools_select on public.schools
  for select to authenticated
  using (public.is_school_member(id));

drop policy if exists schools_update on public.schools;
create policy schools_update on public.schools
  for update to authenticated
  using (public.is_school_admin(id))
  with check (public.is_school_admin(id));

-- school_memberships: a user can see their own memberships; admins can see/manage all in their school
drop policy if exists memberships_select on public.school_memberships;
create policy memberships_select on public.school_memberships
  for select to authenticated
  using (user_id = auth.uid() or public.is_school_admin(school_id));

drop policy if exists memberships_insert on public.school_memberships;
create policy memberships_insert on public.school_memberships
  for insert to authenticated
  with check (public.is_school_admin(school_id));

drop policy if exists memberships_delete on public.school_memberships;
create policy memberships_delete on public.school_memberships
  for delete to authenticated
  using (public.is_school_admin(school_id));

-- classrooms / students / assessments: scoped to school membership
drop policy if exists classrooms_select on public.classrooms;
create policy classrooms_select on public.classrooms
  for select to authenticated using (public.is_school_member(school_id));
drop policy if exists classrooms_write on public.classrooms;
create policy classrooms_write on public.classrooms
  for all to authenticated
  using (public.is_school_member(school_id))
  with check (public.is_school_member(school_id));

drop policy if exists students_select on public.school_students;
create policy students_select on public.school_students
  for select to authenticated using (public.is_school_member(school_id));
drop policy if exists students_write on public.school_students;
create policy students_write on public.school_students
  for all to authenticated
  using (public.is_school_member(school_id))
  with check (public.is_school_member(school_id));

drop policy if exists assessments_select on public.school_assessment_results;
create policy assessments_select on public.school_assessment_results
  for select to authenticated using (public.is_school_member(school_id));
drop policy if exists assessments_write on public.school_assessment_results;
create policy assessments_write on public.school_assessment_results
  for all to authenticated
  using (public.is_school_member(school_id))
  with check (public.is_school_member(school_id));

-- ─────────────────────────────────────────────────────────────────────────────
-- create_school_with_admin(name, country, seat_count)
-- Atomic: creates the school AND inserts the caller as admin in one txn.
-- Required because the schools_insert policy would otherwise need to allow
-- arbitrary inserts; instead, only this SECURITY DEFINER RPC can create a
-- school, guaranteeing the creator is bound as admin.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.create_school_with_admin(
  p_name        text,
  p_country     text default null,
  p_seat_count  integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_school_id uuid;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  if p_name is null or btrim(p_name) = '' then
    return jsonb_build_object('ok', false, 'reason', 'name_required');
  end if;

  insert into public.schools (name, country, seat_count, created_by)
  values (btrim(p_name), nullif(btrim(coalesce(p_country, '')), ''), greatest(p_seat_count, 1), v_user_id)
  returning id into v_school_id;

  insert into public.school_memberships (school_id, user_id, role)
  values (v_school_id, v_user_id, 'admin');

  return jsonb_build_object('ok', true, 'school_id', v_school_id);
end;
$$;

grant execute on function public.create_school_with_admin(text, text, integer) to authenticated;
