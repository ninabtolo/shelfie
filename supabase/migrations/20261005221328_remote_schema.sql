SET local check_function_bodies = off;

ALTER TABLE "public"."user_books"
  ALTER COLUMN "status" SET DEFAULT '''read''::text'::text;

CREATE OR REPLACE FUNCTION public.add_book_to_wishlist (
  p_google_books_id text,
  p_title           text,
  p_subtitle        text    DEFAULT NULL::text,
  p_authors         text[]  DEFAULT NULL::text[],
  p_description     text    DEFAULT NULL::text,
  p_isbn_10         text    DEFAULT NULL::text,
  p_isbn_13         text    DEFAULT NULL::text,
  p_publisher       text    DEFAULT NULL::text,
  p_published_date  text    DEFAULT NULL::text,
  p_page_count      integer DEFAULT NULL::integer,
  p_genres          text[]  DEFAULT NULL::text[],
  p_language        text    DEFAULT NULL::text,
  p_cover_url       text    DEFAULT NULL::text
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
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
  -- SAVE BOOK IF NECESSARY
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


  -- Book already exists in Shelfie
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
  returning id into wishlist_entry_id;


  return wishlist_entry_id;

end;
$function$;

CREATE OR REPLACE FUNCTION public.move_wishlist_book_to_library (
  p_book_id uuid
)
  RETURNS uuid
  LANGUAGE plpgsql
  AS $function$declare
  current_user_id uuid := auth.uid();
  library_entry_id uuid;
begin

  if current_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.wishlist
    where user_id = current_user_id
      and book_id = p_book_id
  ) then
    raise exception 'Book is not in wishlist'
      using errcode = 'P0001';
  end if;

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

  delete from public.wishlist
  where user_id = current_user_id
    and book_id = p_book_id;

  return library_entry_id;
end;$function$;

