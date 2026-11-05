import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageBackdrop } from '@/components/animation/PageBackdrop';
import { Bracket as HudBracket } from '@/components/ui/Bracket';
import { Bracket } from '@/components/tournament/Bracket';
import { Standings } from '@/components/tournament/Standings';
import { db } from '@/lib/supabase';
import { formatDate } from '@/lib/format';
import type { TournamentFull } from '@/types';
import { TOURNAMENT_FORMATS } from '@/types';

/**
 * Détail d'un tournoi. L'affichage s'adapte au FORMAT sans brancher sur des
 * composants dédiés : arbre(s) pour les éliminations, tableau de classement
 * pour les formats à points, et les deux pour « poules puis arbre ».
 */
export default function TournamentDetailPage() {
  const { slug = '' } = useParams();
  const [t, setT] = useState<TournamentFull | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'missing' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setState('loading');
    db.getTournament(slug)
      .then((x) => {
        if (!x) return setState('missing');
        setT(x);
        setState('ok');
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Erreur');
        setState('error');
      });
  }, [slug]);

  if (state === 'loading') {
    return <Shell><p className="font-mono text-sm text-[color:var(--text-mute)]">&gt; chargement…</p></Shell>;
  }
  if (state === 'error') return <Shell><p className="font-mono text-sm text-accent">{error}</p></Shell>;
  if (state === 'missing' || !t) {
    return (
      <Shell>
        <p className="font-mono text-sm text-[color:var(--text-mute)]">&gt; tournoi introuvable</p>
        <Link to="/tournoi" className="mt-4 inline-block font-mono text-xs uppercase tracking-hud text-accent hover:underline">
          ← tous les tournois
        </Link>
      </Shell>
    );
  }

  const fmt = TOURNAMENT_FORMATS.find((f) => f.id === t.format);
  // Un match de poule n'a pas de `bracket` : on l'exclut explicitement des
  // arbres, sinon il s'affichait comme un tour de bracket.
  const pools = t.matches.filter((m) => m.groupLabel);
  const upper = t.matches.filter((m) => m.bracket === 'winner');
  const lower = t.matches.filter((m) => m.bracket === 'loser');
  const grand = t.matches.filter((m) => m.bracket === 'final');
  const poolNames = [...new Set(pools.map((m) => m.groupLabel!))].sort();
  const isElim = t.format === 'single_elim' || t.format === 'double_elim' || t.format === 'groups_bracket';
  const champion = t.teams.find((x) => x.status === 'winner' || x.placement === 1);

  return (
    <div className="relative">
      <PageBackdrop ghost="BRACKET" />
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <Link to="/tournoi" className="mb-4 inline-block font-mono text-xs uppercase tracking-hud text-[color:var(--text-dim)] hover:text-accent">
          ← tous les tournois
        </Link>

        <PageHeader
          code="02"
          title={t.name}
          subtitle={t.description ?? fmt?.hint}
          meta={
            <div className="text-right font-mono text-[11px] uppercase tracking-hud text-[color:var(--text-dim)]">
              <p>{t.startsAt ? formatDate(t.startsAt) : '—'}</p>
              <p className="mt-1">{t.teams.length} équipes · {t.teamSize}v{t.teamSize}</p>
              {t.prize && <p className="mt-1 text-accent">{t.prize}</p>}
            </div>
          }
        />

        {champion && (
          <div className="mt-8 flex items-center gap-4 border-2 border-accent bg-base-900/60 p-4 shadow-ink">
            <span className="font-mono text-[10px] uppercase tracking-hud text-accent">Vainqueur</span>
            <span className="hud-title text-2xl font-bold">{champion.name}</span>
          </div>
        )}

        {/* ── Arbres ── */}
        {isElim && (upper.length > 0 || lower.length > 0 || grand.length > 0) && (
          <section className="mt-12 space-y-10">
            <Bracket
              matches={upper}
              teams={t.teams}
              title={lower.length ? '[ Upper bracket ]' : '[ Bracket ]'}
            />
            {lower.length > 0 && <Bracket matches={lower} teams={t.teams} title="[ Lower bracket ]" />}
            {grand.length > 0 && <Bracket matches={grand} teams={t.teams} title="[ Grande finale ]" />}
          </section>
        )}

        {/* ── Poules ── */}
        {poolNames.length > 0 && (
          <section className="mt-12 space-y-8">
            {poolNames.map((g) => (
              <Standings
                key={g}
                title={`[ Poule ${g} ]`}
                matches={pools.filter((m) => m.groupLabel === g)}
                teams={t.teams.filter((team) =>
                  pools.some((m) => m.groupLabel === g && (m.teamAId === team.id || m.teamBId === team.id)),
                )}
              />
            ))}
          </section>
        )}

        {/* ── Classement global (formats sans arbre) ── */}
        {!isElim && poolNames.length === 0 && (
          <section className="mt-12">
            <Standings matches={t.matches} teams={t.teams} title="[ Classement ]" />
          </section>
        )}

        {/* ── Équipes et compos ── */}
        <section className="mt-14">
          <p className="hud-label mb-4 flex items-center gap-3 text-xs">
            <HudBracket>ÉQUIPES</HudBracket>
            <span className="h-px flex-1 bg-line-strong" />
            <span className="text-[color:var(--text-mute)]">{t.teams.length}</span>
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {t.teams.map((team) => (
              <article key={team.id} className="border-2 border-line-strong bg-base-900/55 p-4">
                <div className="flex items-center gap-3">
                  {team.logoUrl ? (
                    <img src={team.logoUrl} alt="" className="h-9 w-9 shrink-0 object-contain" />
                  ) : (
                    <span
                      aria-hidden
                      className="flex h-9 w-9 shrink-0 items-center justify-center font-display text-sm font-bold"
                      style={{ background: team.color ?? 'var(--accent)', color: 'var(--ink)' }}
                    >
                      {team.tag?.slice(0, 2) ?? team.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="hud-title truncate text-base font-bold leading-none">{team.name}</p>
                    {team.seed != null && (
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)]">
                        seed #{team.seed}
                      </p>
                    )}
                  </div>
                </div>

                {team.players.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t border-line-strong pt-3">
                    {team.players.map((p) => (
                      <li key={p.id} className="flex items-center gap-2 font-mono text-xs text-[color:var(--text-dim)]">
                        {p.isCaptain && <span className="text-accent" title="Capitaine">★</span>}
                        <span className="truncate">{p.pseudo}</span>
                        {p.role && <span className="ml-auto shrink-0 text-[10px] text-[color:var(--text-mute)]">{p.role}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </section>

        {t.rules && (
          <section className="mt-14">
            <p className="hud-label mb-3 text-xs"><HudBracket>RÈGLEMENT</HudBracket></p>
            <div className="whitespace-pre-wrap border-2 border-line-strong bg-base-900/55 p-5 font-mono text-xs leading-relaxed text-[color:var(--text-dim)]">
              {t.rules}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <PageBackdrop ghost="TOURNOI" />
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-24 sm:px-6">{children}</div>
    </div>
  );
}
