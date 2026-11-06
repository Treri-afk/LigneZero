import type { TournamentFull } from '@/types';

/**
 * « Ce qui arrive » — les prochaines rencontres, lobbies et matchs confondus.
 *
 * Pendant un tournoi, c'est la question la plus posée : qui joue, et quand.
 * On remonte donc l'info en haut de page plutôt que de la laisser enfouie
 * dans le bracket ou les rounds.
 */
export function UpNext({ t }: { t: TournamentFull }) {
  const name = (id?: string) => t.teams.find((x) => x.id === id)?.name ?? 'À déterminer';

  // Lobbies en cours ou à jouer, round le plus proche d'abord.
  const lobbies = t.lobbies
    .filter((l) => l.status !== 'finished')
    .sort((a, b) => a.round - b.round || a.position - b.position)
    .slice(0, 4);

  // Matchs de playoffs dont les deux équipes sont connues.
  const matches = t.matches
    .filter((m) => m.status !== 'finished' && m.teamAId && m.teamBId)
    .sort((a, b) => a.round - b.round || a.position - b.position)
    .slice(0, 4);

  if (lobbies.length === 0 && matches.length === 0) return null;

  return (
    <section className="mt-10">
      <p className="hud-label mb-3 flex items-center gap-3 text-[11px]">
        <span className="text-accent">[</span>
        À VENIR
        <span className="text-accent">]</span>
        <span className="h-px flex-1 bg-line-strong" />
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {lobbies.map((l) => (
          <div
            key={l.id}
            className="border-2 bg-base-900/55 px-4 py-3"
            style={{ borderColor: l.status === 'live' ? 'var(--signal-live)' : 'var(--line-strong)' }}
          >
            <p className="mb-1 font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)]">
              Round {l.round} · {l.label ?? `Lobby ${l.position}`}
              {l.status === 'live' && <span className="ml-2 text-[color:var(--signal-live)]">● live</span>}
            </p>
            <p className="font-mono text-xs text-[color:var(--text-dim)]">
              {l.entries.map((e) => name(e.teamId)).join(' · ')}
            </p>
          </div>
        ))}

        {matches.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 border-2 bg-base-900/55 px-4 py-3"
            style={{ borderColor: m.status === 'live' ? 'var(--signal-live)' : 'var(--line-strong)' }}
          >
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)]">
              {m.bracket === 'loser' ? 'LB' : m.bracket === 'final' ? 'GF' : 'UB'} R{m.round}
            </span>
            <span className="min-w-0 flex-1 truncate font-mono text-xs">{name(m.teamAId)}</span>
            <span className="font-mono text-[10px] text-[color:var(--text-mute)]">vs</span>
            <span className="min-w-0 flex-1 truncate text-right font-mono text-xs">{name(m.teamBId)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
