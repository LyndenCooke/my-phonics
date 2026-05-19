-- Friends & family voucher — reuses the teacher_codes mechanism so a valid
-- code unlocks the whole library locally with no payment / signup. Surfaced
-- on the Pricing page inside the one-off (£39) card.
insert into public.teacher_codes (code, label, notes)
values (
  'MYPHONICSFRIENDS',
  'MyPhonics Friends — friends & family pass',
  'Shared code for friends and family. Unlocks the full library via the same teacher-session flow as TPT-TEACHERS.'
)
on conflict (code) do nothing;
