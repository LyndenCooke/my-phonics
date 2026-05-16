-- Unlock the first book of every level so anonymous visitors can read
-- straight from /library without signing up. Library-first funnel: the
-- free reads are the hook, sign-up is the gate to download as PDF.
update public.books
   set is_free_sample = true
 where sub_level in ('L1.1', 'L2.1', 'L3.1', 'L4.1', 'L5.1', 'L6.1');
