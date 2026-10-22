-- Keep recommendation results stable indefinitely. A new set is created only
-- when the client explicitly calls POST /api/ai-recommendations.
begin;

create or replace function public.get_my_ai_recommendation_cache()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.ai_recommendation_preferences
    where user_id = auth.uid() and personalization_enabled = true
  ) then
    return jsonb_build_object('books', '[]'::jsonb, 'generated_at', null, 'stale', false, 'complete', false);
  end if;

  select jsonb_build_object(
    'books', coalesce((
      select jsonb_agg(book order by ordinality)
      from jsonb_array_elements(c.books) with ordinality as entries(book, ordinality)
      where not exists (
        select 1 from public.ai_recommendation_dismissals d
        where d.user_id = auth.uid()
          and d.google_books_id = book->>'google_books_id'
      )
    ), '[]'::jsonb),
    'generated_at', c.generated_at,
    'complete', jsonb_array_length(c.books) = 6,
    'stale', false
  )
  into result
  from public.ai_recommendation_cache c
  where c.user_id = auth.uid();

  return coalesce(result, jsonb_build_object(
    'books', '[]'::jsonb,
    'generated_at', null,
    'stale', false,
    'complete', false
  ));
end; $$;

revoke all on function public.get_my_ai_recommendation_cache() from public, anon;
grant execute on function public.get_my_ai_recommendation_cache() to authenticated;

commit;
