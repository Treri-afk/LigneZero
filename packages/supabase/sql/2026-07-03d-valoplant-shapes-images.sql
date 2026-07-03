-- LigneZero — Valoplant : formes calibrables par compétence + images agents/compétences
-- À coller après 2026-07-03c-strat-board.sql dans l'éditeur SQL du dashboard Supabase.
-- Puis régénérer les types :
--   npx supabase gen types typescript --project-id hwhpxmrfwqgzhhrjfurd > packages/supabase/src/database.types.ts

alter table valorant_agents add column if not exists image text;

alter table valorant_abilities add column if not exists shape text not null default 'circle';
alter table valorant_abilities add column if not exists width integer not null default 16;
alter table valorant_abilities add column if not exists length integer not null default 16;
alter table valorant_abilities add column if not exists image text;
