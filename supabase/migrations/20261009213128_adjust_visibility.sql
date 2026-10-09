-- =========================================
-- SHELFIE
-- Adjust follow visibility
-- =========================================


-- =========================================
-- REMOVE PUBLIC FOLLOW LISTS
-- =========================================

drop view if exists public.public_followers;

drop view if exists public.public_following;


-- =========================================
-- PRIVATE FOLLOWER LIST
-- =========================================
--
-- Only the logged-in user can retrieve
-- the people who follow them.
-- =========================================

create or replace function public.get_my_followers()
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
    on p.id = f.follower_id

  where f.following_id = auth.uid()

  order by f.created_at desc;
$$;


-- =========================================
-- FUNCTION PERMISSIONS
-- =========================================

revoke all
on function public.get_my_followers()
from public, anon;

grant execute
on function public.get_my_followers()
to authenticated;


-- =========================================
-- PUBLIC FOLLOW STATS
-- =========================================
--
-- Publicly expose counts only.
-- No follower/following lists.
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