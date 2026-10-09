-- Keep the following list private to the authenticated user.

create or replace function public.get_my_following()
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
  join public.profiles p on p.id = f.following_id
  where f.follower_id = auth.uid()
  order by f.created_at desc;
$$;

revoke all on function public.get_my_following() from public, anon;
grant execute on function public.get_my_following() to authenticated;
