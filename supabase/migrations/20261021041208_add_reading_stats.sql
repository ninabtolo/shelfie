-- =========================================
-- SHELFIE
-- Reading statistics
-- =========================================


-- =========================================
-- INDEXES
-- =========================================
--
-- These indexes support the statistics
-- queries without storing duplicate stats.
-- =========================================

create index if not exists user_books_user_status_idx
on public.user_books (
  user_id,
  status
);

create index if not exists user_books_user_favorite_idx
on public.user_books (
  user_id,
  is_favorite
);

create index if not exists reviews_user_book_created_idx
on public.reviews (
  user_book_id,
  created_at desc
);


-- =========================================
-- STATS OVERVIEW
-- =========================================
--
-- Returns the main numbers displayed at
-- the top of the statistics page.
--
-- Average rating uses ONLY the most recent
-- review for each book.
-- =========================================

create or replace function public.get_my_reading_stats()
returns table (
  total_books integer,
  books_read integer,
  books_reading integer,
  books_abandoned integer,
  favorite_books integer,
  pages_read bigint,
  rated_books integer,
  reviews_written integer,
  average_rating numeric
)
language sql
security definer
stable
set search_path = ''
as $$
  with my_books as (
    select
      ub.id,
      ub.status,
      ub.is_favorite,
      b.page_count

    from public.user_books ub

    join public.books b
      on b.id = ub.book_id

    where ub.user_id = auth.uid()
  ),

  latest_reviews as (
    select distinct on (r.user_book_id)
      r.user_book_id,
      r.rating

    from public.reviews r

    join public.user_books ub
      on ub.id = r.user_book_id

    where ub.user_id = auth.uid()

    order by
      r.user_book_id,
      r.created_at desc,
      r.id desc
  ),

  review_count as (
    select
      count(*)::integer as total

    from public.reviews r

    join public.user_books ub
      on ub.id = r.user_book_id

    where ub.user_id = auth.uid()
  )

  select
    count(*)::integer
      as total_books,

    count(*) filter (
      where mb.status = 'read'
    )::integer
      as books_read,

    count(*) filter (
      where mb.status = 'reading'
    )::integer
      as books_reading,

    count(*) filter (
      where mb.status = 'abandoned'
    )::integer
      as books_abandoned,

    count(*) filter (
      where mb.is_favorite = true
    )::integer
      as favorite_books,

    coalesce(
      sum(
        case
          when mb.status = 'read'
          then coalesce(mb.page_count, 0)
          else 0
        end
      ),
      0
    )::bigint
      as pages_read,

    (
      select count(*)::integer
      from latest_reviews
    )
      as rated_books,

    (
      select total
      from review_count
    )
      as reviews_written,

    (
      select
        round(
          avg(rating)::numeric,
          2
        )

      from latest_reviews
    )
      as average_rating

  from my_books mb;
$$;


-- =========================================
-- BOOK STATUS DISTRIBUTION
-- =========================================

create or replace function public.get_my_book_status_distribution()
returns table (
  status text,
  book_count integer
)
language sql
security definer
stable
set search_path = ''
as $$
  with statuses(status) as (
    values
      ('reading'::text),
      ('read'::text),
      ('abandoned'::text)
  )

  select
    s.status,

    count(ub.id)::integer
      as book_count

  from statuses s

  left join public.user_books ub
    on ub.status = s.status
    and ub.user_id = auth.uid()

  group by s.status

  order by
    case s.status
      when 'reading' then 1
      when 'read' then 2
      when 'abandoned' then 3
    end;
$$;


-- =========================================
-- RATING DISTRIBUTION
-- =========================================
--
-- Multiple reviews can exist for a book,
-- but only the most recent review counts
-- toward personal rating statistics.
--
-- Always returns stars 1 through 5,
-- including zero-count ratings.
-- =========================================

create or replace function public.get_my_rating_distribution()
returns table (
  rating integer,
  rating_count integer
)
language sql
security definer
stable
set search_path = ''
as $$
  with latest_reviews as (
    select distinct on (r.user_book_id)
      r.user_book_id,
      r.rating

    from public.reviews r

    join public.user_books ub
      on ub.id = r.user_book_id

    where ub.user_id = auth.uid()

    order by
      r.user_book_id,
      r.created_at desc,
      r.id desc
  ),

  stars as (
    select generate_series(1, 5)
      as rating
  )

  select
    s.rating,

    count(lr.user_book_id)::integer
      as rating_count

  from stars s

  left join latest_reviews lr
    on lr.rating = s.rating

  group by s.rating

  order by s.rating;
$$;


