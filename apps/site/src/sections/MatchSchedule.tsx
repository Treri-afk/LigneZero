import { useEffect, useMemo, useState } from 'react';
import type { MatchStatus } from '@/types';
import { useData } from '@/data/DataProvider';
import { useAuth } from '@/auth/AuthProvider';
import { db } from '@/lib/supabase';
import { StatusTag } from '@/components/ui/StatusTag';
import { FunnelStage } from '@/components/animation/FunnelStage';
import { formatDate, formatTime, sortMatches } from '@/lib/format';

const ALL = 'all';
const STATUSES: { id: MatchStatus | typeof ALL; label: string }[] = [
  { id: ALL, label: 'Tous' },
  { id: 'upcoming', label: 'À venir' },
  { id: 'live', label: 'Live' },
  { id: 'finished', label: 'Terminés' },
];

function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'border-2 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-hud transition-all duration-snap',
        active
          ? 'border-accent bg-accent text-[color:var(--paper)] shadow-ink-sm'
          : 'border-line-strong text-[color:var(--text-dim)] hover:border-accent hover:text-[color:var(--text)]',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

/** Agenda matchs — filtres jeu/statut, tri chrono. Données data/matches.ts. */
export function MatchSchedule() {
  const { matches, games, brand } = useData();
  const { session } = useAuth();
  const [game, setGame] = useState<string>(ALL);
  const [status, setStatus] = useState<MatchStatus | typeof ALL>(ALL);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!session) {
      setFavIds(new Set());
      return;
    }
    db.listMyFavorites().then((f) => setFavIds(new Set(f.map((x) => x.matchId))));
  }, [session]);

  async function toggleFavorite(matchId: string) {
    if (!session) return;
    if (favIds.has(matchId)) {
      await db.removeFavorite(matchId);
      setFavIds((s) => {
        const n = new Set(s);
        n.delete(matchId);
        return n;
      });
    } else {
      await db.addFavorite(matchId);
      setFavIds((s) => new Set(s).add(matchId));
    }
  }

  const list = useMemo(() => {
    const filtered = matches.filter(
      (m) => (game === ALL || m.gameId === game) && (status === ALL || m.status === status),
    );
    return sortMatches(filtered);
  }, [game, status]);

  const gameTag = (id: string) => games.find((g) => g.id === id)?.tag ?? '—';

  return (
    <div className="mt-10">
      {/* filtres */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <FilterBtn key={s.id} active={status === s.id} onClick={() => setStatus(s.id)}>
              {s.label}
            </FilterBtn>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterBtn active={game === ALL} onClick={() => setGame(ALL)}>
            Tous jeux
          </FilterBtn>
          {games.map((g) => (
            <FilterBtn key={g.id} active={game === g.id} onClick={() => setGame(g.id)}>
              {g.tag}
            </FilterBtn>
          ))}
        </div>
      </div>

      {/* liste — lignes inclinées vers le centre (entonnoir) */}
      <FunnelStage intensity={8} depth={50} perspective={1800} className="space-y-3">
        {list.length === 0 && (
          <p className="font-mono text-sm text-[color:var(--text-mute)]">&gt; Aucun match pour ce filtre.</p>
        )}
        {list.map((m) => {
          const won = m.score && m.score.us > m.score.them;
          return (
            <div
              key={m.id}
              data-tilt
              className="cut-panel panel-concrete grid grid-cols-1 items-center gap-3 border-2 border-line-strong p-4 shadow-ink-sm sm:grid-cols-[auto_1fr_auto] sm:gap-6"
            >
              {/* date / heure */}
              <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-0">
                {session && (
                  <button
                    type="button"
                    onClick={() => toggleFavorite(m.id)}
                    aria-label={favIds.has(m.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    aria-pressed={favIds.has(m.id)}
                    className="order-first font-mono text-lg leading-none transition-colors sm:order-none sm:mb-1"
                    style={{ color: favIds.has(m.id) ? 'var(--accent)' : 'var(--text-mute)' }}
                  >
                    {favIds.has(m.id) ? '★' : '☆'}
                  </button>
                )}
                <span className="font-mono text-sm font-bold uppercase text-[color:var(--text)]">
                  {formatDate(m.dateISO)}
                </span>
                <span className="font-mono text-xs text-[color:var(--text-mute)]">{formatTime(m.dateISO)}</span>
              </div>

              {/* adversaire + compétition */}
              <div className="min-w-0">
                <p className="font-mono text-xs uppercase tracking-hud text-[color:var(--text-mute)]">
                  <span className="text-accent">[{gameTag(m.gameId)}]</span> {m.competition}
                </p>
                <p className="hud-title text-xl font-bold leading-none">
                  <span className="text-[color:var(--text-dim)]">{brand.name}</span>
                  <span className="mx-2 text-[color:var(--text-mute)]">vs</span>
                  {m.opponent.name}
                </p>
              </div>

              {/* statut / score / lien */}
              <div className="flex items-center gap-4">
                {m.score && (
                  <span className={`hud-title text-2xl font-bold ${won ? 'text-signal-ok' : 'text-accent'}`}>
                    {m.score.us}-{m.score.them}
                  </span>
                )}
                <StatusTag status={m.status} />
                {(m.streamUrl || m.vodUrl) && (
                  <a
                    href={m.streamUrl ?? m.vodUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-2 border-accent px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-hud text-accent transition-colors hover:bg-accent hover:text-[color:var(--paper)]"
                  >
                    {m.streamUrl ? '▶ Live' : '⊙ VOD'}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </FunnelStage>
    </div>
  );
}
