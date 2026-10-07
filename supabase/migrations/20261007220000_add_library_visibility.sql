alter table public.user_books
add column if not exists is_public boolean not null default true;

drop function if exists public.add_book_to_library(
  text, text, text, text, text[], text, text, text, text, text, integer, text[], text, text
);

create function public.add_book_to_library(
  p_google_books_id text,
  p_title text,
  p_status text,
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
  p_cover_url text default null,
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

  if nullif(btrim(p_google_books_id), '') is null then
    raise exception 'Google Books ID is required' using errcode = '22023';
  end if;
  if nullif(btrim(p_title), '') is null then
    raise exception 'Book title is required' using errcode = '22023';
  end if;
  if p_status not in ('reading', 'read', 'abandoned') then
    raise exception 'Invalid reading status' using errcode = '22023';
  end if;

  insert into public.books (
    google_books_id, title, subtitle, authors, description, isbn_10, isbn_13,
    publisher, published_date, page_count, genres, language, cover_url
  )
  values (
    p_google_books_id, p_title, p_subtitle, p_authors, p_description, p_isbn_10,
    p_isbn_13, p_publisher, p_published_date, p_page_count, p_genres,
    p_language, p_cover_url
  )
  on conflict (google_books_id) do nothing
  returning id into saved_book_id;

  if saved_book_id is null then
    select id into saved_book_id
    from public.books
    where google_books_id = p_google_books_id;
  end if;

  insert into public.user_books (user_id, book_id, status, is_public)
  values (current_user_id, saved_book_id, p_status, coalesce(p_is_public, true))
  returning id into library_entry_id;

  return library_entry_id;
end;
$$;

revoke all on function public.add_book_to_library(
  text, text, text, text, text[], text, text, text, text, text, integer, text[], text, text, boolean
) from public, anon;

grant execute on function public.add_book_to_library(
  text, text, text, text, text[], text, text, text, text, text, integer, text[], text, text, boolean
) to authenticated;

-- add indexes 

create index if not exists profiles_username_lower_idx
on public.profiles (lower(username));

create index if not exists user_books_public_profile_idx
on public.user_books (user_id, is_public, created_at desc);