-- =========================================
-- TOP GENRES
-- =========================================
--
-- Counts genres across books in the user's
-- library.
--
-- Each book contributes once to each genre
-- attached to it.
-- =========================================

create or replace function public.get_my_top_genres(
  p_limit integer default 10
)
returns table (
  genre text,
  book_count integer
)
language sql
security definer
stable
set search_path = ''
as $$
  select
    genre_name
      as genre,

    count(*)::integer
      as book_count

  from public.user_books ub

  join public.books b
    on b.id = ub.book_id

  cross join lateral
    unnest(
      coalesce(
        b.genres,
        array[]::text[]
      )
    )
    as genre_name

  where ub.user_id = auth.uid()

    and nullif(
      btrim(genre_name),
      ''
    ) is not null

  group by genre_name

  order by
    book_count desc,
    genre_name asc

  limit greatest(
    least(
      coalesce(p_limit, 10),
      50
    ),
    1
  );
$$;


-- =========================================
-- TOP AUTHORS
-- =========================================
--
-- "Most-read authors" counts only books
-- whose current status is read.
-- =========================================

create or replace function public.get_my_top_authors(
  p_limit integer default 10
)
returns table (
  author text,
  book_count integer
)
language sql
security definer
stable
set search_path = ''
as $$
  select
    author_name
      as author,

    count(*)::integer
      as book_count

  from public.user_books ub

  join public.books b
    on b.id = ub.book_id

  cross join lateral
    unnest(
      coalesce(
        b.authors,
        array[]::text[]
      )
    )
    as author_name

  where ub.user_id = auth.uid()

    and ub.status = 'read'

    and nullif(
      btrim(author_name),
      ''
    ) is not null

  group by author_name

  order by
    book_count desc,
    author_name asc

  limit greatest(
    least(
      coalesce(p_limit, 10),
      50
    ),
    1
  );
$$;


-- =========================================
-- LIBRARY ACTIVITY
-- =========================================
--
-- Last 12 months.
--
-- Includes:
-- - books added to the library
-- - reviews written
--
-- Important:
-- This does NOT claim a book was FINISHED
-- during that month because Shelfie does not
-- currently store a finished_at timestamp.
-- =========================================

create or replace function public.get_my_reading_activity()
returns table (
  month date,
  books_added integer,
  reviews_written integer
)
language sql
security definer
stable
set search_path = ''
as $$
  with months as (
    select
      generate_series(
        date_trunc('month', now())
          - interval '11 months',

        date_trunc('month', now()),

        interval '1 month'
      )::date
        as month
  ),

  book_activity as (
    select
      date_trunc(
        'month',
        ub.created_at
      )::date
        as month,

      count(*)::integer
        as books_added

    from public.user_books ub

    where ub.user_id = auth.uid()

      and ub.created_at >=
        date_trunc('month', now())
          - interval '11 months'

    group by 1
  ),

  review_activity as (
    select
      date_trunc(
        'month',
        r.created_at
      )::date
        as month,

      count(*)::integer
        as reviews_written

    from public.reviews r

    join public.user_books ub
      on ub.id = r.user_book_id

    where ub.user_id = auth.uid()

      and r.created_at >=
        date_trunc('month', now())
          - interval '11 months'

    group by 1
  )

  select
    m.month,

    coalesce(
      ba.books_added,
      0
    )::integer
      as books_added,

    coalesce(
      ra.reviews_written,
      0
    )::integer
      as reviews_written

  from months m

  left join book_activity ba
    on ba.month = m.month

  left join review_activity ra
    on ra.month = m.month

  order by m.month;
$$;


-- =========================================
-- FUNCTION PERMISSIONS
-- =========================================


-- OVERVIEW

revoke all
on function public.get_my_reading_stats()
from public, anon;

grant execute
on function public.get_my_reading_stats()
to authenticated;


-- STATUS DISTRIBUTION

revoke all
on function public.get_my_book_status_distribution()
from public, anon;

grant execute
on function public.get_my_book_status_distribution()
to authenticated;


-- RATING DISTRIBUTION

revoke all
on function public.get_my_rating_distribution()
from public, anon;

grant execute
on function public.get_my_rating_distribution()
to authenticated;


-- TOP GENRES

revoke all
on function public.get_my_top_genres(integer)
from public, anon;

grant execute
on function public.get_my_top_genres(integer)
to authenticated;


-- TOP AUTHORS

revoke all
on function public.get_my_top_authors(integer)
from public, anon;

grant execute
on function public.get_my_top_authors(integer)
to authenticated;


-- READING ACTIVITY

revoke all
on function public.get_my_reading_activity()
from public, anon;

grant execute
on function public.get_my_reading_activity()
to authenticated;