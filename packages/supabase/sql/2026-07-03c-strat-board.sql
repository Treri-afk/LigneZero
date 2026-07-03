-- LigneZero — plan tactique par strat ("Valoplant" maison)
-- À coller dans l'éditeur SQL du dashboard Supabase (projet hwhpxmrfwqgzhhrjfurd).
-- Remplace la version précédente de ce fichier (qui ajoutait strats.map_image —
-- abandonné au profit d'un registre de maps réutilisable, cf. plus bas). Sans
-- risque de recoller ce fichier même si l'ancienne version a déjà été appliquée.
-- Puis régénérer les types :
--   npx supabase gen types typescript --project-id hwhpxmrfwqgzhhrjfurd > packages/supabase/src/database.types.ts

-- ── 1. Plan tactique : juste les objets dessinés (le fond vient de valorant_maps, résolu par nom via strats.map) ──
alter table strats add column if not exists board jsonb not null default '[]'::jsonb;
alter table strats drop column if exists map_image;

-- ── 2. Maps — image de fond réutilisable par toutes les strats qui la référencent ──
create table if not exists valorant_maps (
  id text primary key,
  name text not null unique,
  image text,
  created_at timestamptz not null default now()
);

alter table valorant_maps enable row level security;

create policy "valorant_maps read" on valorant_maps for select using (is_evaluator());
create policy "valorant_maps write" on valorant_maps for insert with check (is_perf());
create policy "valorant_maps update" on valorant_maps for update using (is_perf());
create policy "valorant_maps delete" on valorant_maps for delete using (is_perf());

insert into valorant_maps (id, name) values
  ('map-ascent', 'Ascent'), ('map-bind', 'Bind'), ('map-haven', 'Haven'), ('map-split', 'Split'),
  ('map-icebox', 'Icebox'), ('map-breeze', 'Breeze'), ('map-fracture', 'Fracture'), ('map-pearl', 'Pearl'),
  ('map-lotus', 'Lotus'), ('map-sunset', 'Sunset'), ('map-abyss', 'Abyss'), ('map-corrode', 'Corrode')
on conflict (id) do nothing;

-- ── 3. Agents & compétences — données factuelles (noms), pas d'assets. Rayon
-- d'icône par défaut à recalibrer depuis Paramètres → Valoplant si besoin. ──
create table if not exists valorant_agents (
  id text primary key,
  name text not null,
  class text not null default 'duelist',
  created_at timestamptz not null default now()
);

alter table valorant_agents enable row level security;

create policy "valorant_agents read" on valorant_agents for select using (is_evaluator());
create policy "valorant_agents write" on valorant_agents for insert with check (is_perf());
create policy "valorant_agents update" on valorant_agents for update using (is_perf());
create policy "valorant_agents delete" on valorant_agents for delete using (is_perf());

create table if not exists valorant_abilities (
  id text primary key,
  agent_id text not null references valorant_agents(id) on delete cascade,
  slot text not null,
  name text not null,
  category text not null default 'other',
  radius integer not null default 16,
  created_at timestamptz not null default now()
);

create index if not exists valorant_abilities_agent_id_idx on valorant_abilities(agent_id);

alter table valorant_abilities enable row level security;

create policy "valorant_abilities read" on valorant_abilities for select using (is_evaluator());
create policy "valorant_abilities write" on valorant_abilities for insert with check (is_perf());
create policy "valorant_abilities update" on valorant_abilities for update using (is_perf());
create policy "valorant_abilities delete" on valorant_abilities for delete using (is_perf());

insert into valorant_agents (id, name, class) values
  ('jett', 'Jett', 'duelist'), ('phoenix', 'Phoenix', 'duelist'), ('reyna', 'Reyna', 'duelist'),
  ('raze', 'Raze', 'duelist'), ('yoru', 'Yoru', 'duelist'), ('neon', 'Neon', 'duelist'), ('iso', 'Iso', 'duelist'),
  ('sova', 'Sova', 'initiator'), ('breach', 'Breach', 'initiator'), ('skye', 'Skye', 'initiator'),
  ('kayo', 'KAY/O', 'initiator'), ('fade', 'Fade', 'initiator'), ('gekko', 'Gekko', 'initiator'),
  ('brimstone', 'Brimstone', 'controller'), ('omen', 'Omen', 'controller'), ('viper', 'Viper', 'controller'),
  ('astra', 'Astra', 'controller'), ('harbor', 'Harbor', 'controller'), ('clove', 'Clove', 'controller'),
  ('sage', 'Sage', 'sentinel'), ('cypher', 'Cypher', 'sentinel'), ('killjoy', 'Killjoy', 'sentinel'),
  ('chamber', 'Chamber', 'sentinel'), ('deadlock', 'Deadlock', 'sentinel'), ('vyse', 'Vyse', 'sentinel')
on conflict (id) do nothing;

insert into valorant_abilities (id, agent_id, slot, name, category) values
  ('jett-cloudburst', 'jett', 'C', 'Cloudburst', 'smoke'),
  ('jett-updraft', 'jett', 'Q', 'Updraft', 'dash'),
  ('jett-tailwind', 'jett', 'E', 'Tailwind', 'dash'),
  ('jett-blade-storm', 'jett', 'X', 'Blade Storm', 'ultimate'),
  ('phoenix-curveball', 'phoenix', 'C', 'Curveball', 'flash'),
  ('phoenix-hot-hands', 'phoenix', 'Q', 'Hot Hands', 'molotov'),
  ('phoenix-blaze', 'phoenix', 'E', 'Blaze', 'wall'),
  ('phoenix-run-it-back', 'phoenix', 'X', 'Run It Back', 'ultimate'),
  ('reyna-leer', 'reyna', 'C', 'Leer', 'flash'),
  ('reyna-devour', 'reyna', 'Q', 'Devour', 'heal'),
  ('reyna-dismiss', 'reyna', 'E', 'Dismiss', 'dash'),
  ('reyna-empress', 'reyna', 'X', 'Empress', 'ultimate'),
  ('raze-boom-bot', 'raze', 'C', 'Boom Bot', 'recon'),
  ('raze-blast-pack', 'raze', 'Q', 'Blast Pack', 'dash'),
  ('raze-paint-shells', 'raze', 'E', 'Paint Shells', 'molotov'),
  ('raze-showstopper', 'raze', 'X', 'Showstopper', 'ultimate'),
  ('yoru-fakeout', 'yoru', 'C', 'Fakeout', 'decoy'),
  ('yoru-blindside', 'yoru', 'Q', 'Blindside', 'flash'),
  ('yoru-gatecrash', 'yoru', 'E', 'Gatecrash', 'dash'),
  ('yoru-dimensional-drift', 'yoru', 'X', 'Dimensional Drift', 'ultimate'),
  ('neon-fast-lane', 'neon', 'C', 'Fast Lane', 'wall'),
  ('neon-relay-bolt', 'neon', 'Q', 'Relay Bolt', 'flash'),
  ('neon-high-gear', 'neon', 'E', 'High Gear', 'dash'),
  ('neon-overdrive', 'neon', 'X', 'Overdrive', 'ultimate'),
  ('iso-contingency', 'iso', 'C', 'Contingency', 'shield'),
  ('iso-undercut', 'iso', 'Q', 'Undercut', 'recon'),
  ('iso-double-tap', 'iso', 'E', 'Double Tap', 'other'),
  ('iso-kill-contract', 'iso', 'X', 'Kill Contract', 'ultimate'),
  ('sova-owl-drone', 'sova', 'C', 'Owl Drone', 'recon'),
  ('sova-shock-bolt', 'sova', 'Q', 'Shock Bolt', 'molotov'),
  ('sova-recon-bolt', 'sova', 'E', 'Recon Bolt', 'recon'),
  ('sova-hunters-fury', 'sova', 'X', 'Hunter''s Fury', 'ultimate'),
  ('breach-aftershock', 'breach', 'C', 'Aftershock', 'molotov'),
  ('breach-flashpoint', 'breach', 'Q', 'Flashpoint', 'flash'),
  ('breach-fault-line', 'breach', 'E', 'Fault Line', 'stun'),
  ('breach-rolling-thunder', 'breach', 'X', 'Rolling Thunder', 'ultimate'),
  ('skye-regrowth', 'skye', 'C', 'Regrowth', 'heal'),
  ('skye-trailblazer', 'skye', 'Q', 'Trailblazer', 'flash'),
  ('skye-guiding-light', 'skye', 'E', 'Guiding Light', 'flash'),
  ('skye-seekers', 'skye', 'X', 'Seekers', 'ultimate'),
  ('kayo-frag-ment', 'kayo', 'C', 'FRAG/ment', 'molotov'),
  ('kayo-flash-drive', 'kayo', 'Q', 'FLASH/drive', 'flash'),
  ('kayo-zero-point', 'kayo', 'E', 'ZERO/point', 'stun'),
  ('kayo-null-cmd', 'kayo', 'X', 'NULL/cmd', 'ultimate'),
  ('fade-prowler', 'fade', 'C', 'Prowler', 'recon'),
  ('fade-seize', 'fade', 'Q', 'Seize', 'trap'),
  ('fade-haunt', 'fade', 'E', 'Haunt', 'recon'),
  ('fade-nightfall', 'fade', 'X', 'Nightfall', 'ultimate'),
  ('gekko-mosh-pit', 'gekko', 'C', 'Mosh Pit', 'molotov'),
  ('gekko-wingman', 'gekko', 'Q', 'Wingman', 'other'),
  ('gekko-dizzy', 'gekko', 'E', 'Dizzy', 'flash'),
  ('gekko-thrash', 'gekko', 'X', 'Thrash', 'ultimate'),
  ('brimstone-incendiary', 'brimstone', 'C', 'Incendiary', 'molotov'),
  ('brimstone-stim-beacon', 'brimstone', 'Q', 'Stim Beacon', 'other'),
  ('brimstone-sky-smoke', 'brimstone', 'E', 'Sky Smoke', 'smoke'),
  ('brimstone-orbital-strike', 'brimstone', 'X', 'Orbital Strike', 'ultimate'),
  ('omen-paranoia', 'omen', 'C', 'Paranoia', 'flash'),
  ('omen-dark-cover', 'omen', 'Q', 'Dark Cover', 'smoke'),
  ('omen-shrouded-step', 'omen', 'E', 'Shrouded Step', 'dash'),
  ('omen-from-the-shadows', 'omen', 'X', 'From the Shadows', 'ultimate'),
  ('viper-snake-bite', 'viper', 'C', 'Snake Bite', 'molotov'),
  ('viper-poison-cloud', 'viper', 'Q', 'Poison Cloud', 'smoke'),
  ('viper-toxic-screen', 'viper', 'E', 'Toxic Screen', 'wall'),
  ('viper-vipers-pit', 'viper', 'X', 'Viper''s Pit', 'ultimate'),
  ('astra-nova-pulse', 'astra', 'C', 'Nova Pulse', 'stun'),
  ('astra-nebula', 'astra', 'Q', 'Nebula', 'smoke'),
  ('astra-gravity-well', 'astra', 'E', 'Gravity Well', 'other'),
  ('astra-cosmic-divide', 'astra', 'X', 'Cosmic Divide', 'ultimate'),
  ('harbor-cascade', 'harbor', 'C', 'Cascade', 'wall'),
  ('harbor-cove', 'harbor', 'Q', 'Cove', 'shield'),
  ('harbor-high-tide', 'harbor', 'E', 'High Tide', 'wall'),
  ('harbor-reckoning', 'harbor', 'X', 'Reckoning', 'ultimate'),
  ('clove-pick-me-up', 'clove', 'C', 'Pick-me-up', 'heal'),
  ('clove-meddle', 'clove', 'Q', 'Meddle', 'decoy'),
  ('clove-ruse', 'clove', 'E', 'Ruse', 'smoke'),
  ('clove-not-dead-yet', 'clove', 'X', 'Not Dead Yet', 'ultimate'),
  ('sage-slow-orb', 'sage', 'C', 'Slow Orb', 'trap'),
  ('sage-healing-orb', 'sage', 'Q', 'Healing Orb', 'heal'),
  ('sage-barrier-orb', 'sage', 'E', 'Barrier Orb', 'wall'),
  ('sage-resurrection', 'sage', 'X', 'Resurrection', 'ultimate'),
  ('cypher-trapwire', 'cypher', 'C', 'Trapwire', 'trap'),
  ('cypher-cyber-cage', 'cypher', 'Q', 'Cyber Cage', 'trap'),
  ('cypher-spycam', 'cypher', 'E', 'Spycam', 'recon'),
  ('cypher-neural-theft', 'cypher', 'X', 'Neural Theft', 'ultimate'),
  ('killjoy-alarmbot', 'killjoy', 'C', 'Alarmbot', 'trap'),
  ('killjoy-nanoswarm', 'killjoy', 'Q', 'Nanoswarm', 'molotov'),
  ('killjoy-turret', 'killjoy', 'E', 'Turret', 'trap'),
  ('killjoy-lockdown', 'killjoy', 'X', 'Lockdown', 'ultimate'),
  ('chamber-trademark', 'chamber', 'C', 'Trademark', 'trap'),
  ('chamber-headhunter', 'chamber', 'Q', 'Headhunter', 'other'),
  ('chamber-rendezvous', 'chamber', 'E', 'Rendezvous', 'dash'),
  ('chamber-tour-de-force', 'chamber', 'X', 'Tour De Force', 'ultimate'),
  ('deadlock-sonic-sensor', 'deadlock', 'C', 'Sonic Sensor', 'trap'),
  ('deadlock-gravnet', 'deadlock', 'Q', 'GravNet', 'trap'),
  ('deadlock-barrier-mesh', 'deadlock', 'E', 'Barrier Mesh', 'wall'),
  ('deadlock-annihilation', 'deadlock', 'X', 'Annihilation', 'ultimate'),
  ('vyse-shear', 'vyse', 'C', 'Shear', 'trap'),
  ('vyse-arc-rose', 'vyse', 'Q', 'Arc Rose', 'molotov'),
  ('vyse-razorvine', 'vyse', 'E', 'Razorvine', 'wall'),
  ('vyse-steel-garden', 'vyse', 'X', 'Steel Garden', 'ultimate')
on conflict (id) do nothing;
