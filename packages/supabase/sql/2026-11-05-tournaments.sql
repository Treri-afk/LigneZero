-- Tournois ORGANISÉS par la structure (≠ matchs de l'équipe, table `matches`).
-- Modèle générique : une même structure porte élimination simple, double,
-- poules, round robin et suisse.

create table if not exists public.tournaments (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  name         text not null,
  game_id      text references public.games(id) on delete set null,
  format       text not null default 'single_elim',
  status       text not null default 'draft',
  team_size    int  not null default 3,
  max_teams    int,
  prize        text,
  rules        text,
  description  text,
  cover_url    text,
  starts_at    timestamptz,
  ends_at      timestamptz,
  -- Phase finale : nombre de qualifiés = group_count × qualifiers_per_group.
  group_count          int  not null default 4,
  qualifiers_per_group int  not null default 2,
  playoff_format       text not null default 'single_elim',
  -- Phase de groupes « The Finals » : lobbies à N équipes, points au placement.
  group_rounds    int  not null default 4,
  teams_per_lobby int  not null default 4,
  point_rules     jsonb not null
    default '[{"placement":1,"points":12},{"placement":2,"points":8},{"placement":3,"points":5},{"placement":4,"points":2}]'::jsonb,
  -- keep | random | by_rank
  reseed_mode     text not null default 'by_rank',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.tournament_teams (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  name          text not null,
  tag           text,
  logo_url      text,
  color         text,
  seed          int,
  status        text not null default 'registered',
  placement     int,
  -- Exclusion du tournoi entier (≠ DNF, qui ne vaut que pour un round).
  disqualified        boolean not null default false,
  disqualified_reason text,
  -- Arbitrage manuel du classement. Plus bas = mieux classé, 0 = aucun.
  tiebreak_order int not null default 0,
  tiebreak_note  text,
  created_at    timestamptz not null default now()
);
create index if not exists tournament_teams_tid on public.tournament_teams(tournament_id);

create table if not exists public.tournament_players (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.tournament_teams(id) on delete cascade,
  pseudo     text not null,
  role       text,
  is_captain boolean not null default false,
  sort_order int not null default 0
);
create index if not exists tournament_players_tid on public.tournament_players(team_id);

create table if not exists public.tournament_stages (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  kind          text not null default 'bracket',
  name          text not null,
  sort_order    int not null default 0
);
create index if not exists tournament_stages_tid on public.tournament_stages(tournament_id);

-- Playoffs, strictement 1v1. `next_match_id`/`next_slot` encodent la montée du
-- vainqueur, `loser_match_id`/`loser_slot` la descente en lower bracket.
create table if not exists public.tournament_matches (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  stage_id      uuid references public.tournament_stages(id) on delete cascade,
  bracket       text,
  round         int not null default 1,
  position      int not null default 1,
  group_label   text,
  team_a_id     uuid references public.tournament_teams(id) on delete set null,
  team_b_id     uuid references public.tournament_teams(id) on delete set null,
  score_a       int,
  score_b       int,
  winner_id     uuid references public.tournament_teams(id) on delete set null,
  next_match_id uuid references public.tournament_matches(id) on delete set null,
  next_slot     text,
  loser_match_id uuid references public.tournament_matches(id) on delete set null,
  loser_slot     text,
  status        text not null default 'pending',
  scheduled_at  timestamptz,
  stream_url    text
);
create index if not exists tournament_matches_tid on public.tournament_matches(tournament_id);
create index if not exists tournament_matches_stage on public.tournament_matches(stage_id);

-- Phase de groupes : un lobby oppose N équipes, le placement rapporte des points.
create table if not exists public.tournament_lobbies (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round         int not null default 1,
  position      int not null default 1,
  label         text,
  status        text not null default 'pending',
  scheduled_at  timestamptz,
  stream_url    text,
  created_at    timestamptz not null default now()
);
create index if not exists tournament_lobbies_tid on public.tournament_lobbies(tournament_id, round);

create table if not exists public.tournament_lobby_entries (
  id         uuid primary key default gen_random_uuid(),
  lobby_id   uuid not null references public.tournament_lobbies(id) on delete cascade,
  team_id    uuid not null references public.tournament_teams(id) on delete cascade,
  placement  int,
  points     int not null default 0,
  -- Abandon sur CE round. L'équipe reste dans le tournoi.
  dnf        boolean not null default false,
  sort_order int not null default 0,
  unique (lobby_id, team_id)
);
create index if not exists tournament_lobby_entries_lid on public.tournament_lobby_entries(lobby_id);
create index if not exists tournament_lobby_entries_tid on public.tournament_lobby_entries(team_id);

-- RLS : lecture publique hors brouillon, écriture admin.
alter table public.tournaments             enable row level security;
alter table public.tournament_teams        enable row level security;
alter table public.tournament_players      enable row level security;
alter table public.tournament_stages       enable row level security;
alter table public.tournament_matches      enable row level security;
alter table public.tournament_lobbies      enable row level security;
alter table public.tournament_lobby_entries enable row level security;

drop policy if exists tournaments_read on public.tournaments;
create policy tournaments_read on public.tournaments
  for select using (status <> 'draft' or is_admin());
drop policy if exists tournaments_write on public.tournaments;
create policy tournaments_write on public.tournaments
  for all using (is_admin()) with check (is_admin());

drop policy if exists t_teams_read on public.tournament_teams;
create policy t_teams_read on public.tournament_teams for select using (
  exists (select 1 from public.tournaments t
          where t.id = tournament_id and (t.status <> 'draft' or is_admin())));
drop policy if exists t_teams_write on public.tournament_teams;
create policy t_teams_write on public.tournament_teams
  for all using (is_admin()) with check (is_admin());

drop policy if exists t_players_read on public.tournament_players;
create policy t_players_read on public.tournament_players for select using (
  exists (select 1 from public.tournament_teams tt
          join public.tournaments t on t.id = tt.tournament_id
          where tt.id = team_id and (t.status <> 'draft' or is_admin())));
drop policy if exists t_players_write on public.tournament_players;
create policy t_players_write on public.tournament_players
  for all using (is_admin()) with check (is_admin());

drop policy if exists t_stages_read on public.tournament_stages;
create policy t_stages_read on public.tournament_stages for select using (
  exists (select 1 from public.tournaments t
          where t.id = tournament_id and (t.status <> 'draft' or is_admin())));
drop policy if exists t_stages_write on public.tournament_stages;
create policy t_stages_write on public.tournament_stages
  for all using (is_admin()) with check (is_admin());

drop policy if exists t_matches_read on public.tournament_matches;
create policy t_matches_read on public.tournament_matches for select using (
  exists (select 1 from public.tournaments t
          where t.id = tournament_id and (t.status <> 'draft' or is_admin())));
drop policy if exists t_matches_write on public.tournament_matches;
create policy t_matches_write on public.tournament_matches
  for all using (is_admin()) with check (is_admin());

drop policy if exists t_lobbies_read on public.tournament_lobbies;
create policy t_lobbies_read on public.tournament_lobbies for select using (
  exists (select 1 from public.tournaments t
          where t.id = tournament_id and (t.status <> 'draft' or is_admin())));
drop policy if exists t_lobbies_write on public.tournament_lobbies;
create policy t_lobbies_write on public.tournament_lobbies
  for all using (is_admin()) with check (is_admin());

drop policy if exists t_entries_read on public.tournament_lobby_entries;
create policy t_entries_read on public.tournament_lobby_entries for select using (
  exists (select 1 from public.tournament_lobbies l
          join public.tournaments t on t.id = l.tournament_id
          where l.id = lobby_id and (t.status <> 'draft' or is_admin())));
drop policy if exists t_entries_write on public.tournament_lobby_entries;
create policy t_entries_write on public.tournament_lobby_entries
  for all using (is_admin()) with check (is_admin());
