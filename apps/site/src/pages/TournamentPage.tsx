import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageBackdrop } from '@/components/animation/PageBackdrop';
import { Bracket } from '@/components/ui/Bracket';
import { db } from '@/lib/supabase';
import { formatDate } from '@/lib/format';
import type { Tournament } from '@/types';
import { TOURNAMENT_FORMATS } from '@/types';

/**
 * Liste des tournois ORGANISÉS par la structure.
 * Chargés ici et non via le DataProvider : les tournois ne concernent que
 * cette page, inutile de les faire payer au chargement initial du site.
 */
const STATUS: Record<Tournament['status'], { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: 'var(--text-mute)' },
  registration: { label: 'Inscriptions', color: 'var(--signal-warn)' },
  running: { label: 'En cours', color: 'var(--signal-live)' },
  finished: { label: 'Terminé', color: 'var(--signal-ok)' },
};

export default function TournamentPage() {
  const [list, setList] = useState<Tournament[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    db.listTournaments()
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erreur'));
  }, []);

  return (
    <div className="relative">
      <PageBackdrop ghost="TOURNOI" />
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <PageHeader
          code="02"
          title="Tournoi"
          subtitle="Les compétitions que nous organisons. Brackets, équipes et résultats en direct."
          meta={
            list && (
              <span className="hud-title text-5xl font-bold text-accent glow-text">
                {String(list.length).padStart(2, '0')}
              </span>
            )
          }
        />

        {error && <p className="mt-10 font-mono text-sm text-accent">{error}</p>}

        {!list && !error && (
          <p className="mt-10 font-mono text-sm text-[color:var(--text-mute)]">&gt; chargement…</p>
        )}

        {list?.length === 0 && (
          <p className="mt-10 border-2 border-dashed border-line-strong px-4 py-12 text-center font-mono text-sm text-[color:var(--text-mute)]">
            &gt; aucun tournoi publié pour l'instant
          </p>
        )}

        <div className="mt-10 space-y-4">
          {list?.map((t) => {
            const st = STATUS[t.status];
            const fmt = TOURNAMENT_FORMATS.find((f) => f.id === t.format);
            return (
              <Link
                key={t.id}
                to={`/tournoi/${t.slug}`}
                className="group block border-2 border-line-strong bg-base-900/55 transition-all duration-ui hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-accent hover:shadow-ink"
              >
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  {t.coverUrl && (
                    <img src={t.coverUrl} alt="" className="h-20 w-full shrink-0 object-cover sm:w-32" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="hud-label mb-2 text-[10px]">
                      <Bracket>{fmt?.label ?? t.format}</Bracket>
                    </p>
                    <h2 className="hud-title text-2xl font-bold leading-none">{t.name}</h2>
                    <p className="mt-2 font-mono text-[11px] uppercase tracking-hud text-[color:var(--text-dim)]">
                      {t.startsAt ? formatDate(t.startsAt) : 'date à venir'}
                      {t.prize ? ` · ${t.prize}` : ''}
                      {` · équipes de ${t.teamSize}`}
                    </p>
                  </div>
                  <span
                    className="shrink-0 border px-2 py-0.5 font-mono text-[10px] uppercase tracking-hud"
                    style={{ color: st.color, borderColor: 'color-mix(in srgb, currentColor 40%, transparent)' }}
                  >
                    {st.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
