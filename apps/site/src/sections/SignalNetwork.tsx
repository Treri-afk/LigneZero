import { useEffect, useRef, useState } from 'react';
import { useBrand } from '@/data/DataProvider';
import type { Sponsor } from '@/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { LiquidFill } from '@/components/ui/LiquidFill';

const VB_W = 1600;
const VB_H = 1000;

/** Position fractionnaire (0..1) d'un nœud selon son index et son tier. */
function layout(nodes: Sponsor[]) {
  const N = nodes.length;
  return nodes.map((s, i) => {
    const ang = (i / N) * Math.PI * 2 - Math.PI / 2;
    const r = s.tier === 'officiel' ? 0.3 : 0.42; // officiels plus proches du cœur
    return { fx: 0.5 + Math.cos(ang) * r, fy: 0.5 + Math.sin(ang) * r * 0.84 };
  });
}

/**
 * Réseau de signal vivant : __BRAND__ au cœur, les sponsors en nœuds.
 * Les câbles sont BRANCHÉS aux deux bouts mais PENDENT sous la gravité
 * (arc caténaire) avec un léger balancement — vraie impression de câble.
 * Une impulsion rouge circule le long du câble (les partenaires alimentent
 * le cœur). Hover = câble qui se tend + s'allume. Clic = fiche.
 */
