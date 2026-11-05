/**
 * Bandes de danger (hard-surface). Statiques par défaut, DÉFILANTES en `live`
 * (mode match / alerte). Ornement DA : rayures rouge/charbon à 45°.
 */
export function HazardBands({ live = false, height = 12, className = '' }: { live?: boolean; height?: number; className?: string }) {
  return <div aria-hidden className={`${live ? 'hazard-live' : 'hazard'} w-full ${className}`} style={{ height }} />;
}
