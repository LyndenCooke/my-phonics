-- World of Books (£10) now requires sign-in, tying the purchase to an
-- account instead of the previous unauthenticated email-only trust model.
-- custom_books.user_id and custom_book_orders.user_id already existed on the
-- live project (scaffolded ahead of this feature landing) but had no index —
-- both are now looked up on every /world request and account-linking action.
create index if not exists custom_books_user_id_idx on public.custom_books (user_id);
create index if not exists custom_book_orders_user_id_idx on public.custom_book_orders (user_id);
