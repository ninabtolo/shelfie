-- Follow lists are visible only to the profile owner.

create or replace view public.public_followers
as
select
  target.username as profile_username,
  follower.username as follower_username,
  follower.avatar_url as follower_avatar_url,
  follower.bio as follower_bio,
  f.created_at as followed_at
from public.follows f
join public.profiles follower on follower.id = f.follower_id
join public.profiles target on target.id = f.following_id
where target.id = auth.uid();

create or replace view public.public_following
as
select
  follower.username as profile_username,
  target.username as following_username,
  target.avatar_url as following_avatar_url,
  target.bio as following_bio,
  f.created_at as followed_at
from public.follows f
join public.profiles follower on follower.id = f.follower_id
join public.profiles target on target.id = f.following_id
where follower.id = auth.uid();
