-- =========================================
-- SHELFIE
-- Create user_books table
-- =========================================


create table public.user_books (
  id uuid primary key
    default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  book_id uuid not null
    references public.books(id)
    on delete cascade,

  status text not null
    default 'read',

  is_favorite boolean not null
    default false,

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now(),

  constraint user_books_unique_user_book
    unique (user_id, book_id),

  constraint user_books_status_check
    check (
      status in ('reading', 'read', 'abandoned')
    )
);


-- -------------------------
-- ROW LEVEL SECURITY
-- -------------------------

alter table public.user_books
enable row level security;


-- -------------------------
-- TABLE PERMISSIONS
-- -------------------------

grant select, insert, update, delete
on table public.user_books
to authenticated;

revoke all
on table public.user_books
from anon;


-- -------------------------
-- SELECT
-- User can read own library
-- -------------------------

create policy "Users can read their own library"
on public.user_books
for select
to authenticated
using (
  auth.uid() = user_id
);


-- -------------------------
-- INSERT
-- User can add books only
-- to own library
-- -------------------------

create policy "Users can add books to their own library"
on public.user_books
for insert
to authenticated
with check (
  auth.uid() = user_id
);


-- -------------------------
-- UPDATE
-- User can modify only
-- own library entries
-- -------------------------

create policy "Users can update their own library"
on public.user_books
for update
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);


-- -------------------------
-- DELETE
-- User can remove books only
-- from own library
-- -------------------------

create policy "Users can delete from their own library"
on public.user_books
for delete
to authenticated
using (
  auth.uid() = user_id
);