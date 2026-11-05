import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap } from '@/lib/gsap';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { playWhoosh } from '@/lib/sound';

/**
 * Séquence de "boot" mécanique à chaque changement de route :
 * des plaques blindées couvrent puis coulissent pour révéler la page
 * (wipe vertical alterné, skew cutline), avec flash d'accent + scanline.
 *
 * À monter une fois dans le Layout, à l'intérieur du Router.
 * Reduced-motion : aucun overlay, navigation instantanée.
 */
export function PageTransition() {
  const { pathname } = useLocation();
  const reduced = useReducedMotion();
  const overlay = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const sweep = useRef<HTMLDivElement>(null);
  const first = useRef(true);

  useEffect(() => {
    // Le chargement initial est couvert par la BootSequence : on ne joue
    // l'overlay qu'à partir de la 1re navigation.
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduced || !overlay.current) return;

    const slabs = overlay.current.querySelectorAll<HTMLElement>('[data-slab]');
    const brackets = overlay.current.querySelectorAll<HTMLElement>('[data-bracket]');
    const tl = gsap.timeline();
    playWhoosh();

    // 1. plaques en place (couvrent) → 2. coulissent (révèlent)
    tl.set(overlay.current, { autoAlpha: 1, pointerEvents: 'auto' })
      .fromTo(
        slabs,
        { scaleY: 0, transformOrigin: (i) => (i % 2 ? 'bottom' : 'top') },
        { scaleY: 1, duration: 0.26, ease: 'power3.in', stagger: 0.04 },
      )
      // rideau HUD : équerres qui convergent
      .fromTo(
        brackets,
        { autoAlpha: 0, scale: 1.5, x: (i) => (i % 2 ? 26 : -26), y: (i) => (i < 2 ? -26 : 26) },
        { autoAlpha: 1, scale: 1, x: 0, y: 0, duration: 0.22, ease: 'power3.out' },
        '<0.05',
      )
      .set(flash.current, { autoAlpha: 0.9 })
      .to(flash.current, { autoAlpha: 0, duration: 0.25, ease: 'power2.out' }, '<')
      .fromTo(
        sweep.current,
        { yPercent: -120, autoAlpha: 1 },
        { yPercent: 120, duration: 0.4, ease: 'none' },
        '<',
      )
      .to(brackets, { autoAlpha: 0, scale: 1.4, duration: 0.2, ease: 'power2.in' }, '<')
      .to(
        slabs,
        {
          scaleY: 0,
          transformOrigin: (i) => (i % 2 ? 'top' : 'bottom'),
          duration: 0.34,
          ease: 'power3.out',
          stagger: 0.04,
        },
        '>-0.05',
      )
      .set(overlay.current, { autoAlpha: 0, pointerEvents: 'none' });

    return () => {
      tl.kill();
    };
  }, [pathname, reduced]);

  if (reduced) return null;

  return (
    <div
      ref={overlay}
      aria-hidden
      className="invisible pointer-events-none fixed inset-0 z-[70]"
    >
      {/* plaques blindées (skew = cutline) */}
      <div className="absolute inset-0 flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            data-slab
            className="h-full flex-1 origin-top bg-base-800"
            style={{
              transform: 'skewX(-8deg) scaleY(0)',
              borderLeft: '1px solid var(--line-strong)',
            }}
          />
        ))}
      </div>

      {/* équerres HUD (rideau) aux 4 coins */}
      {[
        { pos: 'left-6 top-6', b: 'border-l-2 border-t-2' },
        { pos: 'right-6 top-6', b: 'border-r-2 border-t-2' },
        { pos: 'left-6 bottom-6', b: 'border-l-2 border-b-2' },
        { pos: 'right-6 bottom-6', b: 'border-r-2 border-b-2' },
      ].map((c, i) => (
        <span key={i} data-bracket className={`invisible absolute h-12 w-12 ${c.pos} ${c.b}`} style={{ borderColor: 'var(--accent)' }} />
      ))}

      {/* flash d'accent au verrouillage */}
      <div
        ref={flash}
        className="invisible absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--accent) 30%, transparent), transparent 60%)' }}
      />

      {/* barre de scan néon */}
      <div
        ref={sweep}
        className="invisible absolute inset-x-0 top-0 h-32"
        style={{ background: 'linear-gradient(to bottom, transparent, color-mix(in srgb, var(--accent) 35%, transparent), transparent)' }}
      />
    </div>
  );
}
