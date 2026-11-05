import { useState } from 'react';
import type { TournamentMatch, TournamentTeam } from '@/types';
import { Standings } from './Standings';

/**
 * Poules en édition : chaque poule affiche son classement (calculé) ET ses
 * matchs avec saisie. Le classement se met à jour dès qu'un score est validé,
 * ce qui permet de voir immédiatement qui se qualifie.
 */
export function EditableGroups({
  matches,
  teams,
  busy,
  onScore,
  qualifiersPerGroup,
}: {
  matches: TournamentMatch[];
  teams: TournamentTeam[];
  busy: boolean;
  onScore: (m: TournamentMatch, a: number, b: number) => void;
  qualifiersPerGroup: number;
}) {
  const labels = [...new Set(matches.map((m) => m.groupLabel!).filter(Boolean))].sort();
  if (!labels.length) return null;

  return (
    <div className="mt-5 space-y-10">
      {labels.map((g) => {
        const list = matches.filter((m) => m.groupLabel === g);
        const ids = new Set<string>();
        list.forEach((m) => {
          if (m.teamAId) ids.add(m.teamAId);
          if (m.teamBId) ids.add(m.teamBId);
        });
        const groupTeams = teams.filter((t) => ids.has(t.id));

        return (
          <div key={g}>
            <p className="hud-label mb-3 text-[11px]">
              [ Poule {g} ] · {qualifiersPerGroup} qualifié{qualifiersPerGroup > 1 ? 's' : ''}
            </p>
            <Standings matches={list} teams={groupTeams} />
            <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
              {list
                .sort((a, b) => a.position - b.position)
                .map((m) => (
                  <GroupMatch key={m.id} m={m} teams={teams} busy={busy} onScore={onScore} />
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GroupMatch({
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
  const name = (id?: string) => teams.find((t) => t.id === id)?.name ?? '—';
  const done = m.status === 'finished';

  return (
    <div
      className="flex items-center gap-2 border-2 bg-base-900/55 px-3 py-2"
      style={{ borderColor: done ? 'var(--line-strong)' : 'var(--line)' }}
    >
      <span className="min-w-0 flex-1 truncate font-mono text-xs" style={{ fontWeight: m.winnerId === m.teamAId ? 700 : 400 }}>
        {name(m.teamAId)}
      </span>
      <input type="number" min={0} value={a} onChange={(e) => setA(Number(e.target.value) || 0)} className="w-11 border border-line-strong bg-base-900 px-1 py-0.5 text-center font-mono text-xs" />
      <span className="font-mono text-[10px] text-[color:var(--text-mute)]">–</span>
      <input type="number" min={0} value={b} onChange={(e) => setB(Number(e.target.value) || 0)} className="w-11 border border-line-strong bg-base-900 px-1 py-0.5 text-center font-mono text-xs" />
      <span className="min-w-0 flex-1 truncate text-right font-mono text-xs" style={{ fontWeight: m.winnerId === m.teamBId ? 700 : 400 }}>
        {name(m.teamBId)}
      </span>
      <button
        type="button"
        disabled={busy || a === b}
        onClick={() => onScore(m, a, b)}
        className="shrink-0 border border-accent px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-hud text-accent disabled:opacity-30"
      >
        ok
      </button>
    </div>
  );
}
