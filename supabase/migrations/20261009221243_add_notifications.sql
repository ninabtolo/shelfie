-- =========================================
-- SHELFIE
-- Notifications
-- =========================================


-- =========================================
-- NOTIFICATIONS TABLE
-- =========================================

create table public.notifications (
  id uuid primary key
    default gen_random_uuid(),

  user_id uuid not null
    references public.profiles(id)
    on delete cascade,

  actor_user_id uuid
    references public.profiles(id)
    on delete cascade,

  type text not null,

  share_id uuid
    references public.shares(id)
    on delete cascade,

  created_at timestamptz not null
    default now(),

  read_at timestamptz,

  constraint notifications_type_check
    check (
      type in (
        'follow',
        'book_share'
      )
    ),

  constraint notifications_share_type_check
    check (
      (
        type = 'book_share'
        and share_id is not null
      )
      or
      (
        type = 'follow'
        and share_id is null
      )
    )
);


-- =========================================
-- INDEXES
-- =========================================

create index notifications_user_created_idx
on public.notifications (
  user_id,
  created_at desc
);

create index notifications_user_unread_idx
on public.notifications (
  user_id,
  read_at,
  created_at desc
);


-- =========================================
-- ROW LEVEL SECURITY
-- =========================================

alter table public.notifications
enable row level security;


-- =========================================
-- TABLE PERMISSIONS
-- =========================================
--
-- Notifications are created by database
-- functions, not directly by users.
-- =========================================

revoke all
on table public.notifications
from anon;

revoke all
on table public.notifications
from authenticated;

grant select, update, delete
on table public.notifications
to authenticated;


-- =========================================
-- READ OWN NOTIFICATIONS
-- =========================================

create policy "Users can read their own notifications"
on public.notifications
for select
to authenticated
using (
  auth.uid() = user_id
);


-- =========================================
-- UPDATE OWN NOTIFICATIONS
-- =========================================

create policy "Users can update their own notifications"
on public.notifications
for update
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);


-- =========================================
-- DELETE OWN NOTIFICATIONS
-- =========================================

create policy "Users can delete their own notifications"
on public.notifications
for delete
to authenticated
using (
  auth.uid() = user_id
);


-- =========================================
-- GET MY NOTIFICATIONS
-- =========================================
--
-- Returns display-ready notification data.
-- No internal user UUIDs are exposed.
-- =========================================

create or replace function public.get_my_notifications()
returns table (
  notification_id uuid,

  notification_type text,

  actor_username text,
  actor_avatar_url text,

  google_books_id text,
  book_title text,
  book_cover_url text,

  share_message text,

  created_at timestamptz,
  read_at timestamptz
)
language sql
security definer
stable
set search_path = ''
as $$
  select

    n.id,

    n.type,

    actor.username,
    actor.avatar_url,

    b.google_books_id,
    b.title,
    b.cover_url,

    s.message,

    n.created_at,
    n.read_at

  from public.notifications n

  left join public.profiles actor
    on actor.id = n.actor_user_id

  left join public.shares s
    on s.id = n.share_id

  left join public.books b
    on b.id = s.book_id

  where n.user_id = auth.uid()

  order by n.created_at desc;
$$;


-- =========================================
-- GET UNREAD COUNT
-- =========================================

create or replace function public.get_unread_notification_count()
returns integer
language sql
security definer
stable
set search_path = ''
as $$
  select count(*)::integer

  from public.notifications

  where user_id = auth.uid()
    and read_at is null;
$$;


-- =========================================
-- MARK ONE NOTIFICATION AS READ
-- =========================================

