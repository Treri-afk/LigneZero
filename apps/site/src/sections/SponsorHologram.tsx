import { useState } from 'react';
import type { Sponsor } from '@/types';
import { useData } from '@/data/DataProvider';
import { Hologram } from '@/components/ui/Hologram';
import { SponsorSheet } from './SponsorSheet';

const VB_W = 1000;
const VB_H = 620;
const TILT = 70; // force du point de fuite vers le centre (deg)

function layout(list: Sponsor[]) {
  const N = list.length;
  return list.map((s, i) => {
    const ang = (i / N) * Math.PI * 2 - Math.PI / 2;
    const rx = s.tier === 'principal' ? 0.24 : s.tier === 'officiel' ? 0.34 : 0.43;
    const ry = rx * 0.82;
    return { fx: 0.5 + Math.cos(ang) * rx, fy: 0.5 + Math.sin(ang) * ry };
  });
}

/**
 * Projection holographique : logo central de la structure, d'où partent des
 * FAISCEAUX coniques (pointe au cœur → s'élargissent vers chaque sponsor),
 * les logos sponsors étant projetés autour et inclinés en POINT DE FUITE vers
 * le centre. Clic → fiche. Effet 100% CSS (pas de filtre SVG → fluide).
 */
export function SponsorHologram() {
  const { sponsors, brand } = useData();
  const indexOf = (s: Sponsor) => sponsors.findIndex((x) => x.id === s.id);
  const [selected, setSelected] = useState<Sponsor | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const list = sponsors;
  const pos = layout(list);
  const cx = VB_W / 2;
  const cy = VB_H / 2;

  return (
    <div className="relative mx-auto mt-10 aspect-[1000/620] w-full overflow-hidden border-2 border-line-strong bg-base-900/50">
      {/* sol grille holographique en perspective */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(var(--accent) 1px, transparent 1px), linear-gradient(90deg, var(--accent) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          transform: 'perspective(420px) rotateX(62deg)',
          transformOrigin: 'bottom',
          maskImage: 'linear-gradient(to top, #000, transparent)',
        }}
      />

      {/* faisceaux coniques diffus (flou + fade vers le sponsor) */}
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        style={{ filter: 'blur(11px)' }}
      >
        <defs>
          {pos.map((p, i) => {
            const x = p.fx * VB_W;
            const y = p.fy * VB_H;
            return (
              <linearGradient key={i} id={`beam${i}`} gradientUnits="userSpaceOnUse" x1={cx} y1={cy} x2={x} y2={y}>
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.30" />
                <stop offset="45%" stopColor="var(--accent)" stopOpacity="0.14" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            );
          })}
        </defs>
        {pos.map((p, i) => {
          const s = list[i];
          const x = p.fx * VB_W;
          const y = p.fy * VB_H;
          const len = Math.hypot(x - cx, y - cy) || 1;
          const px = -(y - cy) / len;
          const py = (x - cx) / len;
          const W = s.tier === 'principal' ? 70 : s.tier === 'officiel' ? 52 : 42;
          const active = hover === s.id;
          const w = active ? W * 1.25 : W;
          const points = `${cx},${cy} ${(x + px * w).toFixed(1)},${(y + py * w).toFixed(1)} ${(x - px * w).toFixed(1)},${(y - py * w).toFixed(1)}`;
          return <polygon key={s.id} points={points} fill={`url(#beam${i})`} opacity={active ? 1 : 0.7} style={{ transition: 'opacity 0.2s' }} />;
        })}
      </svg>

      {/* logo central de la structure */}
      <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
        <Hologram text={brand.name} className="text-4xl sm:text-6xl" baseWidth={220} />
        <p className="mt-6 text-center font-mono text-[9px] uppercase tracking-hud text-[color:var(--text-mute)]">
          ◈ projection active ◈
        </p>
      </div>

      {/* sponsors projetés (inclinés en point de fuite vers le centre) */}
      <div className="absolute inset-0 z-10" style={{ perspective: '900px', perspectiveOrigin: 'center' }}>
        {pos.map((p, i) => {
          const s = list[i];
          const rdx = p.fx - 0.5;
          const rdy = p.fy - 0.5;
          return (
            <button
              key={s.id}
              type="button"
              onMouseEnter={() => setHover(s.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => setSelected(s)}
              className="group absolute"
              style={{
                left: `${p.fx * 100}%`,
                top: `${p.fy * 100}%`,
                transform: `translate(-50%, -50%) rotateX(${(rdy * TILT).toFixed(1)}deg) rotateY(${(-rdx * TILT).toFixed(1)}deg)`,
                transformStyle: 'preserve-3d',
              }}
            >
              <div className="transition-transform duration-ui ease-mech group-hover:scale-110">
                <Hologram
                  text={s.name}
                  className={s.tier === 'principal' ? 'text-2xl sm:text-3xl' : 'text-base sm:text-xl'}
                  baseWidth={s.tier === 'principal' ? 130 : 90}
                />
                <span className="mt-2 block text-center font-mono text-[8px] uppercase tracking-hud text-[color:var(--text-mute)]">
                  {s.sector}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <p className="absolute bottom-3 left-4 z-20 font-mono text-[9px] uppercase tracking-hud text-[color:var(--text-mute)]">
        [ HOLO-NET ] &gt; {list.length} partenaires projetés · clique pour la fiche
      </p>

      {selected && <SponsorSheet sponsor={selected} index={indexOf(selected)} onClose={() => setSelected(null)} />}
    </div>
  );
}
