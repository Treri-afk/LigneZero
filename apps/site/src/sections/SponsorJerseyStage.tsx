import { Component, lazy, Suspense, useMemo, useState, type ReactNode } from 'react';
import type { SponsorTier } from '@/types';
import { HudFrame } from '@/components/ui/HudFrame';
import { useData } from '@/data/DataProvider';
import { placeSponsors, type PlacedSponsor } from '@/lib/jerseyAnchors';

const SponsorJersey = lazy(() => import('@/components/3d/SponsorJersey'));

const TIER_LABEL: Record<SponsorTier, string> = {
  principal: 'Partenaire principal',
  officiel: 'Partenaire officiel',
  technique: 'Partenaire technique',
};

/* ── Fallbacks 3D (chargement + WebGL indisponible) ─────────────── */
function Loader3D() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3">
      <p className="hud-label text-[10px]">
        [ 3D ] <span className="text-accent">&gt;</span> chargement du maillot…
      </p>
      <div className="flex gap-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="h-3 w-2 bg-accent"
            style={{ animation: `blink 1.1s steps(1) ${i * 0.08}s infinite`, opacity: 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}

class GLBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Repli sans WebGL : la liste des sponsors + emplacements, en dur. */
function StaticFallback({ placed }: { placed: PlacedSponsor[] }) {
  return (
    <div className="grid h-full grid-cols-1 content-center gap-2 p-6 sm:grid-cols-2">
      {placed.map(({ sponsor, anchor }) => (
        <a
          key={sponsor.id}
          href={sponsor.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between border-2 border-line-strong bg-base-900/70 px-4 py-3 transition-colors hover:border-accent"
        >
          <span className="hud-title text-lg font-bold">{sponsor.name}</span>
          <span className="hud-label text-[9px]">{anchor.label}</span>
        </a>
      ))}
    </div>
  );
}

/* ── Panneau HUD du sponsor sélectionné ─────────────────────────── */
function SelectedPanel({ placed }: { placed: PlacedSponsor | null }) {
  if (!placed) {
    return (
      <div className="p-5">
        <p className="hud-label text-[10px]">[ Lecture ]</p>
        <p className="mt-3 font-mono text-sm leading-relaxed text-[color:var(--text-dim)]">
          <span className="text-accent">&gt;</span> Clique un patch sur le maillot — ou un partenaire
          dans la liste. La caméra pivote et zoome sur son emplacement.
        </p>
      </div>
    );
  }

  const { sponsor, anchor } = placed;
  const col = sponsor.color ?? 'var(--accent)';

  return (
    <div className="p-5" aria-live="polite">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2" style={{ background: col }} aria-hidden />
        <span className="hud-label text-[9px]">{TIER_LABEL[sponsor.tier]}</span>
      </div>

      <h3
        className="hud-title mt-2 text-3xl font-bold leading-none"
        style={{ textShadow: `3px 3px 0 var(--base-900), 5px 5px 0 ${col}` }}
      >
        {sponsor.name}
      </h3>

      {sponsor.tagline && (
        <p className="mt-3 font-mono text-sm italic leading-relaxed text-[color:var(--text-dim)]">
          « {sponsor.tagline} »
        </p>
      )}

      <dl className="mt-5 space-y-2 border-t border-line pt-4 font-mono text-xs">
        <div className="flex justify-between gap-3">
          <dt className="text-[color:var(--text-mute)]">Emplacement</dt>
          <dd className="text-right text-[color:var(--text)]">{anchor.label}</dd>
        </div>
        {sponsor.sector && (
          <div className="flex justify-between gap-3">
            <dt className="text-[color:var(--text-mute)]">Secteur</dt>
            <dd className="text-right text-[color:var(--text)]">{sponsor.sector}</dd>
          </div>
        )}
        {sponsor.since && (
          <div className="flex justify-between gap-3">
            <dt className="text-[color:var(--text-mute)]">Depuis</dt>
            <dd className="text-right text-[color:var(--text)]">{sponsor.since}</dd>
          </div>
        )}
      </dl>

      {sponsor.description && (
        <p className="mt-4 font-mono text-xs leading-relaxed text-[color:var(--text-dim)]">
          {sponsor.description}
        </p>
      )}

      <a
        href={sponsor.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-block border-2 bg-base-900/70 px-4 py-2 font-mono text-xs font-bold uppercase tracking-hud shadow-ink-sm transition-all hover:-translate-y-0.5 hover:brightness-125"
        style={{ borderColor: col, color: col }}
      >
        Visiter ↗
      </a>
    </div>
  );
}

/* ── Composition ────────────────────────────────────────────────── */
export function SponsorJerseyStage() {
  const { sponsors } = useData();
  const placed = useMemo(() => placeSponsors(sponsors), [sponsors]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = placed.find((p) => p.sponsor.id === selectedId) ?? null;

  if (placed.length === 0) return null;

  return (
    <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
      {/* ── SCÈNE 3D ── */}
      <HudFrame label="JERSEY // PARTENAIRES" corner="CLICK A SPONSOR" tone="accent" className="cut-panel">
        <div
          className="relative h-[460px] w-full sm:h-[600px]"
          style={{
            background:
              'radial-gradient(70% 60% at 50% 40%, #3a352e 0%, #201d18 45%, var(--base-900) 100%)',
          }}
        >
          <GLBoundary fallback={<StaticFallback placed={placed} />}>
            <Suspense fallback={<Loader3D />}>
              <SponsorJersey placed={placed} selectedId={selectedId} onSelect={setSelectedId} />
            </Suspense>
          </GLBoundary>

          {/* HUD flottant : reset caméra */}
          {selectedId && (
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="absolute right-3 top-3 z-10 border-2 border-line-strong bg-base-900/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-dim)] transition-colors hover:border-accent hover:text-[color:var(--text)]"
            >
              ✕ vue d'ensemble
            </button>
          )}
        </div>
      </HudFrame>

      {/* ── RAIL + FICHE ── */}
      <div className="flex flex-col gap-4">
        <HudFrame label="PARTENAIRES" corner={String(placed.length).padStart(2, '0')} className="cut-panel">
          <div className="flex flex-col gap-1.5 p-3">
            {placed.map(({ sponsor, anchor }) => {
              const active = sponsor.id === selectedId;
              const col = sponsor.color ?? 'var(--accent)';
              return (
                <button
                  key={sponsor.id}
                  type="button"
                  onClick={() => setSelectedId(active ? null : sponsor.id)}
                  aria-pressed={active}
                  className={[
                    'flex items-center justify-between gap-3 border-2 px-3 py-2 text-left transition-all duration-snap',
                    active
                      ? '-translate-y-0.5 bg-base-800 shadow-ink-sm'
                      : 'border-line-strong bg-base-900/60 hover:border-line-bright',
                  ].join(' ')}
                  style={{ borderColor: active ? col : undefined }}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0" style={{ background: col, opacity: active ? 1 : 0.55 }} aria-hidden />
                    <span
                      className={`hud-title text-sm font-bold ${active ? 'text-[color:var(--text)]' : 'text-[color:var(--text-mute)]'}`}
                    >
                      {sponsor.name}
                    </span>
                  </span>
                  <span className="hud-label text-[8px] leading-tight">{anchor.label}</span>
                </button>
              );
            })}
          </div>
        </HudFrame>

        <HudFrame label="FICHE" corner={selected ? 'LOCK' : 'IDLE'} tone={selected ? 'accent' : 'dim'} className="cut-panel">
          <SelectedPanel placed={selected} />
        </HudFrame>
      </div>
    </div>
  );
}