create or replace function public.mark_notification_read(
  p_notification_id uuid
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


  update public.notifications

  set read_at = coalesce(
    read_at,
    now()
  )

  where id = p_notification_id
    and user_id = current_user_id;


  if not found then
    raise exception 'Notification not found'
      using errcode = 'P0002';
  end if;

end;
$$;


-- =========================================
-- MARK ALL NOTIFICATIONS AS READ
-- =========================================

create or replace function public.mark_all_notifications_read()
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


  update public.notifications

  set read_at = now()

  where user_id = current_user_id
    and read_at is null;

end;
$$;


-- =========================================
-- DELETE NOTIFICATION
-- =========================================
--
-- Deleting a notification does not delete
-- the underlying follow or book share.
-- =========================================

create or replace function public.delete_notification(
  p_notification_id uuid
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


  delete from public.notifications

  where id = p_notification_id
    and user_id = current_user_id;


  if not found then
    raise exception 'Notification not found'
      using errcode = 'P0002';
  end if;

end;
$$;


-- =========================================
-- UPDATE FOLLOW_USER
-- =========================================
--
-- Creates a notification only when a NEW
-- follow relationship is created.
-- =========================================

create or replace function public.follow_user(
  p_username text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_user_id uuid;
  follow_created boolean := false;
begin

  if current_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;


  if nullif(btrim(p_username), '') is null then
    raise exception 'Username is required'
      using errcode = '22023';
  end if;


  select id
  into target_user_id

  from public.profiles

  where lower(username)
    = lower(btrim(p_username));


  if target_user_id is null then
    raise exception 'User not found'
      using errcode = 'P0002';
  end if;


  if target_user_id = current_user_id then
    raise exception 'You cannot follow yourself'
      using errcode = '22023';
  end if;


  insert into public.follows (
    follower_id,
    following_id
  )
  values (
    current_user_id,
    target_user_id
  )
  on conflict (
    follower_id,
    following_id
  )
  do nothing;


  follow_created := found;


  if follow_created then

    insert into public.notifications (
      user_id,
      actor_user_id,
      type
    )
    values (
      target_user_id,
      current_user_id,
      'follow'
    );

  end if;

end;
$$;


-- =========================================
-- UPDATE SHARE_BOOK
-- =========================================
--
-- IMPORTANT:
-- This version assumes your existing
-- share_book signature is:
--
-- share_book(
--   p_google_books_id text,
--   p_to_username text,
--   p_message text
-- )
--
-- and that books must already exist in
-- public.books before being shared.
-- =========================================

create or replace function public.share_book(
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
  -- INPUT VALIDATION
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
    raise exception
      'You cannot share a book with yourself'
      using errcode = '22023';
  end if;


  -- -------------------------
  -- REQUIRE FOLLOW
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

  where google_books_id =
    p_google_books_id;


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


  -- -------------------------
  -- CREATE NOTIFICATION
  -- -------------------------

  insert into public.notifications (
    user_id,
    actor_user_id,
    type,
    share_id
  )
  values (
    target_user_id,
    current_user_id,
    'book_share',
    share_id
  );


  return share_id;

end;
$$;


-- =========================================
-- FUNCTION PERMISSIONS
-- =========================================


-- GET NOTIFICATIONS

revoke all
on function public.get_my_notifications()
from public, anon;

grant execute
on function public.get_my_notifications()
to authenticated;


-- UNREAD COUNT

revoke all
on function public.get_unread_notification_count()
from public, anon;

grant execute
on function public.get_unread_notification_count()
to authenticated;


-- MARK ONE READ

revoke all
on function public.mark_notification_read(uuid)
from public, anon;

grant execute
on function public.mark_notification_read(uuid)
to authenticated;


-- MARK ALL READ

revoke all
on function public.mark_all_notifications_read()
from public, anon;

grant execute
on function public.mark_all_notifications_read()
to authenticated;


-- DELETE NOTIFICATION

revoke all
on function public.delete_notification(uuid)
from public, anon;

grant execute
on function public.delete_notification(uuid)
to authenticated;


-- FOLLOW USER

revoke all
on function public.follow_user(text)
from public, anon;

grant execute
on function public.follow_user(text)
to authenticated;


-- SHARE BOOK

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