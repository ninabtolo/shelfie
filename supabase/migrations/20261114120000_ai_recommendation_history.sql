-- SHELFIE: avoid repeating books across consecutive recommendation refreshes.
-- Keeps a slim history of the sets that came before the current one. The
-- current set plus this history are excluded from the next generation, so a
-- book can only come back after a few refreshes.
begin;

alter table public.ai_recommendation_cache
  add column if not exists history jsonb not null default '[]'::jsonb;

alter table public.ai_recommendation_cache
  drop constraint if exists ai_recommendation_cache_history_array;
alter table public.ai_recommendation_cache
  add constraint ai_recommendation_cache_history_array
    check (jsonb_typeof(history) = 'array');

alter table public.ai_recommendation_cache
  drop constraint if exists ai_recommendation_cache_history_limit;
-- Two previous sets of six. Together with the current set, the last three
-- refreshes are excluded.
alter table public.ai_recommendation_cache
  add constraint ai_recommendation_cache_history_limit
    check (jsonb_array_length(history) <= 12);

create or replace function public.save_my_ai_recommendations(p_books jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  previous_books jsonb;
  previous_history jsonb;
  next_history jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.ai_recommendation_preferences
    where user_id = auth.uid() and personalization_enabled = true
  ) then
    raise exception 'Personalization is disabled' using errcode = '42501';
  end if;

  if p_books is null or jsonb_typeof(p_books) <> 'array' then
    raise exception 'Invalid recommendation set' using errcode = '22023';
  end if;

  if jsonb_array_length(p_books) > 6 then
    raise exception 'Recommendation set is too large' using errcode = '22023';
  end if;

  select c.books, c.history into previous_books, previous_history
  from public.ai_recommendation_cache c
  where c.user_id = auth.uid()
  for update;

  -- Newest first: the set being replaced, then the older history.
  select coalesce(jsonb_agg(entry order by ord), '[]'::jsonb) into next_history
  from (
    select jsonb_build_object(
      'google_books_id', book->>'google_books_id',
      'title', book->>'title',
      'authors', coalesce(book->'authors', '[]'::jsonb)
    ) as entry, ord
    from jsonb_array_elements(
      coalesce(previous_books, '[]'::jsonb) || coalesce(previous_history, '[]'::jsonb)
    ) with ordinality as entries(book, ord)
    order by ord
    limit 12
  ) recent;

  insert into public.ai_recommendation_cache(user_id, books, history, generated_at, updated_at)
  values (auth.uid(), p_books, next_history, now(), now())
  on conflict (user_id) do update set
    books = excluded.books,
    history = excluded.history,
    generated_at = now(),
    updated_at = now();
end; $$;

-- The current set and the previous ones, newest first, for exclusion only.
create or replace function public.get_my_recent_ai_recommendations()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'google_books_id', book->>'google_books_id',
    'title', book->>'title',
    'authors', coalesce(book->'authors', '[]'::jsonb)
  ) order by ord), '[]'::jsonb)
  into result
  from public.ai_recommendation_cache c,
    jsonb_array_elements(c.books || c.history) with ordinality as entries(book, ord)
  where c.user_id = auth.uid();

  return coalesce(result, '[]'::jsonb);
end; $$;

revoke all on function public.save_my_ai_recommendations(jsonb) from public, anon;
revoke all on function public.get_my_recent_ai_recommendations() from public, anon;
grant execute on function public.save_my_ai_recommendations(jsonb) to authenticated;
grant execute on function public.get_my_recent_ai_recommendations() to authenticated;

commit;
