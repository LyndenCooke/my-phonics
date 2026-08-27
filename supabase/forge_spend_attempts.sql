-- Apply idempotently with `supabase db query --linked`; never `supabase db push`.
create table if not exists public.forge_spend_attempts (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.custom_books(id) on delete cascade,
  operation_key text not null unique,
  step text not null,
  call_name text not null,
  provider text not null,
  model text,
  client_request_id text not null unique,
  provider_request_id text,
  estimate_usd numeric(10,4) not null check (estimate_usd >= 0),
  actual_usd numeric(10,4),
  status text not null check (status in ('active','confirmed','uncertain','released')),
  usage jsonb,
  request_meta jsonb,
  response_meta jsonb,
  error text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.forge_spend_attempts add column if not exists request_meta jsonb;
alter table public.forge_spend_attempts add column if not exists response_meta jsonb;

create index if not exists forge_spend_attempts_book_idx
  on public.forge_spend_attempts(book_id, started_at);

alter table public.forge_spend_attempts enable row level security;
revoke all on table public.forge_spend_attempts from anon, authenticated;
grant select, insert, update on table public.forge_spend_attempts to service_role;

drop function if exists public.forge_begin_spend_attempt(uuid,text,text,text,text,text,numeric,numeric,text);
create or replace function public.forge_begin_spend_attempt(
  p_book_id uuid, p_operation_key text, p_step text, p_call_name text,
  p_provider text, p_model text, p_estimate_usd numeric,
  p_cap_usd numeric, p_client_request_id text, p_request_meta jsonb default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_existing forge_spend_attempts;
  v_confirmed numeric;
  v_uncertain numeric;
  v_active numeric;
  v_row forge_spend_attempts;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_book_id::text, 0));
  select * into v_existing from forge_spend_attempts where operation_key = p_operation_key;
  if found then
    if v_existing.status = 'active' and v_existing.started_at < now() - interval '6 minutes' then
      update forge_spend_attempts set status = 'uncertain', finished_at = now(),
        error = coalesce(error, 'worker ended before reconciliation') where id = v_existing.id;
      return jsonb_build_object('allowed', false, 'reason', 'unresolved operation', 'id', v_existing.id,
        'status', 'uncertain');
    end if;
    return jsonb_build_object('allowed', false, 'reason', 'duplicate operation', 'id', v_existing.id,
      'status', v_existing.status, 'startedAt', v_existing.started_at);
  end if;
  select
    coalesce(sum(actual_usd) filter (where status = 'confirmed'), 0),
    coalesce(sum(estimate_usd) filter (where status = 'uncertain'), 0),
    coalesce(sum(estimate_usd) filter (where status = 'active'), 0)
  into v_confirmed, v_uncertain, v_active
  from forge_spend_attempts where book_id = p_book_id;
  if v_confirmed + v_uncertain + v_active + p_estimate_usd > p_cap_usd then
    return jsonb_build_object('allowed', false, 'reason', 'spend cap', 'exposure',
      jsonb_build_object('confirmed_usd', v_confirmed, 'uncertain_usd', v_uncertain,
        'active_reservation_usd', v_active, 'requested_usd', p_estimate_usd, 'cap_usd', p_cap_usd));
  end if;
  insert into forge_spend_attempts(book_id, operation_key, step, call_name, provider, model,
    client_request_id, estimate_usd, status, request_meta)
  values (p_book_id, p_operation_key, p_step, p_call_name, p_provider, p_model,
    p_client_request_id, p_estimate_usd, 'active', p_request_meta) returning * into v_row;
  return jsonb_build_object('allowed', true, 'id', v_row.id,
    'clientRequestId', v_row.client_request_id, 'operationKey', v_row.operation_key);
end $$;

revoke all on function public.forge_begin_spend_attempt(uuid,text,text,text,text,text,numeric,numeric,text,jsonb) from public;
grant execute on function public.forge_begin_spend_attempt(uuid,text,text,text,text,text,numeric,numeric,text,jsonb) to service_role;
