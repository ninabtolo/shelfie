-- =========================================
-- SHELFIE
-- User profiles
-- =========================================


-- =========================================
-- PROFILE FIELDS
-- =========================================

alter table public.profiles
add column if not exists avatar_url text,
add column if not exists bio text;

alter table public.user_books
add column if not exists is_public boolean not null default true;


-- -------------------------
-- PROFILE CONSTRAINTS
-- -------------------------

alter table public.profiles
add constraint profiles_bio_length
check (
  bio is null
  or char_length(bio) <= 300
);

alter table public.profiles
add constraint profiles_avatar_url_length
check (
  avatar_url is null
  or char_length(avatar_url) <= 2048
);


-- =========================================
-- UPDATED_AT HELPER
-- =========================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- -------------------------
-- PROFILES UPDATED_AT
-- -------------------------

drop trigger if exists set_profiles_updated_at
on public.profiles;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();


-- -------------------------
-- USER_BOOKS UPDATED_AT
-- -------------------------

drop trigger if exists set_user_books_updated_at
on public.user_books;

create trigger set_user_books_updated_at
before update on public.user_books
for each row
execute function public.set_updated_at();


-- =========================================
-- PRIVATE PROFILE ACCESS
-- =========================================

alter table public.profiles
enable row level security;


-- Remove old broad policy if it still exists
drop policy if exists "Profiles are publicly readable"
on public.profiles;


-- Recreate own-profile read policy safely
drop policy if exists "Users can read their own profile"
on public.profiles;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (
  auth.uid() = id
);


-- Recreate own-profile update policy safely
drop policy if exists "Users can update their own profile"
on public.profiles;

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (
  auth.uid() = id
)
with check (
  auth.uid() = id
);


-- Users can read their own internal profile
grant select
on table public.profiles
to authenticated;


-- They may edit only the profile-facing fields
grant update (
  username,
  avatar_url,
  bio
)
on table public.profiles
to authenticated;

revoke all
on table public.profiles
from anon;


-- =========================================
-- PUBLIC PROFILE VIEW
-- =========================================
--
-- Intentionally exposes ONLY fields that
-- other Shelfie users are allowed to see.
--
-- Internal UUIDs and timestamps are omitted.
-- =========================================

drop view if exists public.public_profiles;

create view public.public_profiles
as
select
  username,
  avatar_url,
  bio
from public.profiles;


revoke all
on public.public_profiles
from public, anon;

grant select
on public.public_profiles
to authenticated;


-- =========================================
-- PUBLIC LIBRARY VIEW
-- =========================================
--
-- Exposes public library content without
-- exposing profiles.id / user_id.
-- =========================================

-- Only public books are exposed through this view. The owner can still
-- access private books through the user_books table policy.
drop view if exists public.public_libraries;

create view public.public_libraries
as
select
  p.username,
  b.google_books_id,
  b.title,
  b.subtitle,
  b.authors,
  b.description,
  b.isbn_10,
  b.isbn_13,
  b.publisher,
  b.published_date,
  b.page_count,
  b.genres,
  b.language,
  b.cover_url,
  ub.status,
  ub.is_favorite,
  ub.is_public,
  ub.created_at as added_at
from public.user_books ub
join public.profiles p on p.id = ub.user_id
join public.books b on b.id = ub.book_id
where ub.is_public = true;


revoke all
on public.public_libraries
from public, anon;

grant select
on public.public_libraries
to authenticated;


-- =========================================
-- AVATAR STORAGE
-- =========================================
--
-- Public bucket because avatars are part of
-- the public Shelfie profile.
--
-- Max file size: 2 MB
-- =========================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id)
do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;


-- =========================================
-- AVATAR STORAGE POLICIES
-- =========================================
--
-- Expected path:
--
-- avatars/
--   USER_UUID/
--     avatar.webp
--
-- =========================================


drop policy if exists "Users can upload their own avatar"
on storage.objects;

create policy "Users can upload their own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);


drop policy if exists "Users can update their own avatar"
on storage.objects;

create policy "Users can update their own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);


drop policy if exists "Users can delete their own avatar"
on storage.objects;

create policy "Users can delete their own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);