-- Closes the gap left by 20260520120000_voucher_requires_signup: that
-- migration tightened redeem_teacher_code but not lookup_teacher_session,
-- so any session token that had already been issued for MYPHONICSFRIENDS
-- (or any future voucher code) kept validating and unlocking the library
-- even though new redemptions were blocked.
--
-- Two changes:
--   1. lookup_teacher_session now also refuses codes that have a
--      grant_product_type set, matching the redemption gate.
--   2. Burn the existing MYPHONICSFRIENDS redemption rows so anyone still
--      holding the localStorage token gets a clean lock on next page load.

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
    and (expires_at is null or expires_at > now())
    and grant_product_type is null;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'code_revoked');
  end if;

  return jsonb_build_object('ok', true, 'code', v_row.code, 'label', v_row.label);
end;
$$;

delete from public.teacher_redemptions
where code = 'MYPHONICSFRIENDS';
