-- Identité de marque : UNE seule ligne (id = 'default'), lue publiquement par
-- la vitrine et le studio réseaux, écrite par les admins depuis le manager.
-- Remplace le placeholder __BRAND__ codé en dur dans les deux apps.
create table if not exists public.brand_settings (
  id          text primary key default 'default' check (id = 'default'),
  name        text not null default 'LIGNE ZERO',
  short_name  text not null default 'LZ',
  -- URL publique (bucket media) du logo horizontal et du monogramme carré.
  logo_url    text,
  mark_url    text,
  accent      text not null default '#f23127',
  tagline     text,
  -- handle réseaux commun (sans @), ex. "lignezero"
  handle      text,
  updated_at  timestamptz not null default now()
);

alter table public.brand_settings enable row level security;

-- Lecture publique : la vitrine est consultable sans compte.
drop policy if exists brand_settings_read on public.brand_settings;
create policy brand_settings_read on public.brand_settings
  for select using (true);

-- Écriture réservée aux admins (helper déjà présent dans le projet).
drop policy if exists brand_settings_write on public.brand_settings;
create policy brand_settings_write on public.brand_settings
  for all using (is_admin()) with check (is_admin());

-- Ligne unique garantie dès le départ.
insert into public.brand_settings (id) values ('default')
on conflict (id) do nothing;
