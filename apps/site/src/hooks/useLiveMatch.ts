import { useEffect, useState } from 'react';
import type { Match } from '@/types';
import { db, supabase } from '@/lib/supabase';
import { getLiveMatch } from '@/lib/format';
import { useData } from '@/data/DataProvider';

/**
 * Match en cours, mis à jour EN TEMPS RÉEL via Supabase Realtime : dès que le
 * staff (ou le bot) passe un match en 'live' ou change le score, le bandeau se
 * met à jour sans rechargement. Amorcé depuis les données déjà chargées.
 */
export function useLiveMatch(): Match | null {
  const { matches } = useData();
  const [live, setLive] = useState<Match | null>(() => getLiveMatch(matches) ?? null);

  useEffect(() => {
    setLive(getLiveMatch(matches) ?? null);
  }, [matches]);

  useEffect(() => {
    const refresh = async () => {
      try {
        setLive(getLiveMatch(await db.listMatches()) ?? null);
      } catch {
        /* silencieux : on garde le dernier état connu */
      }
    };
    // Nom unique par instance : le hook peut être monté plusieurs fois
    // (LiveBar + MatchMode). Un nom partagé ferait planter le 2e abonnement
    // ("cannot add postgres_changes callbacks after subscribe()").
    const channel = supabase
      .channel(`live-matches-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return live;
}
