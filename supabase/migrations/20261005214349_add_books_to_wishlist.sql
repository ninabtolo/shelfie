-- =========================================
-- SHELFIE
-- Create wishlist and wishlist actions
-- =========================================


-- =========================================
-- WISHLIST TABLE
-- =========================================

create table public.wishlist (
  id uuid primary key
    default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  book_id uuid not null
    references public.books(id)
    on delete cascade,

  created_at timestamptz
    not null
    default now(),

  constraint wishlist_unique_user_book
    unique (user_id, book_id)
);


-- =========================================
-- ROW LEVEL SECURITY
-- =========================================

alter table public.wishlist
enable row level security;


-- =========================================
-- TABLE PERMISSIONS
-- =========================================

revoke all
on table public.wishlist
from anon;

grant select, delete
on table public.wishlist
to authenticated;


-- =========================================
-- SELECT POLICY
-- User can only read their own wishlist
-- =========================================

create policy "Users can read their own wishlist"
on public.wishlist
for select
to authenticated
using (
  auth.uid() = user_id
);


-- =========================================
-- DELETE POLICY
-- User can only remove books
-- from their own wishlist
-- =========================================

create policy "Users can remove from their own wishlist"
on public.wishlist
for delete
to authenticated
using (
  auth.uid() = user_id
);


-- =========================================
-- ADD BOOK TO WISHLIST
-- =========================================

create or replace function public.add_book_to_wishlist(
  p_google_books_id text,
  p_title text,

  p_subtitle text default null,
  p_authors text[] default null,
  p_description text default null,
  p_isbn_10 text default null,
  p_isbn_13 text default null,
  p_publisher text default null,
  p_published_date text default null,
  p_page_count integer default null,
  p_genres text[] default null,
  p_language text default null,
  p_cover_url text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  saved_book_id uuid;
  wishlist_entry_id uuid;
begin

  -- -------------------------
  -- AUTHENTICATION
  -- -------------------------

  if current_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;


  -- -------------------------
  -- VALIDATION
  -- -------------------------

  if nullif(btrim(p_google_books_id), '') is null then
    raise exception 'Google Books ID is required'
      using errcode = '22023';
  end if;

  if nullif(btrim(p_title), '') is null then
    raise exception 'Book title is required'
      using errcode = '22023';
  end if;


  -- -------------------------
  -- SAVE / REUSE BOOK
  -- -------------------------

  insert into public.books (
    google_books_id,
    title,
    subtitle,
    authors,
    description,
    isbn_10,
    isbn_13,
    publisher,
    published_date,
    page_count,
    genres,
    language,
    cover_url
  )
  values (
    p_google_books_id,
    p_title,
    p_subtitle,
    p_authors,
    p_description,
    p_isbn_10,
    p_isbn_13,
    p_publisher,
    p_published_date,
    p_page_count,
    p_genres,
    p_language,
    p_cover_url
  )
  on conflict (google_books_id)
  do nothing
  returning id into saved_book_id;


  -- Book already existed
  if saved_book_id is null then
    select id
    into saved_book_id
    from public.books
    where google_books_id = p_google_books_id;
  end if;


  -- -------------------------
  -- ADD TO WISHLIST
  -- -------------------------

  insert into public.wishlist (
    user_id,
    book_id
  )
  values (
    current_user_id,
    saved_book_id
  )
  on conflict (user_id, book_id)
  do nothing
  returning id into wishlist_entry_id;


  -- If it was already there,
  -- return the existing wishlist entry
  if wishlist_entry_id is null then
    select id
    into wishlist_entry_id
    from public.wishlist
    where user_id = current_user_id
      and book_id = saved_book_id;
  end if;


  return wishlist_entry_id;

end;
$$;


-- =========================================
-- ADD TO WISHLIST FUNCTION PERMISSIONS
-- =========================================

revoke all
on function public.add_book_to_wishlist(
  text,
  text,
  text,
  text[],
  text,
  text,
  text,
  text,
  text,
  integer,
  text[],
  text,
  text
)
from public, anon;


grant execute
on function public.add_book_to_wishlist(
  text,
  text,
  text,
  text[],
  text,
  text,
  text,
  text,
  text,
  integer,
  text[],
  text,
  text
)
to authenticated;


-- =========================================
-- MOVE WISHLIST BOOK TO LIBRARY
-- =========================================

create or replace function public.move_wishlist_book_to_library(
  p_book_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  library_entry_id uuid;
begin

  -- -------------------------
  -- AUTHENTICATION
  -- -------------------------

  if current_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;


  -- -------------------------
  -- VERIFY OWN WISHLIST ENTRY
  -- -------------------------

  if not exists (
    select 1
    from public.wishlist
    where user_id = current_user_id
      and book_id = p_book_id
  ) then
    raise exception 'Book is not in wishlist'
      using errcode = 'P0001';
  end if;


  -- -------------------------
  -- ADD / MOVE TO LIBRARY
  -- -------------------------

  insert into public.user_books (
    user_id,
    book_id,
    status
  )
  values (
    current_user_id,
    p_book_id,
    'read'
  )
  on conflict (user_id, book_id)
  do update set
    status = 'read',
    updated_at = now()
  returning id into library_entry_id;


  -- -------------------------
  -- REMOVE FROM WISHLIST
  -- -------------------------

  delete from public.wishlist
  where user_id = current_user_id
    and book_id = p_book_id;


  return library_entry_id;

end;
$$;


-- =========================================
-- MOVE TO LIBRARY FUNCTION PERMISSIONS
-- =========================================

revoke all
on function public.move_wishlist_book_to_library(uuid)
from public, anon;


grant execute
on function public.move_wishlist_book_to_library(uuid)
to authenticated;