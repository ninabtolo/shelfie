-- Storage upsert checks whether the existing object can be read before
-- replacing it. Keep that access limited to the owner's avatar folder.
drop policy if exists "Users can read their own avatar"
on storage.objects;

create policy "Users can read their own avatar"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