export function SignalNetwork({ nodes, onOpen }: { nodes: Sponsor[]; onOpen: (s: Sponsor) => void }) {
  const brand = useBrand();
  const reduced = useReducedMotion();
  const [hover, setHover] = useState<string | null>(null);
  const hoverRef = useRef<string | null>(null);
  hoverRef.current = hover;

  const pos = layout(nodes);
  const cx = VB_W / 2;
  const cy = VB_H / 2;

  const glowRefs = useRef<(SVGPathElement | null)[]>([]);
  const coreRefs = useRef<(SVGPathElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // slosh : pose --lt sur la case survolée (réagit seulement à l'intérieur).
  const onTilt = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2 || 1);
    e.currentTarget.style.setProperty('--lt', `${Math.max(-1, Math.min(1, dx)) * 8}deg`);
  };
  const resetTilt = (e: React.PointerEvent<HTMLElement>) => e.currentTarget.style.setProperty('--lt', '0deg');

  useEffect(() => {
    const pts = nodes.map((_, i) => ({ x: pos[i].fx * VB_W, y: pos[i].fy * VB_H }));

    // d d'un câble qui pend (Q bézier) avec gravité + balancement optionnel.
    const cable = (x1: number, y1: number, t: number, i: number, slack: number) => {
      const len = Math.hypot(cx - x1, cy - y1);
      const sag = len * 0.26 * slack; // gravité ∝ longueur
      const swayY = reduced ? 0 : Math.sin(t * 0.9 + i) * (len * 0.012);
      const swayX = reduced ? 0 : Math.cos(t * 0.7 + i * 1.3) * (len * 0.02);
      const mx = (x1 + cx) / 2 + swayX;
      const my = (y1 + cy) / 2 + sag + swayY;
      return `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${cx} ${cy}`;
    };

    // slack courant par câble (se tend au hover) — lerp.
    const slack = nodes.map(() => 1);

    const draw = (t: number) => {
      nodes.forEach((n, i) => {
        const target = hoverRef.current === n.id ? 0.45 : 1;
        slack[i] += (target - slack[i]) * 0.12;
        const d = cable(pts[i].x, pts[i].y, t, i, slack[i]);
        glowRefs.current[i]?.setAttribute('d', d);
        coreRefs.current[i]?.setAttribute('d', d);
      });
    };

    // Reduced-motion : tracé statique, aucun rAF.
    if (reduced) {
      draw(0);
      return;
    }

    // rAF gated par IntersectionObserver : ne tourne QUE si le réseau est visible.
    let raf = 0;
    let running = false;
    const t0 = performance.now();
    const tick = (now: number) => {
      draw((now - t0) / 1000);
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    draw(0);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0 });
    if (containerRef.current) io.observe(containerRef.current);

    return () => {
      io.disconnect();
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, reduced]);

  return (
    <div ref={containerRef} className="relative mx-auto aspect-[16/10] w-full">
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
        {pos.map((p, i) => {
          const x = p.fx * VB_W;
          const y = p.fy * VB_H;
          const active = hover === nodes[i].id;
          return (
            <g key={nodes[i].id}>
              {/* halo : large trait translucide (pas de filtre SVG = pas de lag) */}
              <path
                ref={(el) => (glowRefs.current[i] = el)}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={active ? 18 : 13}
                strokeLinecap="round"
                opacity={active ? 0.28 : 0.16}
                style={{ transition: 'stroke-width 0.2s, opacity 0.2s' }}
              />
              {/* cœur de liquide rouge PLEIN (continu) qui vacille */}
              <path
                ref={(el) => (coreRefs.current[i] = el)}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={active ? 6 : 4.5}
                strokeLinecap="round"
                className={reduced ? '' : 'liquid-flicker'}
                style={{ animationDelay: `${i * 0.7 + 0.15}s`, animationDuration: `${2.4 + i * 0.3}s` }}
              />
              {/* connecteurs (branchements) */}
              <circle cx={x} cy={y} r={9} fill="var(--base-900)" stroke="var(--accent)" strokeWidth={3} />
            </g>
          );
        })}

        {/* prise centrale + halo du cœur */}
        <circle cx={cx} cy={cy} r={14} fill="var(--base-900)" stroke="var(--accent)" strokeWidth={3} />
        <circle cx={cx} cy={cy} r={64} fill="none" stroke="var(--accent)" strokeWidth={2} className={reduced ? '' : 'core-pulse'} style={{ transformOrigin: 'center', transformBox: 'fill-box' }} />
      </svg>

      {/* cœur __BRAND__ (rempli de liquide) */}
      <div
        onPointerMove={onTilt}
        onPointerLeave={resetTilt}
        className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center overflow-hidden border-2 border-accent panel-concrete px-6 pb-7 pt-3 text-center shadow-ink-sm"
      >
        <LiquidFill height={36} />
        <div className="relative z-10">
          <span className="hud-title text-lg font-bold glow-text sm:text-2xl">{brand.name}</span>
          <span className="mt-1 flex items-center justify-center gap-1.5 font-mono text-[8px] uppercase tracking-hud text-[color:var(--text-mute)]">
            <span className="h-1.5 w-1.5 animate-live rounded-full bg-accent" /> CORE ONLINE
          </span>
        </div>
      </div>

      {/* nœuds sponsors */}
      {pos.map((p, i) => {
        const s = nodes[i];
        const active = hover === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onMouseEnter={() => setHover(s.id)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onOpen(s)}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${p.fx * 100}%`, top: `${p.fy * 100}%` }}
          >
            <div
              onPointerMove={onTilt}
              onPointerLeave={resetTilt}
              className={[
                'scan-on-hover cut-panel panel-concrete relative flex min-h-[92px] min-w-[122px] flex-col items-center gap-1 overflow-hidden border-2 px-4 pb-8 pt-3 transition-all duration-ui ease-mech',
                active ? 'scale-110 border-accent shadow-ink' : 'border-line-strong',
              ].join(' ')}
            >
              {/* liquide qui ondule (sous le titre) */}
              <LiquidFill height={active ? 52 : 40} />
              <div className="relative z-10 flex flex-col items-center gap-1">
                <span className="font-mono text-[8px] uppercase tracking-hud text-[color:var(--text-mute)]">{s.sector}</span>
                {s.logo ? (
                  <img src={s.logo} alt={s.name} className="h-6 max-w-[90px] object-contain" />
                ) : (
                  <span className={`hud-title text-sm font-bold tracking-hud transition-colors ${active ? 'text-[color:var(--text)]' : 'text-[color:var(--text-dim)]'}`}>
                    {s.name}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
