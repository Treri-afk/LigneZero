-- LigneZero — lien candidat accepté ↔ fiche joueur créée automatiquement
-- À coller dans l'éditeur SQL du dashboard Supabase (projet hwhpxmrfwqgzhhrjfurd),
-- après 2026-07-03-tryouts.sql. Puis régénérer les types :
--   npx supabase gen types typescript --project-id hwhpxmrfwqgzhhrjfurd > packages/supabase/src/database.types.ts

alter table candidates add column if not exists converted_player_id text references players(id) on delete set null;
