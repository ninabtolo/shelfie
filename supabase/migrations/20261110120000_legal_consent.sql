-- SHELFIE: record acceptance of the Terms of Use / Privacy Policy and the 18+ age confirmation.
-- New users accept at sign-up (sent as auth metadata and copied by handle_new_user).
-- Existing users, or anyone after a terms update, accept through accept_my_legal_terms().
begin;

alter table public.profiles
  add column if not exists terms_version text,
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists age_confirmed_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_terms_version_length;
alter table public.profiles
  add constraint profiles_terms_version_length
  check (terms_version is null or char_length(terms_version) between 1 and 32);

-- Consent columns are intentionally NOT added to the column-level UPDATE grant
-- (username, avatar_url, bio). They can only change through the RPC below.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  consented boolean :=
    coalesce(meta ->> 'accepted_terms', '') = 'true'
    and coalesce(meta ->> 'confirmed_age', '') = 'true'
    and nullif(btrim(meta ->> 'terms_version'), '') is not null;
begin
  insert into public.profiles (
    id,
    username,
    terms_version,
    terms_accepted_at,
    age_confirmed_at
  )
  values (
    new.id,
    meta ->> 'username',
    case when consented then left(btrim(meta ->> 'terms_version'), 32) end,
    case when consented then now() end,
    case when consented then now() end
  );

  return new;
end;
$function$;

revoke all on function public.handle_new_user() from anon, authenticated, service_role;

create or replace function public.accept_my_legal_terms(p_version text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if nullif(btrim(p_version), '') is null or char_length(p_version) > 32 then
    raise exception 'Invalid terms version' using errcode = '22023';
  end if;

  update public.profiles
  set terms_version = btrim(p_version),
      terms_accepted_at = now(),
      age_confirmed_at = now(),
      updated_at = now()
  where id = auth.uid();
end;
$$;

revoke all on function public.accept_my_legal_terms(text) from public, anon;
grant execute on function public.accept_my_legal_terms(text) to authenticated;

commit;
