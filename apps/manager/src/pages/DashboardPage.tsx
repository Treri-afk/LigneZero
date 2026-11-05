import { useEffect, useState } from 'react';
import { useBrand } from '@/lib/useBrand';
import { Link } from 'react-router-dom';
import { db } from '@/lib/supabase';
import { NAV, navFor } from '@/lib/nav';
import { useAuth } from '@/auth/AuthProvider';
import { Spinner } from '@/components/ui';

const ENTITY_PATHS = ['/players', '/staff', '/games', '/matches', '/sponsors', '/creators', '/clips', '/products'];

type Counts = Record<string, number>;

/** Vue d'ensemble : nombre d'entrées par entité (données live). */
export function DashboardPage() {
  const brand = useBrand();
  const { role } = useAuth();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [players, staff, games, matches, sponsors, creators, clips, products] =
          await Promise.all([
            db.listPlayers(),
            db.listStaff(),
            db.listGames(),
            db.listMatches(),
            db.listSponsors(),
            db.listCreators(),
            db.listClips(),
            db.listProducts(),
          ]);
        setCounts({
          '/players': players.length,
          '/staff': staff.length,
          '/games': games.length,
          '/matches': matches.length,
          '/sponsors': sponsors.length,
          '/creators': creators.length,
          '/clips': clips.length,
          '/products': products.length,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur de chargement');
      }
    })();
  }, []);

  const allowed = new Set(navFor(role).map((n) => n.path));
  const cards = NAV.filter((n) => ENTITY_PATHS.includes(n.path) && allowed.has(n.path));

  return (
    <div>
      <header className="mb-8">
        <p className="hud-label text-[11px]">{brand.name} // Console</p>
        <h1 className="font-display text-3xl font-bold uppercase tracking-hud">Tableau de bord</h1>
      </header>

      {error && (
        <p className="mb-6 border border-[color:var(--accent)] px-3 py-2 font-mono text-xs text-accent">
          {error}
        </p>
      )}

      {!counts && !error && <Spinner label="Lecture de la base…" />}

      {counts && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {cards.map((n) => (
            <Link
              key={n.path}
              to={n.path}
              className="panel group p-5 transition-colors hover:border-line-bright"
            >
              <p className="hud-label text-[10px]">{n.code}</p>
              <p className="mt-3 font-display text-4xl font-bold text-[color:var(--text)] group-hover:text-accent">
                {counts[n.path] ?? 0}
              </p>
              <p className="mt-1 font-mono text-xs text-[color:var(--text-dim)]">{n.label}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
