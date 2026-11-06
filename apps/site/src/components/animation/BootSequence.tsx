import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useBrand } from '@/data/DataProvider';
import { ScanlineOverlay } from './ScanlineOverlay';

interface BootSequenceProps {
  /** Durée totale de la séquence (ms). */
  duration?: number;
  /** Appelé une fois la jauge pleine. */
  onComplete?: () => void;
  /** Lignes de log défilantes (style terminal mecha). */
  steps?: string[];
  /** Plein écran (chargement initial) vs inline (fallback Suspense local). */
  fullscreen?: boolean;
}

const DEFAULT_STEPS = [
  '> init core systems',
  '> mounting HUD layer',
  '> calibrating optics',
  '> link established',
];

const SEGMENTS = 24;

/** Écran de boot : jauge segmentée type jauge mecha + logs qui s'écrivent. */
export function BootSequence({
  duration = 1800,
  onComplete,
  steps = DEFAULT_STEPS,
  fullscreen = true,
}: BootSequenceProps) {
  const brand = useBrand();
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(0); // 0–1

  useEffect(() => {
    if (reduced) {
      setProgress(1);
      onComplete?.();
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else onComplete?.();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // onComplete volontairement hors deps : évite de relancer la séquence
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, reduced]);

  const filled = Math.round(progress * SEGMENTS);
  const pct = Math.round(progress * 100);
  const stepIndex = Math.min(steps.length - 1, Math.floor(progress * steps.length));

  return (
    <div
      className={[
        'relative flex flex-col items-center justify-center gap-5 bg-base-900',
        fullscreen ? 'fixed inset-0 z-[80]' : 'min-h-[40vh] w-full',
      ].join(' ')}
      role="status"
      aria-live="polite"
      aria-label={`Chargement ${pct}%`}
    >
      <p className="hud-title text-2xl font-bold glow-text">{brand.name}</p>

      {/* jauge segmentée */}
      <div className="flex w-[min(80vw,420px)] gap-[3px]">
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <span
            key={i}
            className="h-3 flex-1 transition-colors"
            style={{
              background: i < filled ? 'var(--accent)' : 'var(--base-700)',
              boxShadow: i < filled ? '0 0 8px -2px var(--accent)' : 'none',
            }}
          />
        ))}
      </div>

      <div className="flex w-[min(80vw,420px)] items-center justify-between font-mono text-[11px] uppercase tracking-hud text-[color:var(--text-dim)]">
        <span>{steps[stepIndex]}</span>
        <span className="text-accent">{String(pct).padStart(3, '0')}%</span>
      </div>

      <ScanlineOverlay sweep opacity={0.05} />
    </div>
  );
}
