-- Attendance/register + multi-teacher join codes for the school product.

-- ── Attendance ──────────────────────────────────────────────────────────────
-- One row per child per lesson per day. Register can be taken against a phonics
-- group (group_level set) or a classroom (classroom_id set); `lesson` labels the
-- session so a group register and a class register on the same day don't clash.
create table if not exists public.attendance (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references public.schools(id) on delete cascade,
  student_id    uuid not null references public.school_students(id) on delete cascade,
  session_date  date not null,
  lesson        text not null default 'Phonics',
  context_type  text not null default 'group' check (context_type in ('group','class')),
  group_level   integer,
  classroom_id  uuid references public.classrooms(id) on delete set null,
  status        text not null check (status in ('present','absent','late')),
  recorded_by   uuid references auth.users(id),
  note          text,
  created_at    timestamptz not null default now(),
  unique (student_id, session_date, lesson)
);

create index if not exists attendance_school_date_idx on public.attendance(school_id, session_date desc);
create index if not exists attendance_student_idx on public.attendance(student_id, session_date desc);

alter table public.attendance enable row level security;

drop policy if exists attendance_select on public.attendance;
create policy attendance_select on public.attendance
  for select to authenticated using (public.is_school_member(school_id));
drop policy if exists attendance_write on public.attendance;
create policy attendance_write on public.attendance
  for all to authenticated
  using (public.is_school_member(school_id))
  with check (public.is_school_member(school_id));

-- ── Join codes + academic year on schools ────────────────────────────────────
alter table public.schools add column if not exists join_code text;
alter table public.schools add column if not exists academic_year text;

-- unique join code (case-insensitive via stored upper-case)
create unique index if not exists schools_join_code_idx on public.schools(join_code);

-- backfill codes for any existing schools
update public.schools
  set join_code = upper(substr(md5(random()::text || id::text), 1, 6))
  where join_code is null;

-- ── RPCs ──────────────────────────────────────────────────────────────────────
-- Recreate create_school_with_admin to also mint a unique join code.
create or replace function public.create_school_with_admin(
  p_name        text,
  p_country     text default null,
  p_seat_count  integer default 30
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := auth.uid();
  v_school_id uuid;
  v_code text;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;
  if p_name is null or btrim(p_name) = '' then
    return jsonb_build_object('ok', false, 'reason', 'name_required');
  end if;

  -- mint a unique 6-char join code
  loop
    v_code := upper(substr(md5(random()::text), 1, 6));
    exit when not exists (select 1 from public.schools where join_code = v_code);
  end loop;

  insert into public.schools (name, country, seat_count, created_by, join_code)
  values (btrim(p_name), nullif(btrim(coalesce(p_country, '')), ''), greatest(p_seat_count, 1), v_user_id, v_code)
  returning id into v_school_id;

  insert into public.school_memberships (school_id, user_id, role)
  values (v_school_id, v_user_id, 'admin');

  return jsonb_build_object('ok', true, 'school_id', v_school_id, 'join_code', v_code);
end;
$$;
grant execute on function public.create_school_with_admin(text, text, integer) to authenticated;

-- Teacher joins an existing school with its code.
create or replace function public.join_school_with_code(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_school uuid;
  v_name text;
begin
  if v_user is null then return jsonb_build_object('ok', false, 'reason', 'not_authenticated'); end if;
  select id, name into v_school, v_name from public.schools where join_code = upper(btrim(p_code));
  if v_school is null then return jsonb_build_object('ok', false, 'reason', 'invalid_code'); end if;

  insert into public.school_memberships (school_id, user_id, role)
  values (v_school, v_user, 'teacher')
  on conflict (school_id, user_id) do nothing;

  return jsonb_build_object('ok', true, 'school_id', v_school, 'school_name', v_name);
end;
$$;
grant execute on function public.join_school_with_code(text) to authenticated;

-- Admin can regenerate the join code.
create or replace function public.regenerate_join_code(p_school_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_code text;
begin
  if not public.is_school_admin(p_school_id) then
    return jsonb_build_object('ok', false, 'reason', 'not_admin');
  end if;
  loop
    v_code := upper(substr(md5(random()::text), 1, 6));
    exit when not exists (select 1 from public.schools where join_code = v_code);
  end loop;
  update public.schools set join_code = v_code, updated_at = now() where id = p_school_id;
  return jsonb_build_object('ok', true, 'join_code', v_code);
end;
$$;
grant execute on function public.regenerate_join_code(uuid) to authenticated;
