interface ScanlineOverlayProps {
  /** Intensité des lignes CRT (0–1). */
  opacity?: number;
  /** Ajoute la barre lumineuse qui balaie. */
  sweep?: boolean;
  className?: string;
}

/**
 * Overlay CRT : fines scanlines statiques + balayage optionnel + flicker.
 * Purement décoratif (aria-hidden), n'intercepte pas les clics.
 */
export function ScanlineOverlay({ opacity = 0.06, sweep = false, className = '' }: ScanlineOverlayProps) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {/* lignes horizontales fines (texture cockpit sombre — masquée en thème clair) */}
      <div
        className="crt-scan absolute inset-0 animate-flicker"
        style={{
          opacity,
          backgroundImage: 'repeating-linear-gradient(0deg, var(--ink) 0 1px, transparent 1px 3px)',
        }}
      />
      {/* barre de balayage néon */}
      {sweep && (
        <div
          className="absolute inset-x-0 h-24 animate-scanline"
          style={{
            background: 'linear-gradient(to bottom, transparent, color-mix(in srgb, var(--accent) 22%, transparent), transparent)',
          }}
        />
      )}
    </div>
  );
}
