-- L'écriture dans le bucket `media` était ouverte à TOUT compte authentifié
-- (y compris le rôle `member`, obtenu par simple inscription). On la réserve
-- aux admins. La lecture reste publique : la vitrine affiche logos et photos
-- sans compte.
drop policy if exists "media authenticated write" on storage.objects;
drop policy if exists "media authenticated update" on storage.objects;
drop policy if exists "media authenticated delete" on storage.objects;

create policy "media admin write" on storage.objects
  for insert with check (bucket_id = 'media' and public.is_admin());

create policy "media admin update" on storage.objects
  for update using (bucket_id = 'media' and public.is_admin());

create policy "media admin delete" on storage.objects
  for delete using (bucket_id = 'media' and public.is_admin());
