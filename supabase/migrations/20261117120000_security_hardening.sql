-- =========================================
-- SHELFIE
-- Security hardening
--
-- 1. Daily AI quotas (chat, conversations, recommendations)
-- 2. Assistant chat messages can only answer a user message
-- 3. Size / format limits on the shared books catalog
-- 4. Avatars must point at the user's own folder in Supabase Storage
-- 5. No repeated follow notifications (follow / unfollow spam)
-- 6. Daily limit on book shares
--
-- The new CHECK constraints are NOT VALID: they apply to every new insert
-- and update, without failing this migration because of older rows.
-- =========================================

begin;

-- =========================================
-- 1. AI USAGE QUOTAS
-- =========================================
--
-- Counters live in their own table (not derived from ai_chat_messages) so
-- that deleting a conversation does not give the quota back.
-- Only SECURITY DEFINER functions touch this table.
-- =========================================

create table if not exists public.ai_usage_limits (
  user_id uuid primary key
    references public.profiles(id)
    on delete cascade,
  window_started_at timestamptz not null default now(),
  chat_messages integer not null default 0,
  conversations integer not null default 0,
  recommendation_runs integer not null default 0,
  last_chat_message_at timestamptz
);

alter table public.ai_usage_limits enable row level security;
revoke all on public.ai_usage_limits from public, anon, authenticated;

