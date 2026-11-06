import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type {
  BrandSettings,
  Game,
  Player,
  Staff,
  Sponsor,
  Match,
  Creator,
  Clip,
  Product,
} from '@/types';
import { db } from '@/lib/supabase';

/**
 * Source de données LIVE du vitrine. Tout le contenu managé (joueurs, staff,
 * jeux, matchs, sponsors, créateurs, clips, produits) vient de Supabase, écrit
 * par le manager. Chargé UNE fois au boot (fetch parallèle) puis lu en synchrone
 * par les sections via useData() — les données sont présentes avant que les
 * sections animées ne montent. Pas de fallback statique (100% Supabase).
 *
 * Les données "structure" sans table (socials, discord, jerseyVariants,
 * audience) restent des imports statiques dans data/*.ts.
 */
export interface LiveData {
  games: Game[];
  players: Player[];
  staff: Staff[];
  sponsors: Sponsor[];
  matches: Match[];
  creators: Creator[];
  clips: Clip[];
  products: Product[];
  /** Nom + logos de la structure, réglés depuis le manager (page Identité). */
  brand: BrandSettings;
}

const Ctx = createContext<LiveData | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LiveData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const [games, players, staff, sponsors, matches, creators, clips, products, brand] =
        await Promise.all([
          db.listGames(),
          db.listPlayers(),
          db.listStaff(),
          db.listSponsors(),
          db.listMatches(),
          db.listCreators(),
          db.listClips(),
          db.listProducts(),
          db.getBrandSettings(),
        ]);
      // Le pipeline de suivi (manager) marque l'état de chaque partenariat :
      // la vitrine n'affiche QUE les partenaires actifs.
      const activeSponsors = sponsors.filter((s) => s.status === 'actif');
      setData({ games, players, staff, sponsors: activeSponsors, matches, creators, clips, products, brand });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Signal perdu');
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (error) return <DataError message={error} onRetry={load} />;
  if (!data) return <DataLoading />;
  return <Ctx.Provider value={data}>{children}</Ctx.Provider>;
}

export function useData(): LiveData {
  const v = useContext(Ctx);
  if (!v) throw new Error('useData doit être utilisé dans <DataProvider>');
  return v;
}

/**
 * Raccourci vers l'identité de marque. À utiliser partout où l'ancien
 * placeholder `__BRAND__` était écrit en dur — le nom vient maintenant de la
 * base et se change depuis le manager sans rebuild.
 */
export function useBrand(): BrandSettings {
  return useData().brand;
}

// ── Écrans de chargement / erreur (DA béton) ──────────────────────────
function DataLoading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-base-900">
      <span className="h-4 w-4 animate-spin border-2 border-[color:var(--accent)] border-t-transparent" />
      <p className="font-mono text-xs uppercase tracking-hud text-[color:var(--text-mute)]">
        &gt; connexion au signal…
      </p>
    </div>
  );
}

function DataError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-base-900 px-4 text-center">
      <p className="font-display text-3xl font-bold uppercase tracking-hud text-accent">Signal perdu</p>
      <p className="max-w-sm font-mono text-xs text-[color:var(--text-dim)]">{message}</p>
      <button
        onClick={onRetry}
        className="border border-line-strong px-4 py-2 font-mono text-xs uppercase tracking-hud text-[color:var(--text)] hover:border-line-bright"
      >
        ↻ réessayer
      </button>
    </div>
  );
}
