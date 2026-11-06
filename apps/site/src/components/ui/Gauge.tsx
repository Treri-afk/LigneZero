/**
 * Jauge HUD : barre à graduations avec remplissage animé + label/valeur.
 * Réutilisable pour stats, prédictions, progression. DA cockpit.
 */
export function Gauge({
  value,
  max = 100,
  label,
  unit = '',
  tone = 'var(--accent)',
  showValue = true,
}: {
  value: number;
  max?: number;
  label?: string;
  unit?: string;
  tone?: string;
  showValue?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0));
  return (
    <div className="font-mono">
      {(label || showValue) && (
        <div className="mb-1 flex items-end justify-between text-[10px] uppercase tracking-hud text-[color:var(--text-dim)]">
          <span>{label}</span>
          {showValue && <span className="text-[color:var(--text)]">{value}{unit}</span>}
        </div>
      )}
      <div className="relative h-3 overflow-hidden border border-line-strong bg-base-800/50">
        <div aria-hidden className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 9px, var(--line-strong) 9px 10px)' }} />
        <div className="h-full transition-[width] duration-500 ease-mech" style={{ width: `${pct}%`, background: tone }} />
        <div aria-hidden className="pointer-events-none absolute inset-y-0" style={{ left: `calc(${pct}% - 1px)`, width: 2, background: 'var(--text)', opacity: pct > 2 && pct < 98 ? 0.5 : 0 }} />
      </div>
    </div>
  );
}