create or replace function public.consume_ai_quota(p_kind text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  usage public.ai_usage_limits%rowtype;
  -- Tune the limits here.
  daily_chat_messages constant integer := 30;
  daily_conversations constant integer := 15;
  daily_recommendation_runs constant integer := 10;
  chat_message_gap constant interval := interval '3 seconds';
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  insert into public.ai_usage_limits(user_id)
  values (auth.uid())
  on conflict (user_id) do nothing;

  select * into usage
  from public.ai_usage_limits
  where user_id = auth.uid()
  for update;

  -- Fixed 24-hour window per user.
  if usage.window_started_at <= now() - interval '24 hours' then
    usage.window_started_at := now();
    usage.chat_messages := 0;
    usage.conversations := 0;
    usage.recommendation_runs := 0;
  end if;

  if p_kind = 'chat_message' then
    if usage.last_chat_message_at > now() - chat_message_gap then
      raise exception 'Sending too fast' using errcode = '54000';
    end if;
    if usage.chat_messages >= daily_chat_messages then
      raise exception 'Daily AI limit reached' using errcode = '54000';
    end if;
    usage.chat_messages := usage.chat_messages + 1;
    usage.last_chat_message_at := now();
  elsif p_kind = 'conversation' then
    if usage.conversations >= daily_conversations then
      raise exception 'Daily AI limit reached' using errcode = '54000';
    end if;
    usage.conversations := usage.conversations + 1;
  elsif p_kind = 'recommendations' then
    if usage.recommendation_runs >= daily_recommendation_runs then
      raise exception 'Daily AI limit reached' using errcode = '54000';
    end if;
    usage.recommendation_runs := usage.recommendation_runs + 1;
  else
    raise exception 'Unknown quota' using errcode = '22023';
  end if;

  update public.ai_usage_limits
  set window_started_at = usage.window_started_at,
      chat_messages = usage.chat_messages,
      conversations = usage.conversations,
      recommendation_runs = usage.recommendation_runs,
      last_chat_message_at = usage.last_chat_message_at
  where user_id = auth.uid();
end;
$$;

-- Internal helper: only callable from the functions below.
revoke all on function public.consume_ai_quota(text) from public, anon, authenticated;

-- -------------------------
-- New conversation
-- -------------------------
create or replace function public.create_my_ai_conversation(p_title text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare conversation_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  perform public.consume_ai_quota('conversation');

  insert into public.ai_conversations(user_id, title)
  values (auth.uid(), coalesce(nullif(left(btrim(p_title), 120), ''), 'New conversation'))
  returning id into conversation_id;
  return conversation_id;
end; $$;

-- -------------------------
-- Chat message
-- -------------------------
create or replace function public.append_my_ai_chat_message(
  p_conversation_id uuid,
  p_role text,
  p_content text,
  p_recommendations jsonb default '[]'::jsonb
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  conversation public.ai_conversations%rowtype;
  message_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_role is null or p_role not in ('user', 'assistant')
    or nullif(btrim(p_content), '') is null
    or char_length(p_content) > 8000
    or p_recommendations is null
    or jsonb_typeof(p_recommendations) <> 'array'
    or jsonb_array_length(p_recommendations) > 8 then
    raise exception 'Invalid chat message' using errcode = '22023';
  end if;

  select * into conversation
  from public.ai_conversations
  where id = p_conversation_id and user_id = auth.uid()
  for update;

  if conversation.id is null then
    raise exception 'Conversation not found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.ai_recommendation_preferences
    where user_id = auth.uid() and personalization_enabled = true
  ) then
    raise exception 'Personalization is disabled' using errcode = '42501';
  end if;

  if p_role = 'user' then
    if conversation.user_message_count >= 20 then
      raise exception 'Message limit reached' using errcode = '54000';
    end if;
    perform public.consume_ai_quota('chat_message');
  elsif (
    select count(*)
    from public.ai_chat_messages m
    where m.conversation_id = conversation.id
      and m.role = 'assistant'
  ) >= conversation.user_message_count then
    -- An assistant message must answer a user message: this stops anyone
    -- from filling the table with assistant rows through the API.
    raise exception 'Invalid chat message' using errcode = '22023';
  end if;

  insert into public.ai_chat_messages(conversation_id, role, content, recommendations)
  values (conversation.id, p_role, left(btrim(p_content), 8000), p_recommendations)
  returning id into message_id;

  update public.ai_conversations
  set user_message_count = user_message_count + case when p_role = 'user' then 1 else 0 end,
      updated_at = now()
  where id = conversation.id;

  return jsonb_build_object(
    'id', message_id,
    'conversation_id', conversation.id,
    'user_message_count', conversation.user_message_count + case when p_role = 'user' then 1 else 0 end,
    'messages_remaining', 20 - (conversation.user_message_count + case when p_role = 'user' then 1 else 0 end)
  );
end; $$;

-- -------------------------
-- Recommendation refresh
-- -------------------------
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

  -- Raises when the daily limit is reached, which also rolls back the
  -- last_generation_at update above.
  if coalesce(accepted, false) then
    perform public.consume_ai_quota('recommendations');
  end if;

  return coalesce(accepted, false);
end; $$;

-- =========================================
-- 3. BOOKS CATALOG LIMITS
-- =========================================
--
-- Book rows are shared by every user and written through RPCs that take
-- the metadata from the browser. These limits stop oversized payloads and
-- covers hosted anywhere other than Google Books.
-- =========================================

alter table public.books
  add constraint books_google_books_id_format
    check (google_books_id ~ '^[A-Za-z0-9_-]{1,64}$') not valid,
  add constraint books_title_length
    check (char_length(title) <= 500) not valid,
  add constraint books_subtitle_length
    check (subtitle is null or char_length(subtitle) <= 500) not valid,
  add constraint books_description_length
    check (description is null or char_length(description) <= 20000) not valid,
  add constraint books_authors_size
    check (authors is null or (cardinality(authors) <= 50 and char_length(array_to_string(authors, '')) <= 2000)) not valid,
  add constraint books_genres_size
    check (genres is null or (cardinality(genres) <= 50 and char_length(array_to_string(genres, '')) <= 2000)) not valid,
  add constraint books_publisher_length
    check (publisher is null or char_length(publisher) <= 300) not valid,
  add constraint books_published_date_length
    check (published_date is null or char_length(published_date) <= 32) not valid,
  add constraint books_isbn_length
    check (
      (isbn_10 is null or char_length(isbn_10) <= 20)
      and (isbn_13 is null or char_length(isbn_13) <= 20)
    ) not valid,
  add constraint books_language_length
    check (language is null or char_length(language) <= 16) not valid,
  add constraint books_page_count_max
    check (page_count is null or page_count <= 50000) not valid,
  add constraint books_cover_url_host
    check (
      cover_url is null
      or (
        char_length(cover_url) <= 2048
        and cover_url ~ '^https://(books\.google\.com|books\.googleusercontent\.com)/'
      )
    ) not valid;

-- =========================================
-- 4. AVATAR URL
-- =========================================
--
-- Must be a public URL in the user's own avatars/<user id>/ folder, as the
-- profile editor builds it (optional ?v=<timestamp> cache buster).
-- The local Supabase stack (127.0.0.1:54321) is allowed for development.
-- =========================================

alter table public.profiles
  add constraint profiles_avatar_url_own_storage
    check (
      avatar_url is null
      or avatar_url ~ (
        '^(https://[a-z0-9]+\.supabase\.co|http://(127\.0\.0\.1|localhost):54321)'
        || '/storage/v1/object/public/avatars/'
        || id::text
        || '/[^/?#]+(\?v=[0-9]+)?$'
      )
    ) not valid;

-- =========================================
-- 5. FOLLOW NOTIFICATIONS
-- =========================================
--
-- Unfollowing and following again no longer sends a new notification
-- every time.
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
  where lower(username) = lower(btrim(p_username));

  if target_user_id is null then
    raise exception 'User not found'
      using errcode = 'P0002';
  end if;

  if target_user_id = current_user_id then
    raise exception 'You cannot follow yourself'
      using errcode = '22023';
  end if;

  insert into public.follows (follower_id, following_id)
  values (current_user_id, target_user_id)
  on conflict (follower_id, following_id) do nothing;

  follow_created := found;

  if follow_created and not exists (
    select 1
    from public.notifications n
    where n.user_id = target_user_id
      and n.actor_user_id = current_user_id
      and n.type = 'follow'
  ) then
    insert into public.notifications (user_id, actor_user_id, type)
    values (target_user_id, current_user_id, 'follow');
  end if;
end;
$$;

-- =========================================
-- 6. SHARE LIMIT
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
  normalized_message text := nullif(btrim(p_message), '');
  daily_share_limit constant integer := 20;
begin
  if current_user_id is null then
    raise exception 'Authentication required'
      using errcode = '42501';
  end if;

  if (
    select count(*)
    from public.shares s
    where s.from_user_id = current_user_id
      and s.created_at > now() - interval '24 hours'
  ) >= daily_share_limit then
    raise exception 'Daily share limit reached'
      using errcode = '54000';
  end if;

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
    raise exception 'Message must be 500 characters or less'
      using errcode = '22023';
  end if;

  select id
  into target_user_id
  from public.profiles
  where lower(username) = lower(btrim(p_to_username));

  if target_user_id is null then
    raise exception 'User not found'
      using errcode = 'P0002';
  end if;

  if target_user_id = current_user_id then
    raise exception 'You cannot share a book with yourself'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.follows
    where follower_id = current_user_id
      and following_id = target_user_id
  ) then
    raise exception 'You can only share books with users you follow'
      using errcode = '42501';
  end if;

  select id
  into saved_book_id
  from public.books
  where google_books_id = p_google_books_id;

  if saved_book_id is null then
    raise exception 'Book not found'
      using errcode = 'P0002';
  end if;

  insert into public.shares (from_user_id, to_user_id, book_id, message)
  values (current_user_id, target_user_id, saved_book_id, normalized_message)
  returning id into share_id;

  insert into public.notifications (user_id, actor_user_id, type, share_id)
  values (target_user_id, current_user_id, 'book_share', share_id);

  return share_id;
end;
$$;

commit;
