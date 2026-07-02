import { useEffect, useState } from 'react';
import type { Sponsor, SponsorTier } from '@/types';
import { useData } from '@/data/DataProvider';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * SPOTLIGHT / LOCK-ON : un sponsor à la fois, plein cadre, et TOUT converge
 * vers lui — sol en grille perspective (point de fuite au centre), nom
 * fantôme géant, réticule HUD qui se verrouille sur la marque, chips data
 * papier inclinées en entonnoir (registre des cartes TCG). Rotation auto,
 * pause au survol, vignettes en bas. Ombres/cône DURS, zéro glow.
 */

const TIER_LABEL: Record<SponsorTier, string> = {
  principal: 'Partenaire principal',
  officiel: 'Partenaire officiel',
  technique: 'Partenaire technique',
};
const TIER_SHORT: Record<SponsorTier, string> = {
  principal: 'PRINCIPAL',
  officiel: 'OFFICIEL',
  technique: 'TECHNIQUE',
};

const durFor = (s: Sponsor) => (s.tier === 'principal' ? 8000 : 5500);

/** Chip data papier (registre TCG : valeur teintée marque, ombre dure). */
function DataChip({ value, label, delay, color }: { value: string; label: string; delay: number; color: string }) {
  return (
    <div
      className="spot-in flex items-center gap-2 whitespace-nowrap border-2 border-white/70 bg-paper px-3 py-1.5 shadow-ink"
      style={{
        clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
        animationDelay: `${delay}ms`,
      }}
    >
      <span className="font-display text-2xl font-bold leading-none" style={{ color: `color-mix(in srgb, ${color} 68%, #0a0a0c)` }}>
        {value}
      </span>
      <span className="font-mono text-[8px] uppercase leading-tight tracking-hud text-ink/70">{label}</span>
    </div>
  );
}

/** Équerre du réticule de lock-on (couleur de la marque). */
function RetCorner({ pos, color }: { pos: 'tl' | 'tr' | 'bl' | 'br'; color: string }) {
  const s: React.CSSProperties = { position: 'absolute', width: 38, height: 38 };
  const t = `3px solid ${color}`;
  if (pos.includes('t')) { s.top = 0; s.borderTop = t; } else { s.bottom = 0; s.borderBottom = t; }
  if (pos.includes('l')) { s.left = 0; s.borderLeft = t; } else { s.right = 0; s.borderRight = t; }
  return <span aria-hidden style={s} />;
}

