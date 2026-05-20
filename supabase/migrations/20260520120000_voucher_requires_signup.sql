-- Voucher codes (MYPHONICSFRIENDS and any future affiliate/promo codes)
-- now require the visitor to be signed in. Redeeming grants a real
-- purchases row for that user, so the entitlement persists across devices
-- and gives us audit trail (who redeemed what, when).
--
-- The TPT teacher pass (TPT-TEACHERS) keeps its no-signup behaviour — it
-- only writes a session token to localStorage. The difference is captured
-- in a new `grant_product_type` column on `teacher_codes`: NULL means
-- "anonymous teacher session", a product_type means "auth'd voucher
-- redemption granting that product".

alter table public.teacher_codes
  add column if not exists grant_product_type text;

update public.teacher_codes
set grant_product_type = 'full_bundle'
where code = 'MYPHONICSFRIENDS';

-- redeem_teacher_code now refuses codes that have a grant_product_type set
-- so the no-signup path can't be used to bypass the signup gate on
-- voucher codes. TPT-TEACHERS keeps working unchanged.
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

  -- Vouchers that grant a real product require the signup-bound flow.
  -- Reject them here so the anonymous path can't escape the gate.
  if v_row.grant_product_type is not null then
    return jsonb_build_object('ok', false, 'reason', 'requires_signup');
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

-- New RPC: redeem a voucher as the signed-in user. Inserts a purchases row
-- so the unlock is tied to auth.users.id and follows the user to any
-- device they sign in on. Idempotent — repeating doesn't duplicate.
create or replace function public.redeem_voucher_for_user(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id    uuid := auth.uid();
  v_row        public.teacher_codes;
  v_product_id uuid;
  v_existing   uuid;
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'reason', 'auth_required');
  end if;

  select * into v_row
  from public.teacher_codes
  where code = upper(trim(p_code))
    and is_active = true
    and (expires_at is null or expires_at > now())
    and grant_product_type is not null;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'invalid_or_expired');
  end if;

  select id into v_product_id
  from public.products
  where product_type = v_row.grant_product_type
    and is_active = true
  limit 1;

  if v_product_id is null then
    return jsonb_build_object('ok', false, 'reason', 'product_not_found');
  end if;

  -- Idempotent: skip if the user already owns the granted product.
  select id into v_existing
  from public.purchases
  where user_id = v_user_id
    and product_id = v_product_id
    and status = 'completed'
  limit 1;

  if v_existing is null then
    insert into public.purchases (
      user_id, product_id, amount_paid, currency, status, completed_at
    ) values (
      v_user_id, v_product_id, 0, 'GBP', 'completed', now()
    );
  end if;

  return jsonb_build_object(
    'ok',           true,
    'product_type', v_row.grant_product_type,
    'code',         v_row.code,
    'label',        v_row.label
  );
end;
$$;

grant execute on function public.redeem_voucher_for_user(text) to authenticated;
