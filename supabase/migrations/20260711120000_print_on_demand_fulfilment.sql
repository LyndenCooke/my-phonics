-- Physical-book print-on-demand fulfilment (Bookvault): schema.
-- British English throughout.
--
-- Applied directly to prod (jfbgdeyjngvzpfucwpuk) via the Supabase MCP
-- apply_migration tool on 2026-07-11 — this file is kept for repo history
-- only. Do NOT `supabase db push` this repo; local migration history has
-- diverged from prod (see reference_mpb_migration_history_diverged memory).

-- 1. books.slug had no uniqueness guarantee before this (PK was id only).
--    Verified no duplicate slugs exist; safe to enforce so it can be used
--    as a natural key from book_print_mapping / print_orders.
alter table public.books add constraint books_slug_key unique (slug);

-- 2. products: mark which products are physical (need shipping) and which
--    book(s) they contain, so create-checkout-session and the webhook read
--    the same source of truth. Additive only — every existing row gets
--    book_slugs = NULL, requires_shipping = false.
alter table public.products add column book_slugs text[];
alter table public.products add column requires_shipping boolean not null default false;

comment on column public.products.book_slugs is
  'For physical_book products: the books.slug values this product ships (one for a single storybook, several for a reader set or the full library).';
comment on column public.products.requires_shipping is
  'True for physical products. create-checkout-session enables Stripe shipping_address_collection when true.';

-- 3. book_print_mapping: our book -> Bookvault print-on-demand title.
create table public.book_print_mapping (
  id uuid primary key default gen_random_uuid(),
  book_slug text not null unique references public.books(slug),
  book_title text,
  bookvault_title_id text,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.book_print_mapping enable row level security;

create policy "Admins can manage book_print_mapping"
  on public.book_print_mapping for all
  using (has_role(auth.uid(), 'admin'::app_role));

-- 4. print_orders: one row per (Stripe session, book) print job.
--    The unique constraint is the idempotency backstop: a webhook retry
--    for the same session + book hits a 23505 unique violation on insert,
--    which the edge function catches and treats as "already in progress"
--    rather than submitting a second physical print job.
create table public.print_orders (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text not null,
  stripe_payment_intent_id text,
  purchase_id uuid references public.purchases(id),
  user_id uuid references auth.users(id) on delete set null,
  book_slug text not null references public.books(slug),
  bookvault_title_id text,
  quantity integer not null default 1,
  status text not null default 'pending'
    check (status in ('pending', 'submitted', 'failed', 'shipped', 'cancelled')),
  bookvault_order_id text,
  bookvault_response jsonb,
  error_message text,
  shipping_name text,
  shipping_address jsonb,
  submitted_at timestamptz,
  shipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stripe_session_id, book_slug)
);

create index print_orders_status_idx on public.print_orders(status);
create index print_orders_user_id_idx on public.print_orders(user_id);

alter table public.print_orders enable row level security;

create policy "Admins can manage print_orders"
  on public.print_orders for all
  using (has_role(auth.uid(), 'admin'::app_role));

create policy "Users can view own print_orders"
  on public.print_orders for select
  using (auth.uid() = user_id);
