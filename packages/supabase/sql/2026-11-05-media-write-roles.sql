-- Écriture du bucket `media`.
--
-- Elle était ouverte à TOUT compte authentifié, donc au rôle `member` —
-- celui qu'on obtient par simple inscription, sans validation. C'est le trou
-- à fermer.
--
-- La réserver aux seuls admins serait trop strict : l'upload sert aux photos
-- de joueurs (manager, coach, staff), aux studios (content, graphiste) et à
-- la photo de profil d'un joueur. `is_staff()` ne couvre qu'admin+staff et
-- ne conviendrait pas non plus.
--
-- Règle retenue : tout rôle ATTRIBUÉ peut écrire, `member` ne peut pas.
-- La lecture reste publique (la vitrine affiche logos et photos sans compte)
-- et la suppression reste réservée aux admins : elle est irréversible et peut
-- casser l'affichage d'autres pages.
create or replace function public.can_upload_media()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role is not null and role <> 'member'
  );
$$;

drop policy if exists "media authenticated write"  on storage.objects;
drop policy if exists "media authenticated update" on storage.objects;
drop policy if exists "media authenticated delete" on storage.objects;
drop policy if exists "media admin write"  on storage.objects;
drop policy if exists "media admin update" on storage.objects;

create policy "media role write" on storage.objects
  for insert with check (bucket_id = 'media' and public.can_upload_media());

create policy "media role update" on storage.objects
  for update using (bucket_id = 'media' and public.can_upload_media());

drop policy if exists "media admin delete" on storage.objects;
create policy "media admin delete" on storage.objects
  for delete using (bucket_id = 'media' and public.is_admin());
