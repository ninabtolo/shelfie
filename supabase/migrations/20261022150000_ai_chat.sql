-- SHELFIE: conversational AI recommendations.
-- Reuses ai_recommendation_preferences and get_my_ai_reading_profile so the
-- assistant and automatic recommendations share one privacy control/context.
begin;

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'New conversation',
  user_message_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_conversations_title_length check (char_length(title) between 1 and 120),
  constraint ai_conversations_user_message_count_check check (user_message_count between 0 and 20)
);

create table if not exists public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null,
  content text not null,
  recommendations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint ai_chat_messages_role_check check (role in ('user', 'assistant')),
  constraint ai_chat_messages_content_length check (char_length(content) between 1 and 8000),
  constraint ai_chat_messages_recommendations_array check (jsonb_typeof(recommendations) = 'array'),
  constraint ai_chat_messages_recommendations_limit check (jsonb_array_length(recommendations) <= 8)
);

create index if not exists ai_conversations_user_updated_idx
  on public.ai_conversations(user_id, updated_at desc);

create index if not exists ai_chat_messages_conversation_created_idx
  on public.ai_chat_messages(conversation_id, created_at asc);

alter table public.ai_conversations enable row level security;
alter table public.ai_chat_messages enable row level security;

revoke all on public.ai_conversations from public, anon, authenticated;
revoke all on public.ai_chat_messages from public, anon, authenticated;

drop policy if exists ai_conversations_select on public.ai_conversations;
create policy ai_conversations_select on public.ai_conversations
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists ai_chat_messages_select on public.ai_chat_messages;
create policy ai_chat_messages_select on public.ai_chat_messages
  for select to authenticated using (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = (select auth.uid())
    )
  );

grant select on public.ai_conversations to authenticated;
grant select on public.ai_chat_messages to authenticated;

create or replace function public.create_my_ai_conversation(p_title text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare conversation_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  insert into public.ai_conversations(user_id, title)
  values (auth.uid(), coalesce(nullif(left(btrim(p_title), 120), ''), 'New conversation'))
  returning id into conversation_id;

  return conversation_id;
end; $$;

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

  if p_role = 'user' and conversation.user_message_count >= 20 then
    raise exception 'Message limit reached' using errcode = '54000';
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

create or replace function public.delete_my_ai_conversation(p_conversation_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  delete from public.ai_conversations
  where id = p_conversation_id and user_id = auth.uid();
end; $$;

revoke all on function public.create_my_ai_conversation(text) from public, anon;
revoke all on function public.append_my_ai_chat_message(uuid, text, text, jsonb) from public, anon;
revoke all on function public.delete_my_ai_conversation(uuid) from public, anon;
grant execute on function public.create_my_ai_conversation(text) to authenticated;
grant execute on function public.append_my_ai_chat_message(uuid, text, text, jsonb) to authenticated;
grant execute on function public.delete_my_ai_conversation(uuid) to authenticated;

commit;
