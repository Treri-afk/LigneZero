import type { TournamentMatch, TournamentTeam } from '@/types';

/**
 * Arbre d'élimination. Rendu générique : on se contente de regrouper les
 * matchs par `round` et de les empiler en colonnes. Pas de calcul de
 * coordonnées ni de traits SVG — la lecture se fait par alignement vertical,
 * ce qui reste correct sur mobile (scroll horizontal) là où un arbre tracé
 * devient illisible.
 *
 * Sert aussi bien au bracket vainqueurs qu'au bracket perdants : on filtre en
 * amont et on appelle deux fois.
 */
export function Bracket({
  matches,
  teams,
  title,
}: {
  matches: TournamentMatch[];
  teams: TournamentTeam[];
  title?: string;
}) {
  if (matches.length === 0) return null;

  const byRound = new Map<number, TournamentMatch[]>();
  for (const m of matches) {
    const arr = byRound.get(m.round);
    if (arr) arr.push(m);
    else byRound.set(m.round, [m]);
  }
  const rounds = [...byRound.entries()].sort((a, b) => a[0] - b[0]);
  const last = rounds[rounds.length - 1]?.[0];

  /** Nom du tour déduit du nombre de matchs restants. */
  const roundLabel = (round: number, count: number) => {
    if (round === last && count === 1) return 'FINALE';
    if (count === 1) return 'FINALE';
    if (count === 2) return 'DEMI-FINALES';
    if (count === 4) return 'QUARTS';
    return `TOUR ${round}`;
  };

  return (
    <div>
      {title && <p className="hud-label mb-3 text-[11px]">{title}</p>}
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-5">
          {rounds.map(([round, list]) => (
            <div key={round} className="flex min-w-[240px] flex-1 flex-col">
              <p className="mb-3 border-b border-line-strong pb-2 font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)]">
                {roundLabel(round, list.length)}
              </p>
              {/* `justify-around` fait respirer les tours tardifs : moins de
                  matchs, donc plus d'espace, ce qui imite la forme d'un arbre. */}
              <div className="flex flex-1 flex-col justify-around gap-3">
                {list
                  .sort((a, b) => a.position - b.position)
                  .map((m) => (
                    <BracketMatch key={m.id} m={m} teams={teams} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BracketMatch({ m, teams }: { m: TournamentMatch; teams: TournamentTeam[] }) {
  const find = (id?: string) => teams.find((t) => t.id === id);
  const a = find(m.teamAId);
  const b = find(m.teamBId);
  const live = m.status === 'live';

  return (
    <div
      className="border-2 bg-base-900/70"
      style={{ borderColor: live ? 'var(--signal-live)' : 'var(--line-strong)' }}
    >
      <Side team={a} score={m.scoreA} won={!!m.winnerId && m.winnerId === m.teamAId} />
      <div className="h-px bg-line-strong" />
      <Side team={b} score={m.scoreB} won={!!m.winnerId && m.winnerId === m.teamBId} />
      {live && (
        <p className="border-t border-line-strong px-2 py-0.5 text-center font-mono text-[9px] uppercase tracking-hud text-[color:var(--signal-live)]">
          ● en direct
        </p>
      )}
    </div>
  );
}

function Side({ team, score, won }: { team?: TournamentTeam; score?: number; won: boolean }) {
  return (
    <div
      className="flex items-center gap-2 px-2.5 py-2"
      // Le vainqueur est marqué par un liseré + du contraste, pas par une
      // couleur de fond : lisible aussi en thème clair.
      style={{
        borderLeft: `3px solid ${won ? 'var(--accent)' : 'transparent'}`,
        opacity: team ? (won || score === undefined ? 1 : 0.6) : 0.4,
      }}
    >
      {team?.logoUrl ? (
        <img src={team.logoUrl} alt="" className="h-5 w-5 shrink-0 object-contain" />
      ) : (
        <span
          aria-hidden
          className="flex h-5 w-5 shrink-0 items-center justify-center font-mono text-[9px] font-bold"
          style={{ background: team?.color ?? 'var(--line-strong)', color: 'var(--ink)' }}
        >
          {team?.tag?.slice(0, 2) ?? '—'}
        </span>
      )}
      <span className={`min-w-0 flex-1 truncate font-mono text-xs ${won ? 'font-bold text-[color:var(--text)]' : ''}`}>
        {team?.name ?? 'À déterminer'}
      </span>
      {team?.seed != null && (
        <span className="shrink-0 font-mono text-[9px] text-[color:var(--text-mute)]">#{team.seed}</span>
      )}
      <span className="w-5 shrink-0 text-right font-display text-sm font-bold">
        {score ?? '–'}
      </span>
    </div>
  );
}
