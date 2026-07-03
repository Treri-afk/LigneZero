-- LigneZero — système de gestion des tryouts / recrutement
-- À coller dans l'éditeur SQL du dashboard Supabase (projet hwhpxmrfwqgzhhrjfurd),
-- puis régénérer les types :
--   npx supabase gen types typescript --project-id hwhpxmrfwqgzhhrjfurd > packages/supabase/src/database.types.ts
--
-- NB : is_staff/is_admin/is_manager/is_perf/is_content/is_design/my_player sont
-- déjà en base mais ne sont trackées dans AUCUN fichier SQL du repo (créées à la
-- main dans le dashboard) — si tu repars d'un projet Supabase vierge un jour,
-- il faudra les reconstituer avant de coller ce fichier. `is_evaluator` ci-dessous
-- est nouvelle et, elle, correctement trackée.

-- ── 0. Rôle "évaluateur" (joueur/coach/staff/manager/admin — pas content/graphiste/member) ──
create or replace function is_evaluator() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role in ('admin', 'manager', 'coach', 'joueur', 'staff')
  );
$$;

-- ── 1. Campagnes de recrutement ──────────────────────────────────────────
create table if not exists tryout_campaigns (
  id text primary key,
  title text not null,
  game_id text references games(id) on delete set null,
  role_sought text,
  description text,
  opens_at date,
  closes_at date,
  status text not null default 'ouverte',
  created_at timestamptz not null default now()
);

alter table tryout_campaigns enable row level security;

create policy "tryout_campaigns read" on tryout_campaigns for select
  using (is_evaluator());
create policy "tryout_campaigns write" on tryout_campaigns for insert
  with check (is_perf());
create policy "tryout_campaigns update" on tryout_campaigns for update
  using (is_perf());
create policy "tryout_campaigns delete" on tryout_campaigns for delete
  using (is_perf());

-- ── 2. Candidats ──────────────────────────────────────────────────────────
create table if not exists candidates (
  id text primary key,
  campaign_id text not null references tryout_campaigns(id) on delete cascade,
  pseudo text not null,
  first_name text,
  last_name text,
  discord text,
  email text,
  role_applied text,
  rank_current text,
  notes text,
  status text not null default 'nouveau',
  -- Jeton opaque du lien public de saisie de dispo — jamais généré côté client,
  -- toujours par défaut Postgres. Ne pas exposer dans une policy anon en lecture directe.
  public_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references profiles(id) on delete set null
);

create index if not exists candidates_campaign_id_idx on candidates(campaign_id);

alter table candidates enable row level security;

create policy "candidates read" on candidates for select
  using (is_evaluator());
create policy "candidates write" on candidates for insert
  with check (is_perf());
create policy "candidates update" on candidates for update
  using (is_perf());
create policy "candidates delete" on candidates for delete
  using (is_perf());

