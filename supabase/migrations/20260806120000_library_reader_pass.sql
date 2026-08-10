-- Library reader pass — LIBRARY-READERS
--
-- PRINTED IN EVERY LIBRARY-EDITION BOOK (from 2026-08-06), on the "Is this
-- the right level?" page beside the three QR codes. That makes this code
-- permanently public and permanently un-rotatable: once a print run ships,
-- the code cannot be changed without reprinting. Treat it as a published
-- constant, not a secret.
--
-- Why it exists: library and classroom copies are handled by people with no
-- account. Without this, scanning the printed "Read this book" QR drops a
-- borrower on /library with the book locked — the code promises a read-along
-- and delivers a paywall.
--
-- grant_product_type is deliberately left NULL, which is what distinguishes
-- an anonymous teacher-session code (TPT-TEACHERS) from a voucher that
-- requires signup and grants a real purchase (MYPHONICSFRIENDS). NULL keeps
-- the no-signup behaviour the printed line promises: "Enter code
-- LIBRARY-READERS to read it free — no sign-up."
--
-- Scope note: this grants READ access to the library via a localStorage
-- teacher session. It does not create a user, grant downloads tied to an
-- account, or confer anything that survives clearing site data.

insert into public.teacher_codes (code, label, notes)
values (
  'LIBRARY-READERS',
  'Library edition — printed reader pass',
  'Printed inside every library-edition book beside the QR codes. Public by design and cannot be rotated without a reprint. Anonymous session, no signup, read access only.'
)
on conflict (code) do nothing;

-- Belt and braces: if the row already existed from an earlier hand-run, make
-- sure it is still a no-signup anonymous pass rather than a voucher.
update public.teacher_codes
set grant_product_type = null
where code = 'LIBRARY-READERS';
