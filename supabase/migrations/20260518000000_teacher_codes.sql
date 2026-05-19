create table if not exists public.teacher_codes (
  code         text         primary key,
  label        text         not null,
  is_active    boolean      not null default true,
  expires_at   timestamptz,
  notes        text,
  created_at   timestamptz  not null default now()
);

create table if not exists public.teacher_redemptions (
  session_token  uuid         primary key default gen_random_uuid(),
  code           text         not null references public.teacher_codes(code),
  user_agent     text,
  ip_hash        text,
  created_at     timestamptz  not null default now(),
  last_seen_at   timestamptz  not null default now()
);

create index if not exists teacher_redemptions_code_idx
  on public.teacher_redemptions (code);

create index if not exists teacher_redemptions_last_seen_idx
  on public.teacher_redemptions (last_seen_at desc);

alter table public.teacher_codes        enable row level security;
alter table public.teacher_redemptions  enable row level security;

create or replace function public.redeem_teacher_code(
  p_code       text,
  p_user_agent text default null,
  p_ip_hash    text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row    public.teacher_codes;
  v_token  uuid;
begin
  select * into v_row
  from public.teacher_codes
  where code = upper(trim(p_code))
    and is_active = true
    and (expires_at is null or expires_at > now());

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'invalid_or_expired');
  end if;

  insert into public.teacher_redemptions (code, user_agent, ip_hash)
  values (v_row.code, p_user_agent, p_ip_hash)
  returning session_token into v_token;

  return jsonb_build_object(
    'ok',            true,
    'session_token', v_token,
    'code',          v_row.code,
    'label',         v_row.label
  );
end;
$$;

create or replace function public.lookup_teacher_session(p_session_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_row  public.teacher_codes;
begin
  update public.teacher_redemptions
  set last_seen_at = now()
  where session_token = p_session_token
  returning code into v_code;

  if v_code is null then
    return jsonb_build_object('ok', false, 'reason', 'no_session');
  end if;

  select * into v_row
  from public.teacher_codes
  where code = v_code
    and is_active = true
    and (expires_at is null or expires_at > now());

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'code_revoked');
  end if;

  return jsonb_build_object('ok', true, 'code', v_row.code, 'label', v_row.label);
end;
$$;

grant execute on function public.redeem_teacher_code(text, text, text) to anon;
grant execute on function public.lookup_teacher_session(uuid)          to anon;

insert into public.teacher_codes (code, label, notes)
values (
  'TPT-TEACHERS',
  'TPT — Tap! Tap! Tap! free phonics pack listing',
  'Shared code on every TPT listing. Unlocks all books, all worksheets, all future content.'
)
on conflict (code) do nothing;
