-- =========================================
-- SHELFIE
-- Follow system
-- =========================================


-- =========================================
-- FOLLOWS TABLE
-- =========================================

create table public.follows (
  follower_id uuid not null
    references public.profiles(id)
    on delete cascade,

  following_id uuid not null
    references public.profiles(id)
    on delete cascade,

  created_at timestamptz not null
    default now(),

  constraint follows_primary_key
    primary key (
      follower_id,
      following_id
    ),

  constraint follows_no_self_follow
    check (
      follower_id <> following_id
    )
);


-- =========================================
-- INDEXES
-- =========================================
--
-- The primary key already helps queries by
-- follower_id.
--
-- This additional index helps queries such
-- as "who follows this user?"
-- =========================================

create index follows_following_created_idx
on public.follows (
  following_id,
  created_at desc
);


-- =========================================
-- ROW LEVEL SECURITY
-- =========================================

alter table public.follows
enable row level security;


-- =========================================
-- TABLE PERMISSIONS
-- =========================================
--
-- Keep raw UUID relationships private.
--
-- Follow/unfollow happens through RPCs.
-- Public relationship information is exposed
-- through views containing usernames only.
-- =========================================

revoke all
on table public.follows
from anon;

revoke all
on table public.follows
from authenticated;


-- =========================================
-- FOLLOW USER
-- =========================================

create function public.follow_user(
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
begin

  -- -------------------------
  -- AUTHENTICATION
  -- -------------------------

  if current_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;


  -- -------------------------
  -- USERNAME VALIDATION
  -- -------------------------

  if nullif(btrim(p_username), '') is null then
    raise exception 'Username is required'
      using errcode = '22023';
  end if;


  -- -------------------------
  -- FIND TARGET USER
  -- -------------------------

  select id
  into target_user_id

  from public.profiles

  where lower(username)
    = lower(btrim(p_username));


  if target_user_id is null then
    raise exception 'User not found'
      using errcode = 'P0002';
  end if;


  -- -------------------------
  -- PREVENT SELF FOLLOW
  -- -------------------------

  if target_user_id = current_user_id then
    raise exception 'You cannot follow yourself'
      using errcode = '22023';
  end if;


  -- -------------------------
  -- CREATE FOLLOW
  -- -------------------------

  insert into public.follows (
    follower_id,
    following_id
  )
  values (
    current_user_id,
    target_user_id
  )

  -- Clicking Follow again should not create
  -- a duplicate relationship.
  on conflict (
    follower_id,
    following_id
  )
  do nothing;

end;
$$;


-- =========================================
-- UNFOLLOW USER
-- =========================================

create function public.unfollow_user(
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


  delete from public.follows

  where follower_id = current_user_id
    and following_id = target_user_id;

end;
$$;


-- =========================================
-- CHECK IF CURRENT USER FOLLOWS PROFILE
-- =========================================
--
-- Useful for deciding whether the profile
-- button displays Follow or Following.
-- =========================================

create function public.is_following(
  p_username text
)
returns boolean
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_user_id uuid;
begin

  if current_user_id is null then
    return false;
  end if;


  select id
  into target_user_id

  from public.profiles

  where lower(username)
    = lower(btrim(p_username));


  if target_user_id is null then
    return false;
  end if;


  return exists (
    select 1

    from public.follows

    where follower_id = current_user_id
      and following_id = target_user_id
  );

end;
$$;


-- =========================================
-- PUBLIC FOLLOWERS
-- =========================================
--
-- Shows who follows whom using public
-- profile information only.
--
-- No UUIDs are exposed.
-- =========================================

drop view if exists public.public_followers;

create view public.public_followers
as
select

  target.username
    as profile_username,

  follower.username
    as follower_username,

  follower.avatar_url
    as follower_avatar_url,

  follower.bio
    as follower_bio,

  f.created_at
    as followed_at

from public.follows f

join public.profiles follower
  on follower.id = f.follower_id

join public.profiles target
  on target.id = f.following_id;


revoke all
on public.public_followers
from public, anon;

grant select
on public.public_followers
to authenticated;


-- =========================================
-- PUBLIC FOLLOWING
-- =========================================
--
-- Shows everyone followed by a profile.
-- =========================================

drop view if exists public.public_following;

create view public.public_following
as
select

  follower.username
    as profile_username,

  target.username
    as following_username,

  target.avatar_url
    as following_avatar_url,

  target.bio
    as following_bio,

  f.created_at
    as followed_at

from public.follows f

join public.profiles follower
  on follower.id = f.follower_id

join public.profiles target
  on target.id = f.following_id;


revoke all
on public.public_following
from public, anon;

grant select
on public.public_following
to authenticated;


-- =========================================
-- PUBLIC FOLLOW STATS
-- =========================================
--
-- Followers/following counters displayed
-- on public profiles.
-- =========================================

drop view if exists public.public_follow_stats;

create view public.public_follow_stats
as
select

  p.username,

  (
    select count(*)::integer

    from public.follows f

    where f.following_id = p.id
  )
    as followers_count,

  (
    select count(*)::integer

    from public.follows f

    where f.follower_id = p.id
  )
    as following_count

from public.profiles p;


revoke all
on public.public_follow_stats
from public, anon;

grant select
on public.public_follow_stats
to authenticated;


-- =========================================
-- FUNCTION PERMISSIONS
-- =========================================


-- FOLLOW

revoke all
on function public.follow_user(text)
from public, anon;

grant execute
on function public.follow_user(text)
to authenticated;


-- UNFOLLOW

revoke all
on function public.unfollow_user(text)
from public, anon;

grant execute
on function public.unfollow_user(text)
to authenticated;


-- IS FOLLOWING

revoke all
on function public.is_following(text)
from public, anon;

grant execute
on function public.is_following(text)
to authenticated;