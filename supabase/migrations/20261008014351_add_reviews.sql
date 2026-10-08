-- =========================================
-- SHELFIE
-- Reviews and ratings
-- =========================================


-- =========================================
-- REVIEWS TABLE
-- =========================================

create table public.reviews (
  id uuid primary key
    default gen_random_uuid(),

  user_book_id uuid not null
    references public.user_books(id)
    on delete cascade,

  rating smallint not null,

  review_text text,

  reading_status text not null,

  is_public boolean not null
    default false,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  constraint reviews_rating_check
    check (
      rating between 1 and 5
    ),

  constraint reviews_reading_status_check
    check (
      reading_status in (
        'reading',
        'read',
        'abandoned'
      )
    ),

  constraint reviews_text_length
    check (
      review_text is null
      or char_length(review_text) <= 5000
    )
);


-- =========================================
-- INDEXES
-- =========================================

-- Useful for profile feeds:
-- newest public reviews first
create index reviews_public_created_idx
on public.reviews (
  is_public,
  created_at desc
);

-- Useful for loading all reviews for one
-- library entry / book
create index reviews_user_book_created_idx
on public.reviews (
  user_book_id,
  created_at desc
);


-- =========================================
-- UPDATED_AT
-- =========================================

drop trigger if exists set_reviews_updated_at
on public.reviews;

create trigger set_reviews_updated_at
before update on public.reviews
for each row
execute function public.set_updated_at();


-- =========================================
-- ROW LEVEL SECURITY
-- =========================================

alter table public.reviews
enable row level security;


-- =========================================
-- TABLE PERMISSIONS
-- =========================================
--
-- Users read their own reviews directly.
-- Creation / editing / deletion happens
-- through RPC functions.
-- =========================================

revoke all
on table public.reviews
from anon;

revoke all
on table public.reviews
from authenticated;

grant select
on table public.reviews
to authenticated;


-- =========================================
-- OWN REVIEWS POLICY
-- =========================================

create policy "Users can read their own reviews"
on public.reviews
for select
to authenticated
using (
  exists (
    select 1
    from public.user_books ub
    where ub.id = reviews.user_book_id
      and ub.user_id = auth.uid()
  )
);


-- =========================================
-- ADD REVIEW
-- =========================================
--
-- Supported flows:
--
-- 1. Book already exists in library
-- 2. Book exists in wishlist
-- 3. Book comes directly from search
--
-- The selected status becomes the current
-- library status and is also saved as a
-- snapshot on the review.
--
-- Each call creates a NEW review.
-- =========================================

