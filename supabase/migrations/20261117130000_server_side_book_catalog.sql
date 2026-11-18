-- =========================================
-- SHELFIE
-- Server-side book catalog
--
-- public.books is shared by every user. Its rows used to be created by the
-- RPCs below from metadata sent by the browser, so whoever saved a book
-- first decided its title, description and cover for everyone.
--
-- Now only the server writes to public.books (POST /api/books fetches the
-- volume from Google Books and inserts it with the service role). The user
-- RPCs take just the Google Books ID and require the book to exist.
-- =========================================

begin;

-- The service role bypasses RLS but still needs table privileges.
grant select, insert on table public.books to service_role;

-- =========================================
-- REMOVE THE OLD SIGNATURES
-- =========================================

drop function if exists public.add_book_to_library(
  text, text, text, text, text[], text, text, text, text, text, integer, text[], text, text
);
drop function if exists public.add_book_to_library(
  text, text, text, text, text[], text, text, text, text, text, integer, text[], text, text, boolean
);
drop function if exists public.add_book_to_wishlist(
  text, text, text, text[], text, text, text, text, text, integer, text[], text, text
);
drop function if exists public.add_review(
  text, text, text, integer, text, boolean, text, text[], text, text, text, text, text, integer, text[], text, text
);
drop function if exists public.share_book_with_details(
  text, text, text, text, text[], text, text, text, text, text, integer, text[], text, text, text
);

-- =========================================
-- ADD TO LIBRARY
-- =========================================

create function public.add_book_to_library(
  p_google_books_id text,
  p_status text,
  p_is_public boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  saved_book_id uuid;
  library_entry_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_status is null or p_status not in ('reading', 'read', 'abandoned') then
    raise exception 'Invalid reading status' using errcode = '22023';
  end if;

  select id into saved_book_id
  from public.books
  where google_books_id = p_google_books_id;

  if saved_book_id is null then
    raise exception 'Book not found' using errcode = 'P0002';
  end if;

  insert into public.user_books (user_id, book_id, status, is_public)
  values (current_user_id, saved_book_id, p_status, coalesce(p_is_public, true))
  returning id into library_entry_id;

  return library_entry_id;
end;
$$;

revoke all on function public.add_book_to_library(text, text, boolean) from public, anon;
grant execute on function public.add_book_to_library(text, text, boolean) to authenticated;

-- =========================================
-- ADD TO WISHLIST
-- =========================================

create function public.add_book_to_wishlist(
  p_google_books_id text
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
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select id into saved_book_id
  from public.books
  where google_books_id = p_google_books_id;

  if saved_book_id is null then
    raise exception 'Book not found' using errcode = 'P0002';
  end if;

  insert into public.wishlist (user_id, book_id)
  values (current_user_id, saved_book_id)
  on conflict (user_id, book_id) do nothing
  returning id into wishlist_entry_id;

  -- Already in the wishlist: return the existing entry.
  if wishlist_entry_id is null then
    select id into wishlist_entry_id
    from public.wishlist
    where user_id = current_user_id
      and book_id = saved_book_id;
  end if;

  return wishlist_entry_id;
end;
$$;

revoke all on function public.add_book_to_wishlist(text) from public, anon;
grant execute on function public.add_book_to_wishlist(text) to authenticated;

-- =========================================
-- ADD REVIEW
-- =========================================
--
-- Same behaviour as before: the selected status becomes the library
-- status (adding the book to the library if needed), the book leaves the
-- wishlist, and each call creates a new review.
-- =========================================

create function public.add_review(
  p_google_books_id text,
  p_status text,
  p_rating integer,
  p_review_text text default null,
  p_is_public boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  saved_book_id uuid;
  library_entry_id uuid;
  saved_review_id uuid;
  normalized_review_text text := nullif(btrim(p_review_text), '');
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_status is null or p_status not in ('reading', 'read', 'abandoned') then
    raise exception 'Invalid reading status' using errcode = '22023';
  end if;

  if p_rating is null or p_rating not between 1 and 5 then
    raise exception 'Rating must be between 1 and 5' using errcode = '22023';
  end if;

  if normalized_review_text is not null
     and char_length(normalized_review_text) > 5000 then
    raise exception 'Review text must be 5000 characters or less' using errcode = '22023';
  end if;

  select id into saved_book_id
  from public.books
  where google_books_id = p_google_books_id;

  if saved_book_id is null then
    raise exception 'Book not found' using errcode = 'P0002';
  end if;

  select id into library_entry_id
  from public.user_books
  where user_id = current_user_id
    and book_id = saved_book_id;

  if library_entry_id is null then
    insert into public.user_books (user_id, book_id, status)
    values (current_user_id, saved_book_id, p_status)
    returning id into library_entry_id;
  else
    update public.user_books
    set status = p_status
    where id = library_entry_id;
  end if;

  delete from public.wishlist
  where user_id = current_user_id
    and book_id = saved_book_id;

  insert into public.reviews (user_book_id, rating, review_text, reading_status, is_public)
  values (library_entry_id, p_rating, normalized_review_text, p_status, coalesce(p_is_public, false))
  returning id into saved_review_id;

  return saved_review_id;
end;
$$;

revoke all on function public.add_review(text, text, integer, text, boolean) from public, anon;
grant execute on function public.add_review(text, text, integer, text, boolean) to authenticated;

-- Sharing uses public.share_book(text, text, text), which already requires
-- the book to exist in public.books.

commit;