export function SponsorSpotlight() {
  const { sponsors } = useData();
  const reduced = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  const current = sponsors[idx];

  useEffect(() => {
    if (reduced || paused || sponsors.length < 2) return;
    const t = setTimeout(() => setIdx((i) => (i + 1) % sponsors.length), durFor(sponsors[idx]));
    return () => clearTimeout(t);
  }, [idx, paused, reduced, sponsors]);

  if (sponsors.length === 0) return null;

  const num = String(idx + 1).padStart(2, '0');
  // Couleur signature de la marque : toute la scène se teinte à sa DA
  // (le logo au centre reste tel quel — c'est l'environnement qui s'accorde).
  const col = current.color ?? 'var(--accent)';
  const chips: { value: string; label: string }[] = [
    { value: TIER_SHORT[current.tier], label: 'Palier' },
    { value: current.sector ?? '—', label: 'Secteur' },
    { value: current.since ? String(current.since) : '—', label: 'Depuis' },
    { value: num, label: 'Slot' },
  ];
  // Entonnoir : chaque chip pointe vers le centre (mêmes recettes que les
  // piliers de la page Équipe — rotateY vers l'intérieur).
  const SLOTS = [
    { pos: { left: '7%', top: '16%' }, tf: 'rotateX(-8deg) rotateY(30deg)', origin: 'left center' },
    { pos: { right: '7%', top: '22%' }, tf: 'rotateX(-6deg) rotateY(-30deg)', origin: 'right center' },
    { pos: { left: '11%', bottom: '20%' }, tf: 'rotateX(7deg) rotateY(26deg)', origin: 'left center' },
    { pos: { right: '10%', bottom: '16%' }, tf: 'rotateX(8deg) rotateY(-26deg)', origin: 'right center' },
  ] as const;

  return (
    <div className="mt-10">
      {/* ── SCÈNE ── */}
      <div
        className="relative overflow-hidden border-2 border-line-strong bg-base-900"
        style={{ minHeight: 560, perspective: '1200px' }}
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
      >
        {/* sol : grille en perspective — les lignes convergent vers la marque */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%]" style={{ perspective: '650px' }}>
          <div
            className="h-full w-full"
            style={{
              transform: 'rotateX(58deg) scale(1.4)',
              transformOrigin: 'top center',
              backgroundImage:
                'linear-gradient(var(--line-strong) 1px, transparent 1px), linear-gradient(90deg, var(--line-strong) 1px, transparent 1px)',
              backgroundSize: '54px 54px',
              opacity: 0.6,
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 34%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 34%)',
            }}
          />
        </div>

        {/* nom fantôme géant (contour seul, comme le ZERO du hero) */}
        <div
          key={`ghost-${idx}`}
          aria-hidden
          className="spot-in pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap font-display font-bold uppercase leading-none tracking-tighter"
          style={{ fontSize: 'clamp(6rem, 17vw, 15rem)', color: 'transparent', WebkitTextStroke: `1px color-mix(in srgb, ${col} 55%, transparent)`, opacity: 0.8 }}
        >
          {current.name}
        </div>

        {/* cône de lumière dur, large (flicker d'allumage à chaque changement) */}
        <div
          key={`cone-${idx}`}
          aria-hidden
          className="spot-flicker pointer-events-none absolute inset-x-0 bottom-0 top-0"
          style={{
            clipPath: 'polygon(43% 0, 57% 0, 97% 100%, 3% 100%)',
            background: `linear-gradient(to bottom, color-mix(in srgb, ${col} 22%, rgba(232,228,218,0.09)) 0%, color-mix(in srgb, ${col} 6%, transparent) 72%, color-mix(in srgb, ${col} 12%, transparent) 100%)`,
          }}
        />

        {/* bandes hazard latérales pointées vers le centre */}
        <div aria-hidden className="pointer-events-none absolute left-0 top-1/2 hidden h-2 w-[13%] -translate-y-1/2 sm:block"
          style={{ background: `repeating-linear-gradient(45deg, ${col} 0 8px, transparent 8px 16px)`, opacity: 0.55 }} />
        <div aria-hidden className="pointer-events-none absolute right-0 top-1/2 hidden h-2 w-[13%] -translate-y-1/2 sm:block"
          style={{ background: `repeating-linear-gradient(-45deg, ${col} 0 8px, transparent 8px 16px)`, opacity: 0.55 }} />

        {/* rails techniques verticaux */}
        <span aria-hidden className="absolute left-4 top-1/2 hidden -translate-y-1/2 font-mono text-[9px] uppercase tracking-hud text-[color:var(--text-mute)] [writing-mode:vertical-rl] md:block">
          SIGNAL // PARTENAIRE — {TIER_LABEL[current.tier]}
        </span>
        <span aria-hidden className="absolute right-4 top-1/2 hidden -translate-y-1/2 font-mono text-[9px] uppercase tracking-hud text-[color:var(--text-mute)] [writing-mode:vertical-rl] md:block">
          LOCK {num} · SECTOR {current.sector ?? '—'}
        </span>

        {/* header scène : ON AIR + compteur */}
        <div className="absolute left-4 top-4 z-20 flex items-center gap-2 font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-dim)]">
          <span className="h-1.5 w-1.5 animate-live rounded-full bg-accent" />
          ON AIR · CIBLE VERROUILLÉE
        </div>
        <span className="absolute right-4 top-4 z-20 font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)]">
          {num} / {String(sponsors.length).padStart(2, '0')}
        </span>

        {/* ── CHIPS DATA en entonnoir (pointent vers la marque) ── */}
        <div className="pointer-events-none absolute inset-0 z-20 hidden sm:block" style={{ transformStyle: 'preserve-3d' }}>
          {chips.map((c, i) => {
            const s = SLOTS[i];
            return (
              <div key={`${current.id}-${c.label}`} className="absolute" style={{ ...s.pos, transform: s.tf, transformOrigin: s.origin }}>
                <DataChip value={c.value} label={c.label} delay={120 + i * 90} color={col} />
              </div>
            );
          })}
        </div>

        {/* ── CENTRE : réticule verrouillé sur la marque ── */}
        <div className="relative z-10 flex min-h-[560px] items-center justify-center px-6 py-16">
          <div key={current.id} className="ret-in relative px-10 py-9 text-center sm:px-16 sm:py-12" aria-live="polite">
            <RetCorner pos="tl" color={col} />
            <RetCorner pos="tr" color={col} />
            <RetCorner pos="bl" color={col} />
            <RetCorner pos="br" color={col} />
            {/* tick central haut/bas du réticule */}
            <span aria-hidden className="absolute left-1/2 top-0 h-2 w-px -translate-x-1/2" style={{ background: col }} />
            <span aria-hidden className="absolute bottom-0 left-1/2 h-2 w-px -translate-x-1/2" style={{ background: col }} />

            <div className="spot-in">
              {current.logo ? (
                <img src={current.logo} alt={current.name} className="mx-auto max-h-32 max-w-[65vw] object-contain sm:max-h-40" />
              ) : (
                <h2 className="hud-title text-5xl font-bold leading-none text-[color:var(--paper)] sm:text-7xl" style={{ textShadow: `4px 4px 0 var(--base-900), 6px 6px 0 ${col}` }}>
                  {current.name}
                </h2>
              )}

              {current.tagline && (
                <p className="mx-auto mt-5 max-w-md font-mono text-sm leading-relaxed text-[color:var(--text-dim)]">
                  « {current.tagline} »
                </p>
              )}

              <a
                href={current.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block border-2 bg-base-900/70 px-4 py-2 font-mono text-xs font-bold uppercase tracking-hud shadow-ink-sm transition-all hover:-translate-y-0.5 hover:brightness-125"
                style={{ borderColor: col, color: col }}
              >
                Visiter ↗
              </a>
            </div>
          </div>
        </div>

        {/* barre de temps de la rotation */}
        {!reduced && sponsors.length > 1 && (
          <div className="absolute inset-x-0 bottom-0 z-20 h-0.5 bg-base-700">
            <div
              key={`bar-${idx}-${paused ? 'p' : 'r'}`}
              className="spot-progress h-full"
              style={{ background: col, ['--spot-dur' as string]: `${durFor(current)}ms`, animationPlayState: paused ? 'paused' : 'running' }}
            />
          </div>
        )}
      </div>

      {/* ── FILE D'ATTENTE (vignettes) ── */}
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {sponsors.map((s, i) => {
          const active = i === idx;
          const sc = s.color ?? 'var(--accent)';
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Afficher ${s.name}`}
              className={[
                'relative flex h-16 items-center justify-center border-2 px-2 transition-all duration-snap',
                active ? '-translate-y-0.5 bg-base-800 shadow-ink-sm' : 'bg-base-900/60 hover:border-line-bright',
              ].join(' ')}
              style={{ borderColor: active ? sc : 'var(--line-strong)' }}
            >
              {/* pastille couleur de la marque */}
              <span aria-hidden className="absolute left-1.5 top-1.5 h-1.5 w-1.5" style={{ background: sc, opacity: active ? 1 : 0.55 }} />
              {s.logo ? (
                <img src={s.logo} alt="" className={`max-h-8 max-w-full object-contain ${active ? '' : 'opacity-50 grayscale'}`} />
              ) : (
                <span className={`hud-title truncate text-sm font-bold ${active ? 'text-[color:var(--text)]' : 'text-[color:var(--text-mute)]'}`}>
                  {s.name}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
