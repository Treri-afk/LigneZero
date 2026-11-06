import { useMemo } from 'react';
import type { TournamentMatch, TournamentTeam } from '@/types';

/**
 * Classement calculé depuis les matchs — utilisé par les formats SANS arbre
 * (round robin, suisse) et par chaque poule d'un format à groupes.
 * Rien n'est stocké : le classement est toujours déduit des scores saisis,
 * donc impossible qu'il diverge des résultats.
 */
interface Row {
  team: TournamentTeam;
  played: number;
  won: number;
  lost: number;
  scored: number;
  conceded: number;
}

export function Standings({
  matches,
  teams,
  title,
}: {
  matches: TournamentMatch[];
  teams: TournamentTeam[];
  title?: string;
}) {
  const rows = useMemo<Row[]>(() => {
    const map = new Map<string, Row>();
    const row = (t: TournamentTeam) => {
      let r = map.get(t.id);
      if (!r) {
        r = { team: t, played: 0, won: 0, lost: 0, scored: 0, conceded: 0 };
        map.set(t.id, r);
      }
      return r;
    };
    for (const t of teams) row(t);

    for (const m of matches) {
      if (m.status !== 'finished' || m.scoreA == null || m.scoreB == null) continue;
      const a = teams.find((t) => t.id === m.teamAId);
      const b = teams.find((t) => t.id === m.teamBId);
      if (!a || !b) continue;
      const ra = row(a);
      const rb = row(b);
      ra.played += 1; rb.played += 1;
      ra.scored += m.scoreA; ra.conceded += m.scoreB;
      rb.scored += m.scoreB; rb.conceded += m.scoreA;
      if (m.scoreA > m.scoreB) { ra.won += 1; rb.lost += 1; }
      else if (m.scoreB > m.scoreA) { rb.won += 1; ra.lost += 1; }
    }

    // Tri : victoires, puis différence de score, puis points marqués.
    return [...map.values()].sort(
      (x, y) =>
        y.won - x.won ||
        (y.scored - y.conceded) - (x.scored - x.conceded) ||
        y.scored - x.scored,
    );
  }, [matches, teams]);

  if (rows.length === 0) return null;

  return (
    <div>
      {title && <p className="hud-label mb-3 text-[11px]">{title}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[460px] border-2 border-line-strong">
          <thead>
            <tr className="bg-base-800 font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)]">
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Équipe</th>
              <th className="px-2 py-2 text-right">J</th>
              <th className="px-2 py-2 text-right">V</th>
              <th className="px-2 py-2 text-right">D</th>
              <th className="px-2 py-2 text-right">Diff.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const diff = r.scored - r.conceded;
              return (
                <tr key={r.team.id} className="border-t border-line-strong">
                  <td className="px-3 py-2 font-display text-sm font-bold" style={{ color: i === 0 ? 'var(--accent)' : 'inherit' }}>
                    {i + 1}
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-mono text-xs">{r.team.name}</span>
                    {r.team.tag && <span className="ml-2 font-mono text-[10px] text-[color:var(--text-mute)]">{r.team.tag}</span>}
                  </td>
                  <td className="px-2 py-2 text-right font-mono text-xs text-[color:var(--text-dim)]">{r.played}</td>
                  <td className="px-2 py-2 text-right font-mono text-xs" style={{ color: 'var(--signal-ok)' }}>{r.won}</td>
                  <td className="px-2 py-2 text-right font-mono text-xs text-accent">{r.lost}</td>
                  <td className="px-2 py-2 text-right font-mono text-xs text-[color:var(--text-dim)]">
                    {diff > 0 ? `+${diff}` : diff}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
