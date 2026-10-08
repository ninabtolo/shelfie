-- =========================================
-- SHELFIE
-- Favorite books
-- =========================================


-- =========================================
-- ADD TO FAVORITES
-- =========================================

create or replace function public.add_book_to_favorites(
  p_user_book_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  updated_user_book_id uuid;
begin

  if current_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  update public.user_books

  set is_favorite = true

  where id = p_user_book_id
    and user_id = current_user_id

  returning id
  into updated_user_book_id;


  if updated_user_book_id is null then
    raise exception 'Book not found in your library'
      using errcode = 'P0002';
  end if;


  return updated_user_book_id;

end;
$$;


-- =========================================
-- REMOVE FROM FAVORITES
-- =========================================

create or replace function public.remove_book_from_favorites(
  p_user_book_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  updated_user_book_id uuid;
begin

  if current_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  update public.user_books

  set is_favorite = false

  where id = p_user_book_id
    and user_id = current_user_id

  returning id
  into updated_user_book_id;


  if updated_user_book_id is null then
    raise exception 'Book not found in your library'
      using errcode = 'P0002';
  end if;


  return updated_user_book_id;

end;
$$;


-- =========================================
-- FUNCTION PERMISSIONS
-- =========================================

revoke all
on function public.add_book_to_favorites(uuid)
from public, anon;

grant execute
on function public.add_book_to_favorites(uuid)
to authenticated;


revoke all
on function public.remove_book_from_favorites(uuid)
from public, anon;

grant execute
on function public.remove_book_from_favorites(uuid)
to authenticated;


-- =========================================
-- PUBLIC FAVORITE BOOKS
-- =========================================
--
-- A favorite is public only when the
-- corresponding library entry is public.
-- =========================================

drop view if exists public.public_favorite_books;

create view public.public_favorite_books
as
select

  p.username,

  b.google_books_id,
  b.title,
  b.subtitle,
  b.authors,
  b.cover_url,

  ub.status,
  ub.created_at as added_at

from public.user_books ub

join public.profiles p
  on p.id = ub.user_id

join public.books b
  on b.id = ub.book_id

where ub.is_favorite = true
  and ub.is_public = true;


revoke all
on public.public_favorite_books
from public, anon;

grant select
on public.public_favorite_books
to authenticated;


-- =========================================
-- FAVORITES INDEX
-- =========================================

create index if not exists user_books_favorites_profile_idx
on public.user_books (
  user_id,
  is_favorite,
  is_public
);