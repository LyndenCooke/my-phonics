-- Fixes from code review of the print-on-demand fulfilment pipeline (2026-07-11).
-- Applied directly to prod (jfbgdeyjngvzpfucwpuk) via the Supabase MCP
-- apply_migration tool — this file is kept for repo history only.

-- 1. Add a 'processing' status so submit-print-order can atomically CLAIM a
--    row (pending/failed -> processing) before calling Bookvault, closing a
--    race where two concurrent calls for the same book could both observe
--    'pending' and both place a real duplicate order.
alter table public.print_orders drop constraint print_orders_status_check;
alter table public.print_orders add constraint print_orders_status_check
  check (status in ('pending', 'processing', 'submitted', 'failed', 'shipped', 'cancelled'));

-- 2. requires_shipping was never actually wired into create-checkout-session
--    (it branches on product_type instead) — drop the dead, misleading column
--    rather than maintain two parallel "is this shipped" signals.
alter table public.products drop column requires_shipping;
