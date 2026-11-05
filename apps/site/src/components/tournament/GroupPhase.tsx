import type { TournamentFull } from '@/types';
import { activeTeams, standings } from '@/lib/lobbies';

/**
 * Phase de groupes « The Finals », vue PUBLIQUE (lecture seule).
 *
 * Trois choses à faire comprendre d'un coup d'œil : où on en est au
 * classement, qui se qualifie, et ce qui reste à jouer.
 */
export function GroupPhase({ t, qualified }: { t: TournamentFull; qualified: number }) {
  if (t.lobbies.length === 0) return null;

  const table = standings(activeTeams(t.teams), t.lobbies);
  const rounds = [...new Set(t.lobbies.map((l) => l.round))].sort((a, b) => a - b);
  const played = table.some((r) => r.played > 0);
  const name = (id: string) => t.teams.find((x) => x.id === id);

  return (
    <section className="mt-12">
      <p className="hud-label mb-4 flex items-center gap-3 text-xs">
        <span className="text-accent">[</span>
        PHASE DE GROUPES
        <span className="text-accent">]</span>
        <span className="h-px flex-1 bg-line-strong" />
        <span className="text-[color:var(--text-mute)]">
          {rounds.length}/{t.groupRounds} rounds
        </span>
      </p>

      {/* Classement */}
      {played && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-2 border-line-strong">
            <thead>
              <tr className="bg-base-800 font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)]">
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Équipe</th>
                <th className="px-2 py-2 text-right">Points</th>
                <th className="px-2 py-2 text-right">Joués</th>
                <th className="px-2 py-2 text-right">1ers</th>
              </tr>
            </thead>
            <tbody>
              {table.map((r, i) => {
                const cut = qualified > 0 && i + 1 === qualified && table.length > qualified;
                const qualifies = qualified > 0 && i + 1 <= qualified;
                return (
                  <tr
                    key={r.team.id}
                    className="border-t border-line-strong"
                    style={cut ? { borderBottom: '2px solid var(--accent)' } : undefined}
                  >
                    <td
                      className="px-3 py-2 font-display text-sm font-bold"
                      style={{ color: qualifies ? 'var(--accent)' : 'var(--text-mute)' }}
                    >
                      {i + 1}
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs">{r.team.name}</span>
                      {r.team.tag && <span className="ml-2 font-mono text-[10px] text-[color:var(--text-mute)]">{r.team.tag}</span>}
                      {/* Un départage manuel doit être visible, pas caché. */}
                      {r.team.tiebreakNote && (
                        <span className="ml-2 font-mono text-[10px] text-[color:var(--text-dim)]" title={r.team.tiebreakNote}>
                          ⚖ départage
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right font-display text-base font-bold text-accent">{r.points}</td>
                    <td className="px-2 py-2 text-right font-mono text-xs text-[color:var(--text-dim)]">{r.played}</td>
                    <td className="px-2 py-2 text-right font-mono text-xs text-[color:var(--text-dim)]">{r.wins || ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {qualified > 0 && table.length > qualified && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)]">
              &gt; les {qualified} premiers rejoignent la phase finale
            </p>
          )}
        </div>
      )}

      {/* Rounds et lobbies */}
      {rounds.map((round) => {
        const list = t.lobbies.filter((l) => l.round === round).sort((a, b) => a.position - b.position);
        const done = list.every((l) => l.status === 'finished');
        return (
          <div key={round} className="mt-8">
            <p className="hud-label mb-3 flex items-center gap-3 text-[11px]">
              [ Round {round} ]
              <span className="h-px flex-1 bg-line-strong" />
              <span className="text-[color:var(--text-mute)]">{done ? 'terminé' : 'à jouer'}</span>
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {list.map((l) => {
                const sorted = [...l.entries].sort((a, b) => (a.placement ?? 99) - (b.placement ?? 99));
                return (
                  <div key={l.id} className="border-2 border-line-strong bg-base-900/55">
                    <div className="flex items-center justify-between border-b border-line-strong px-3 py-2">
                      <span className="font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-dim)]">
                        {l.label ?? `Lobby ${l.position}`}
                      </span>
                      <span
                        className="font-mono text-[9px] uppercase tracking-hud"
                        style={{ color: l.status === 'live' ? 'var(--signal-live)' : 'var(--text-mute)' }}
                      >
                        {l.status === 'finished' ? '' : l.status === 'live' ? '● live' : 'à venir'}
                      </span>
                    </div>
                    <ul>
                      {sorted.map((e) => {
                        const team = name(e.teamId);
                        return (
                          <li
                            key={e.id}
                            className="flex items-center gap-2 border-b border-line-strong px-3 py-1.5 last:border-b-0"
                            style={{ opacity: e.dnf ? 0.45 : 1 }}
                          >
                            <span
                              className="w-4 shrink-0 text-center font-display text-xs font-bold"
                              style={{ color: e.placement === 1 ? 'var(--accent)' : 'var(--text-mute)' }}
                            >
                              {e.placement ?? '–'}
                            </span>
                            <span
                              aria-hidden
                              className="h-4 w-4 shrink-0"
                              style={{ background: team?.color ?? 'var(--line-strong)' }}
                            />
                            <span className={`min-w-0 flex-1 truncate font-mono text-[11px] ${e.dnf ? 'line-through' : ''}`}>
                              {team?.name ?? '—'}
                            </span>
                            {e.dnf ? (
                              <span className="font-mono text-[9px] uppercase text-accent">dnf</span>
                            ) : (
                              <span className="font-mono text-[11px] text-[color:var(--text-dim)]">
                                {l.status === 'finished' ? e.points : ''}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