create function public.add_review(
  p_google_books_id text,
  p_title text,
  p_status text,
  p_rating integer,

  p_review_text text default null,
  p_is_public boolean default false,

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
  library_entry_id uuid;
  saved_review_id uuid;

  normalized_review_text text :=
    nullif(btrim(p_review_text), '');
begin

  -- -------------------------
  -- AUTHENTICATION
  -- -------------------------

  if current_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;


  -- -------------------------
  -- BOOK VALIDATION
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
  -- STATUS VALIDATION
  -- -------------------------

  if p_status not in (
    'reading',
    'read',
    'abandoned'
  ) then
    raise exception 'Invalid reading status'
      using errcode = '22023';
  end if;


  -- -------------------------
  -- RATING VALIDATION
  -- -------------------------

  if p_rating is null
     or p_rating not between 1 and 5 then

    raise exception
      'Rating must be between 1 and 5'
      using errcode = '22023';

  end if;


  -- -------------------------
  -- REVIEW TEXT VALIDATION
  -- -------------------------

  if normalized_review_text is not null
     and char_length(normalized_review_text) > 5000 then

    raise exception
      'Review text must be 5000 characters or less'
      using errcode = '22023';

  end if;


  -- =========================================
  -- SAVE / REUSE BOOK
  -- =========================================

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

  returning id
  into saved_book_id;


  -- Book already existed
  if saved_book_id is null then

    select id
    into saved_book_id

    from public.books

    where google_books_id =
      p_google_books_id;

  end if;


  -- =========================================
  -- FIND LIBRARY ENTRY
  -- =========================================

  select id
  into library_entry_id

  from public.user_books

  where user_id = current_user_id
    and book_id = saved_book_id;


  -- =========================================
  -- CREATE / UPDATE LIBRARY ENTRY
  -- =========================================
  --
  -- The status selected in the review form
  -- becomes the current library status.
  -- =========================================

  if library_entry_id is null then

    insert into public.user_books (
      user_id,
      book_id,
      status
    )
    values (
      current_user_id,
      saved_book_id,
      p_status
    )

    returning id
    into library_entry_id;

  else

    update public.user_books

    set status = p_status

    where id = library_entry_id;

  end if;


  -- =========================================
  -- REMOVE FROM WISHLIST
  -- =========================================
  --
  -- If the book was in the wishlist, rating
  -- it moves it into the library.
  --
  -- If it was not in the wishlist, this
  -- simply deletes zero rows.
  -- =========================================

  delete from public.wishlist

  where user_id = current_user_id
    and book_id = saved_book_id;


  -- =========================================
  -- CREATE REVIEW
  -- =========================================
  --
  -- No unique constraint:
  -- users may review the same book multiple
  -- times during their reading experience.
  -- =========================================

  insert into public.reviews (
    user_book_id,
    rating,
    review_text,
    reading_status,
    is_public
  )
  values (
    library_entry_id,
    p_rating,
    normalized_review_text,
    p_status,
    coalesce(p_is_public, false)
  )

  returning id
  into saved_review_id;


  return saved_review_id;

end;
$$;


-- =========================================
-- UPDATE REVIEW
-- =========================================
--
-- Edits one specific review.
--
-- reading_status here represents the status
-- stored on that historical review.
--
-- It does NOT change user_books.status.
-- =========================================

create function public.update_review(
  p_review_id uuid,
  p_rating integer,
  p_status text,
  p_review_text text default null,
  p_is_public boolean default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();

  normalized_review_text text :=
    nullif(btrim(p_review_text), '');

  updated_review_id uuid;
begin

  if current_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;


  if p_review_id is null then
    raise exception 'Review is required'
      using errcode = '22023';
  end if;


  if p_status not in (
    'reading',
    'read',
    'abandoned'
  ) then
    raise exception 'Invalid reading status'
      using errcode = '22023';
  end if;


  if p_rating is null
     or p_rating not between 1 and 5 then

    raise exception
      'Rating must be between 1 and 5'
      using errcode = '22023';

  end if;


  if normalized_review_text is not null
     and char_length(normalized_review_text) > 5000 then

    raise exception
      'Review text must be 5000 characters or less'
      using errcode = '22023';

  end if;


  update public.reviews r

  set
    rating = p_rating,
    review_text = normalized_review_text,
    reading_status = p_status,
    is_public = coalesce(
      p_is_public,
      r.is_public
    )

  from public.user_books ub

  where r.id = p_review_id
    and ub.id = r.user_book_id
    and ub.user_id = current_user_id

  returning r.id
  into updated_review_id;


  if updated_review_id is null then

    raise exception 'Review not found'
      using errcode = 'P0002';

  end if;


  return updated_review_id;

end;
$$;


-- =========================================
-- CHANGE REVIEW VISIBILITY
-- =========================================

create function public.set_review_visibility(
  p_review_id uuid,
  p_is_public boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  updated_review_id uuid;
begin

  if current_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;


  if p_is_public is null then
    raise exception 'Visibility is required'
      using errcode = '22023';
  end if;


  update public.reviews r

  set is_public = p_is_public

  from public.user_books ub

  where r.id = p_review_id
    and ub.id = r.user_book_id
    and ub.user_id = current_user_id

  returning r.id
  into updated_review_id;


  if updated_review_id is null then

    raise exception 'Review not found'
      using errcode = 'P0002';

  end if;


  return updated_review_id;

end;
$$;


-- =========================================
-- DELETE REVIEW
-- =========================================
--
-- Removing a review does NOT remove the
-- book from the user's library.
-- =========================================

create function public.delete_review(
  p_review_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin

  if current_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;


  delete from public.reviews r

  using public.user_books ub

  where r.id = p_review_id
    and ub.id = r.user_book_id
    and ub.user_id = current_user_id;


  if not found then

    raise exception 'Review not found'
      using errcode = 'P0002';

  end if;

end;
$$;


-- =========================================
-- PUBLIC REVIEWS VIEW
-- =========================================
--
-- Public feed / profile surface.
--
-- No user UUID is exposed.
--
-- Reviews can be filtered by username and
-- ordered by created_at DESC.
-- =========================================

drop view if exists public.public_reviews;

create view public.public_reviews
as
select

  r.id as review_id,

  p.username,
  p.avatar_url,

  b.google_books_id,
  b.title,
  b.subtitle,
  b.authors,
  b.cover_url,

  r.rating,
  r.review_text,
  r.reading_status,

  r.created_at,
  r.updated_at

from public.reviews r

join public.user_books ub
  on ub.id = r.user_book_id

join public.profiles p
  on p.id = ub.user_id

join public.books b
  on b.id = ub.book_id

where r.is_public = true;


revoke all
on public.public_reviews
from public, anon;

grant select
on public.public_reviews
to authenticated;


-- =========================================
-- PUBLIC BOOK REVIEW SUMMARY
-- =========================================
--
-- Each public review counts independently.
--
-- Therefore one user may contribute more
-- than one rating for the same book.
-- =========================================

drop view if exists public.book_review_summary;

create view public.book_review_summary
as
select

  b.google_books_id,

  count(r.id)::integer
    as review_count,

  round(
    avg(r.rating)::numeric,
    2
  )
    as average_rating

from public.books b

left join public.user_books ub
  on ub.book_id = b.id

left join public.reviews r
  on r.user_book_id = ub.id
  and r.is_public = true

group by
  b.id,
  b.google_books_id;


revoke all
on public.book_review_summary
from public, anon;

grant select
on public.book_review_summary
to authenticated;


-- =========================================
-- FUNCTION PERMISSIONS
-- =========================================


-- ADD REVIEW

revoke all
on function public.add_review(
  text,
  text,
  text,
  integer,
  text,
  boolean,
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
on function public.add_review(
  text,
  text,
  text,
  integer,
  text,
  boolean,
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


-- UPDATE REVIEW

revoke all
on function public.update_review(
  uuid,
  integer,
  text,
  text,
  boolean
)
from public, anon;

grant execute
on function public.update_review(
  uuid,
  integer,
  text,
  text,
  boolean
)
to authenticated;


-- REVIEW VISIBILITY

revoke all
on function public.set_review_visibility(
  uuid,
  boolean
)
from public, anon;

grant execute
on function public.set_review_visibility(
  uuid,
  boolean
)
to authenticated;


-- DELETE REVIEW

revoke all
on function public.delete_review(
  uuid
)
from public, anon;

grant execute
on function public.delete_review(
  uuid
)
to authenticated;