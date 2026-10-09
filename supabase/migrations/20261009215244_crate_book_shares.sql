-- =========================================
-- SHELFIE
-- Book sharing
-- =========================================


-- =========================================
-- SHARES TABLE
-- =========================================

create table public.shares (
  id uuid primary key
    default gen_random_uuid(),

  from_user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  to_user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  book_id uuid not null
    references public.books(id)
    on delete cascade,

  message text,

  created_at timestamptz not null
    default now(),

  constraint shares_no_self_share
    check (
      from_user_id <> to_user_id
    ),

  constraint shares_message_length
    check (
      message is null
      or char_length(message) <= 500
    )
);


-- =========================================
-- INDEXES
-- =========================================

create index shares_to_user_created_idx
on public.shares (
  to_user_id,
  created_at desc
);

create index shares_from_user_created_idx
on public.shares (
  from_user_id,
  created_at desc
);


-- =========================================
-- ROW LEVEL SECURITY
-- =========================================

alter table public.shares
enable row level security;


-- =========================================
-- TABLE PERMISSIONS
-- =========================================

revoke all
on table public.shares
from anon;

revoke all
on table public.shares
from authenticated;

grant select
on table public.shares
to authenticated;


-- =========================================
-- READ OWN RECEIVED SHARES
-- =========================================

create policy "Users can read received shares"
on public.shares
for select
to authenticated
using (
  auth.uid() = to_user_id
);


-- =========================================
-- READ OWN SENT SHARES
-- =========================================

create policy "Users can read sent shares"
on public.shares
for select
to authenticated
using (
  auth.uid() = from_user_id
);


-- =========================================
-- SHARE BOOK
-- =========================================

create function public.share_book(
  p_google_books_id text,
  p_to_username text,
  p_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_user_id uuid;
  saved_book_id uuid;
  share_id uuid;

  normalized_message text :=
    nullif(btrim(p_message), '');
begin

  -- -------------------------
  -- AUTHENTICATION
  -- -------------------------

  if current_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;


  -- -------------------------
  -- VALIDATE INPUT
  -- -------------------------

  if nullif(btrim(p_google_books_id), '') is null then
    raise exception 'Book is required'
      using errcode = '22023';
  end if;

  if nullif(btrim(p_to_username), '') is null then
    raise exception 'Recipient is required'
      using errcode = '22023';
  end if;

  if normalized_message is not null
     and char_length(normalized_message) > 500 then

    raise exception
      'Message must be 500 characters or less'
      using errcode = '22023';

  end if;


  -- -------------------------
  -- FIND RECIPIENT
  -- -------------------------

  select id
  into target_user_id

  from public.profiles

  where lower(username)
    = lower(btrim(p_to_username));


  if target_user_id is null then
    raise exception 'User not found'
      using errcode = 'P0002';
  end if;


  -- -------------------------
  -- PREVENT SELF SHARE
  -- -------------------------

  if target_user_id = current_user_id then
    raise exception 'You cannot share a book with yourself'
      using errcode = '22023';
  end if;


  -- -------------------------
  -- REQUIRE FOLLOW RELATIONSHIP
  -- -------------------------
  --
  -- Sender must follow recipient.
  -- -------------------------

  if not exists (
    select 1
    from public.follows
    where follower_id = current_user_id
      and following_id = target_user_id
  ) then
    raise exception
      'You can only share books with users you follow'
      using errcode = '42501';
  end if;


  -- -------------------------
  -- FIND BOOK
  -- -------------------------

  select id
  into saved_book_id

  from public.books

  where google_books_id = p_google_books_id;


  if saved_book_id is null then
    raise exception 'Book not found'
      using errcode = 'P0002';
  end if;


  -- -------------------------
  -- CREATE SHARE
  -- -------------------------

  insert into public.shares (
    from_user_id,
    to_user_id,
    book_id,
    message
  )
  values (
    current_user_id,
    target_user_id,
    saved_book_id,
    normalized_message
  )

  returning id
  into share_id;


  return share_id;

end;
$$;


-- =========================================
-- GET RECEIVED SHARES
-- =========================================

create or replace function public.get_my_received_shares()
returns table (
  share_id uuid,

  from_username text,
  from_avatar_url text,

  google_books_id text,
  title text,
  subtitle text,
  authors text[],
  cover_url text,

  message text,
  shared_at timestamptz
)
language sql
security definer
stable
set search_path = ''
as $$
  select

    s.id,

    p.username,
    p.avatar_url,

    b.google_books_id,
    b.title,
    b.subtitle,
    b.authors,
    b.cover_url,

    s.message,
    s.created_at

  from public.shares s

  join public.profiles p
    on p.id = s.from_user_id

  join public.books b
    on b.id = s.book_id

  where s.to_user_id = auth.uid()

  order by s.created_at desc;
$$;


-- =========================================
-- GET USERS I CAN SHARE WITH
-- =========================================
--
-- Returns only users the current user follows.
-- =========================================

create or replace function public.get_share_recipients()
returns table (
  username text,
  avatar_url text,
  bio text
)
language sql
security definer
stable
set search_path = ''
as $$
  select

    p.username,
    p.avatar_url,
    p.bio

  from public.follows f

  join public.profiles p
    on p.id = f.following_id

  where f.follower_id = auth.uid()

  order by lower(p.username);
$$;


-- =========================================
-- FUNCTION PERMISSIONS
-- =========================================

revoke all
on function public.share_book(
  text,
  text,
  text
)
from public, anon;

grant execute
on function public.share_book(
  text,
  text,
  text
)
to authenticated;


revoke all
on function public.get_my_received_shares()
from public, anon;

grant execute
on function public.get_my_received_shares()
to authenticated;


revoke all
on function public.get_share_recipients()
from public, anon;

grant execute
on function public.get_share_recipients()
to authenticated;