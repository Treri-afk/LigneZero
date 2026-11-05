import { useState } from 'react';
import type { TournamentMatch, TournamentTeam } from '@/types';

/**
 * Arbre ÉDITABLE — même lecture en colonnes que l'arbre public, mais chaque
 * match porte ses deux champs de score. On saisit le résultat là où on le lit,
 * sans chercher la ligne correspondante dans une liste à plat.
 */
export function EditableBracket({
  matches,
  teams,
  title,
  busy,
  onScore,
}: {
  matches: TournamentMatch[];
  teams: TournamentTeam[];
  title?: string;
  busy: boolean;
  onScore: (m: TournamentMatch, a: number, b: number) => void;
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

  const roundLabel = (round: number, count: number) => {
    if (count === 1) return round === last ? 'FINALE' : 'DERNIER TOUR';
    if (count === 2) return 'DEMI-FINALES';
    if (count === 4) return 'QUARTS';
    return `TOUR ${round}`;
  };

  return (
    <div className="mt-5">
      {title && <p className="hud-label mb-3 text-[11px]">{title}</p>}
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-4">
          {rounds.map(([round, list]) => (
            <div key={round} className="flex min-w-[290px] flex-1 flex-col">
              <p className="mb-3 border-b border-line-strong pb-2 font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)]">
                {roundLabel(round, list.length)}
              </p>
              <div className="flex flex-1 flex-col justify-around gap-3">
                {list
                  .sort((a, b) => a.position - b.position)
                  .map((m) => (
                    <EditableMatch key={m.id} m={m} teams={teams} busy={busy} onScore={onScore} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EditableMatch({
  m,
  teams,
  busy,
  onScore,
}: {
  m: TournamentMatch;
  teams: TournamentTeam[];
  busy: boolean;
  onScore: (m: TournamentMatch, a: number, b: number) => void;
}) {
  const [a, setA] = useState(m.scoreA ?? 0);
  const [b, setB] = useState(m.scoreB ?? 0);
  const ready = Boolean(m.teamAId && m.teamBId);
  const dirty = a !== (m.scoreA ?? 0) || b !== (m.scoreB ?? 0);

  const name = (id?: string) => teams.find((t) => t.id === id);

  return (
    <div
      className="border-2 bg-base-900/70"
      style={{ borderColor: m.status === 'live' ? 'var(--signal-live)' : 'var(--line-strong)' }}
    >
      <Side team={name(m.teamAId)} value={a} onChange={setA} won={!!m.winnerId && m.winnerId === m.teamAId} disabled={!ready} />
      <div className="h-px bg-line-strong" />
      <Side team={name(m.teamBId)} value={b} onChange={setB} won={!!m.winnerId && m.winnerId === m.teamBId} disabled={!ready} />

      <div className="flex items-center justify-between border-t border-line-strong px-2 py-1">
        <span className="font-mono text-[9px] uppercase tracking-hud text-[color:var(--text-mute)]">
          {ready ? (m.status === 'finished' ? 'terminé' : 'à jouer') : 'en attente'}
        </span>
        <button
          type="button"
          // Un match nul n'a pas de vainqueur à faire remonter : on bloque.
          disabled={busy || !ready || a === b || (!dirty && m.status === 'finished')}
          onClick={() => onScore(m, a, b)}
          className="border border-accent px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-hud text-accent disabled:opacity-30"
          title={a === b ? 'Un vainqueur est requis' : 'Valider'}
        >
          valider
        </button>
      </div>
    </div>
  );
}

function Side({
  team,
  value,
  onChange,
  won,
  disabled,
}: {
  team?: TournamentTeam;
  value: number;
  onChange: (n: number) => void;
  won: boolean;
  disabled: boolean;
}) {
  return (
    <div
      className="flex items-center gap-2 px-2.5 py-1.5"
      style={{ borderLeft: `3px solid ${won ? 'var(--accent)' : 'transparent'}`, opacity: team ? 1 : 0.4 }}
    >
      <span
        aria-hidden
        className="flex h-5 w-5 shrink-0 items-center justify-center font-mono text-[9px] font-bold"
        style={{ background: team?.color ?? 'var(--line-strong)', color: 'var(--ink)' }}
      >
        {team?.tag?.slice(0, 2) ?? '—'}
      </span>
      <span className={`min-w-0 flex-1 truncate font-mono text-xs ${won ? 'font-bold' : ''}`}>
        {team?.name ?? 'À déterminer'}
      </span>
      <input
        type="number"
        min={0}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-11 border border-line-strong bg-base-900 px-1 py-0.5 text-center font-mono text-xs disabled:opacity-30"
      />
    </div>
  );
}