-- ── 3. Évaluations (joueurs/coach/staff notent un candidat) ────────────────
create table if not exists candidate_evaluations (
  id text primary key,
  candidate_id text not null references candidates(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  recommendation text not null check (recommendation in ('oui', 'non', 'mitige')),
  body text not null default '',
  created_at timestamptz not null default now(),
  -- Un seul avis par évaluateur par candidat (il peut le modifier, pas le dupliquer).
  unique (candidate_id, author_id)
);

create index if not exists candidate_evaluations_candidate_id_idx on candidate_evaluations(candidate_id);

alter table candidate_evaluations enable row level security;

create policy "candidate_evaluations read" on candidate_evaluations for select
  using (is_evaluator());
create policy "candidate_evaluations write" on candidate_evaluations for insert
  with check (is_evaluator() and author_id = auth.uid());
create policy "candidate_evaluations update" on candidate_evaluations for update
  using (author_id = auth.uid() or is_admin());
create policy "candidate_evaluations delete" on candidate_evaluations for delete
  using (author_id = auth.uid() or is_admin());

-- ── 4. Disponibilités candidats ─────────────────────────────────────────
-- Pool séparé de `availability` (qui reste réservée aux joueurs de l'effectif,
-- auto-déclarative via auth.uid()). Les candidats n'ont pas de compte : aucun
-- accès direct de la table à `anon`, uniquement via les fonctions RPC plus bas
-- (SECURITY DEFINER, portée strictement au jeton fourni).
create table if not exists candidate_availability (
  id text primary key,
  candidate_id text not null references candidates(id) on delete cascade,
  day date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now()
);

create index if not exists candidate_availability_candidate_id_idx on candidate_availability(candidate_id);

alter table candidate_availability enable row level security;

create policy "candidate_availability read" on candidate_availability for select
  using (is_evaluator());
create policy "candidate_availability staff write" on candidate_availability for insert
  with check (is_perf());
create policy "candidate_availability staff update" on candidate_availability for update
  using (is_perf());
create policy "candidate_availability staff delete" on candidate_availability for delete
  using (is_perf());

-- ── 5. RPC publiques (lien /tryout/:token, aucune auth) ────────────────────
-- Vue minimale : jamais les champs sensibles (email, discord, notes internes,
-- évaluations). Juste de quoi afficher le formulaire de dispo au candidat.
create or replace function get_candidate_public(p_token uuid)
returns table (candidate_id text, pseudo text, campaign_title text, role_sought text, opens_at date, closes_at date, status text)
language sql stable security definer set search_path = public as $$
  select c.id, c.pseudo, tc.title, tc.role_sought, tc.opens_at, tc.closes_at, c.status
  from candidates c
  join tryout_campaigns tc on tc.id = c.campaign_id
  where c.public_token = p_token;
$$;

grant execute on function get_candidate_public(uuid) to anon;

create or replace function get_candidate_availability(p_token uuid)
returns table (day date, start_time time, end_time time)
language sql stable security definer set search_path = public as $$
  select ca.day, ca.start_time, ca.end_time
  from candidate_availability ca
  join candidates c on c.id = ca.candidate_id
  where c.public_token = p_token
  order by ca.day, ca.start_time;
$$;

grant execute on function get_candidate_availability(uuid) to anon;

-- Remplace entièrement les créneaux du candidat identifié par son jeton.
-- p_slots : jsonb array de { "day": "YYYY-MM-DD", "startTime": "HH:MM", "endTime": "HH:MM" }.
create or replace function set_candidate_availability(p_token uuid, p_slots jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_candidate_id text;
begin
  select id into v_candidate_id from candidates where public_token = p_token;
  if v_candidate_id is null then
    raise exception 'jeton invalide';
  end if;

  if jsonb_typeof(p_slots) <> 'array' then
    raise exception 'p_slots doit être un tableau JSON';
  end if;
  if jsonb_array_length(p_slots) > 40 then
    raise exception 'trop de créneaux (max 40)';
  end if;

  delete from candidate_availability where candidate_id = v_candidate_id;

  insert into candidate_availability (id, candidate_id, day, start_time, end_time)
  select
    v_candidate_id || '-' || replace(gen_random_uuid()::text, '-', ''),
    v_candidate_id,
    (slot->>'day')::date,
    (slot->>'startTime')::time,
    (slot->>'endTime')::time
  from jsonb_array_elements(p_slots) as slot
  where (slot->>'startTime')::time < (slot->>'endTime')::time;
end;
$$;

grant execute on function set_candidate_availability(uuid, jsonb) to anon;

-- ── 6. Extension sessions : pracc de tryout liée à une campagne + candidats invités ──
alter table sessions add column if not exists campaign_id text references tryout_campaigns(id) on delete set null;

create table if not exists session_candidates (
  session_id uuid not null references sessions(id) on delete cascade,
  candidate_id text not null references candidates(id) on delete cascade,
  status text not null default 'invite',
  primary key (session_id, candidate_id)
);

alter table session_candidates enable row level security;

create policy "session_candidates read" on session_candidates for select
  using (is_evaluator());
create policy "session_candidates write" on session_candidates for insert
  with check (is_perf());
create policy "session_candidates update" on session_candidates for update
  using (is_perf());
create policy "session_candidates delete" on session_candidates for delete
  using (is_perf());
