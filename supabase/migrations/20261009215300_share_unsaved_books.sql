-- Allow sharing a book directly from its details page, even before it is saved
-- to the sender's library or wishlist.

create or replace function public.share_book_with_details(
  p_google_books_id text,
  p_title text,
  p_to_username text,
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
  p_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.books (
    google_books_id, title, subtitle, authors, description, isbn_10, isbn_13,
    publisher, published_date, page_count, genres, language, cover_url
  )
  values (
    p_google_books_id, p_title, p_subtitle, p_authors, p_description, p_isbn_10,
    p_isbn_13, p_publisher, p_published_date, p_page_count, p_genres,
    p_language, p_cover_url
  )
  on conflict (google_books_id) do nothing;

  return public.share_book(p_google_books_id, p_to_username, p_message);
end;
$$;

revoke all on function public.share_book_with_details(
  text, text, text, text, text[], text, text, text, text, text, integer, text[],
  text, text, text
) from public, anon;

grant execute on function public.share_book_with_details(
  text, text, text, text, text[], text, text, text, text, text, integer, text[],
  text, text, text
) to authenticated;
