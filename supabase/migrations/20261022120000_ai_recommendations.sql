-- SHELFIE: AI recommendations, opt-in, dismissals and lightweight abuse protection.
-- Requires existing public.profiles, books, user_books, reviews, wishlist.
begin;

create table if not exists public.ai_recommendation_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  personalization_enabled boolean not null default false,
  last_generation_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_recommendation_dismissals (
  user_id uuid not null references public.profiles(id) on delete cascade,
  google_books_id text not null check (length(btrim(google_books_id)) > 0),
  title text,
  authors text[],
  created_at timestamptz not null default now(),
  primary key (user_id, google_books_id)
);

alter table public.ai_recommendation_preferences enable row level security;
alter table public.ai_recommendation_dismissals enable row level security;

-- No direct access to the generation timestamp. All mutations go through RPCs.
revoke all on public.ai_recommendation_preferences from public, anon, authenticated;
revoke all on public.ai_recommendation_dismissals from public, anon, authenticated;

drop policy if exists ai_preferences_select on public.ai_recommendation_preferences;
create policy ai_preferences_select on public.ai_recommendation_preferences
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists ai_dismissals_select on public.ai_recommendation_dismissals;
create policy ai_dismissals_select on public.ai_recommendation_dismissals
  for select to authenticated using (user_id = (select auth.uid()));

-- Grant SELECT for own rows, but not unrestricted writes.
grant select on public.ai_recommendation_preferences to authenticated;
grant select on public.ai_recommendation_dismissals to authenticated;

create or replace function public.set_my_ai_personalization(p_enabled boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_enabled is null then raise exception 'Invalid setting' using errcode = '22023'; end if;
  insert into public.ai_recommendation_preferences(user_id, personalization_enabled, updated_at)
  values (auth.uid(), p_enabled, now())
  on conflict (user_id) do update set
    personalization_enabled = excluded.personalization_enabled,
    updated_at = now();
end; $$;

create or replace function public.dismiss_my_ai_recommendation(
  p_google_books_id text, p_title text default null, p_authors text[] default null
) returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if nullif(btrim(p_google_books_id), '') is null or length(p_google_books_id) > 256 then
    raise exception 'Invalid book ID' using errcode = '22023';
  end if;
  insert into public.ai_recommendation_dismissals(user_id, google_books_id, title, authors)
  values (auth.uid(), btrim(p_google_books_id), left(p_title, 500), p_authors)
  on conflict (user_id, google_books_id) do nothing;
end; $$;

create or replace function public.restore_my_ai_recommendation(p_google_books_id text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  delete from public.ai_recommendation_dismissals
  where user_id = auth.uid() and google_books_id = p_google_books_id;
end; $$;

-- No recommendation results are persisted. A short cooldown protects the paid API.
create or replace function public.claim_my_ai_recommendation_generation()
returns boolean language plpgsql security definer set search_path = '' as $$
declare accepted boolean;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  insert into public.ai_recommendation_preferences(user_id)
  values (auth.uid()) on conflict (user_id) do nothing;
  update public.ai_recommendation_preferences
  set last_generation_at = now()
  where user_id = auth.uid()
    and personalization_enabled = true
    and (last_generation_at is null or last_generation_at <= now() - interval '20 seconds')
  returning true into accepted;
  return coalesce(accepted, false);
end; $$;

create or replace function public.get_my_ai_reading_profile()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if not exists (
    select 1 from public.ai_recommendation_preferences
    where user_id = auth.uid() and personalization_enabled = true
  ) then
    raise exception 'Personalization is disabled' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'library', coalesce((
      select jsonb_agg(jsonb_build_object(
        'google_books_id', b.google_books_id, 'title', b.title,
        'authors', b.authors, 'genres', b.genres, 'description', left(b.description, 900),
        'language', b.language, 'status', ub.status,
        'favorite', ub.is_favorite,
        'reviews', coalesce((
          select jsonb_agg(jsonb_build_object(
            'rating', r.rating, 'review_text', left(r.review_text, 1500),
            'reading_status', r.reading_status, 'created_at', r.created_at
          ) order by r.created_at desc)
          from public.reviews r where r.user_book_id = ub.id
        ), '[]'::jsonb)
      ) order by ub.updated_at desc)
      from public.user_books ub
      join public.books b on b.id = ub.book_id
      where ub.user_id = auth.uid()
    ), '[]'::jsonb),
    'wishlist', coalesce((
      select jsonb_agg(jsonb_build_object(
        'google_books_id', b.google_books_id, 'title', b.title,
        'authors', b.authors, 'genres', b.genres
      ) order by w.created_at desc)
      from public.wishlist w join public.books b on b.id = w.book_id
      where w.user_id = auth.uid()
    ), '[]'::jsonb),
    'dismissed', coalesce((
      select jsonb_agg(jsonb_build_object(
        'google_books_id', d.google_books_id, 'title', d.title, 'authors', d.authors
      )) from public.ai_recommendation_dismissals d where d.user_id = auth.uid()
    ), '[]'::jsonb)
  ) into result;
  return result;
end; $$;

revoke all on function public.set_my_ai_personalization(boolean) from public, anon;
revoke all on function public.dismiss_my_ai_recommendation(text,text,text[]) from public, anon;
revoke all on function public.restore_my_ai_recommendation(text) from public, anon;
revoke all on function public.claim_my_ai_recommendation_generation() from public, anon;
revoke all on function public.get_my_ai_reading_profile() from public, anon;
grant execute on function public.set_my_ai_personalization(boolean) to authenticated;
grant execute on function public.dismiss_my_ai_recommendation(text,text,text[]) to authenticated;
grant execute on function public.restore_my_ai_recommendation(text) to authenticated;
grant execute on function public.claim_my_ai_recommendation_generation() to authenticated;
grant execute on function public.get_my_ai_reading_profile() to authenticated;
commit;
