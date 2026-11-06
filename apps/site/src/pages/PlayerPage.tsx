import { useDocTitle } from '@/hooks/useDocTitle';
import { Link, useParams } from 'react-router-dom';
import { useData } from '@/data/DataProvider';
import { MediaFrame } from '@/components/ui/MediaFrame';
import { HudFrame } from '@/components/ui/HudFrame';
import { Bracket } from '@/components/ui/Bracket';
import { KeycapButton } from '@/components/ui/KeycapButton';
import { GlitchText } from '@/components/animation/GlitchText';
import { StatusTag } from '@/components/ui/StatusTag';
import { playerSlug, formatDate, sortMatches } from '@/lib/format';

export default function PlayerPage() {
  const { players, games, matches } = useData();
  const { slug } = useParams();
  const player = players.find((p) => playerSlug(p.pseudo) === slug);

  useDocTitle(player ? player.pseudo : 'Joueur');

  if (!player) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <p className="hud-label mb-4 text-xs text-accent">[ ERROR ] &gt; joueur introuvable</p>
        <Link to="/equipe" className="font-mono text-sm text-accent hover:underline">
          [ ← retour roster ]
        </Link>
      </div>
    );
  }

  const game = games.find((g) => g.id === player.gameId);
  const fullName = [player.firstName, player.lastName].filter(Boolean).join(' ');
  const playerMatches = sortMatches(matches.filter((m) => m.gameId === player.gameId)).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      {/* fil d'ariane */}
      <Link
        to="/equipe"
        className="mb-8 inline-block font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-dim)] transition-colors hover:text-accent"
      >
        [ ← roster ]
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr]">
        {/* portrait */}
        <div>
          <MediaFrame
            src={player.photo}
            alt={player.pseudo}
            ratio="3/4"
            label={game?.tag}
            corner={player.country}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            {player.socials.map((s) => (
              <KeycapButton key={s.label} href={s.url} size="sm" variant="secondary">
                {s.label}
              </KeycapButton>
            ))}
          </div>
        </div>

        {/* infos */}
        <div>
          <p className="hud-label mb-3 flex items-center gap-3 text-xs">
            <Bracket>{game?.name ?? '—'}</Bracket>
            <span className="h-px w-10 bg-accent" />
            {player.joinedYear && <span className="text-[color:var(--text-mute)]">EST. {player.joinedYear}</span>}
          </p>

          <h1 className="hud-title text-6xl font-bold leading-none glow-text sm:text-8xl">
            <GlitchText text={player.pseudo} />
          </h1>
          {fullName && <p className="mt-2 font-mono text-sm text-[color:var(--text-dim)]">{fullName}</p>}
          <p className="mt-4 inline-block bg-accent px-3 py-1 font-mono text-xs font-bold uppercase tracking-hud text-[color:var(--paper)]">
            {player.role}
          </p>

          {/* stats */}
          <div className="mt-8 grid grid-cols-3 gap-px border-2 border-line-strong bg-line-strong">
            {player.stats.map((s) => (
              <div key={s.label} className="panel-concrete p-5 text-center">
                <p className="hud-title text-3xl font-bold text-accent">{s.value}</p>
                <p className="hud-label mt-1 text-[9px]">{s.label}</p>
              </div>
            ))}
          </div>

          {/* palmarès */}
          {player.palmares.length > 0 && (
            <div className="mt-8">
              <p className="hud-label mb-3 text-[10px]">[ Palmarès ]</p>
              <ul className="space-y-1.5">
                {player.palmares.map((p) => (
                  <li key={p} className="font-mono text-sm text-[color:var(--text-dim)]">
                    <span className="text-accent">▸</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* setup */}
          {player.setup.length > 0 && (
            <div className="mt-8">
              <p className="hud-label mb-3 text-[10px]">[ Setup ]</p>
              <dl className="space-y-1.5 border-t border-line pt-3 font-mono text-sm">
                {player.setup.map((s) => (
                  <div key={s.label} className="flex justify-between gap-3">
                    <dt className="text-[color:var(--text-mute)]">{s.label}</dt>
                    <dd className="text-right text-[color:var(--text-dim)]">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* matchs liés */}
          {playerMatches.length > 0 && (
            <div className="mt-8">
              <p className="hud-label mb-3 text-[10px]">[ Matchs {game?.tag} ]</p>
              <HudFrame tone="dim" className="cut-panel">
                <ul className="divide-y divide-[color:var(--line)]">
                  {playerMatches.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-4 p-3 font-mono text-xs">
                      <span className="text-[color:var(--text-mute)]">{formatDate(m.dateISO)}</span>
                      <span className="flex-1 truncate text-[color:var(--text-dim)]">vs {m.opponent.name}</span>
                      {m.score && (
                        <span className="font-bold text-[color:var(--text)]">
                          {m.score.us}-{m.score.them}
                        </span>
                      )}
                      <StatusTag status={m.status} />
                    </li>
                  ))}
                </ul>
              </HudFrame>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
