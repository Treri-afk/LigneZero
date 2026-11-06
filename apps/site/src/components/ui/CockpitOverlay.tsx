import { useEffect, useState } from 'react';
import { useBrand } from '@/data/DataProvider';

/**
 * Habillage cockpit fixe au-dessus de tout le viewport (non interactif) :
 * équerres d'angle, graduations de bord, mini-readouts et horloge système.
 * Donne la sensation d'un HUD qui encadre la page, pas un simple fond plat.
 */
export function CockpitOverlay() {
  const brand = useBrand();
  const [time, setTime] = useState('--:--:--');

  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString('fr-FR', { hour12: false });
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(id);
  }, []);

  const corner = 'pointer-events-none fixed h-7 w-7 border-[color:var(--line-bright)] z-[45]';

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[45] select-none">
      {/* équerres viewport */}
      <span className={`${corner} left-3 top-3 border-l border-t`} />
      <span className={`${corner} right-3 top-3 border-r border-t`} />
      <span className={`${corner} bottom-3 left-3 border-b border-l`} />
      <span className={`${corner} bottom-3 right-3 border-b border-r`} />

      {/* graduations latérales gauche */}
      <div className="fixed left-3 top-1/2 hidden -translate-y-1/2 flex-col gap-2 lg:flex">
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className="block h-px bg-line-strong"
            style={{ width: i % 3 === 0 ? 14 : 7 }}
          />
        ))}
      </div>

      {/* readout bas-droite : horloge + coord */}
      <div className="fixed bottom-5 right-12 hidden items-center gap-3 font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)] md:flex">
        <span className="text-accent">◷</span>
        <span>{time}</span>
        <span className="text-[color:var(--line-bright)]">|</span>
        <span>48.85N · 2.35E</span>
      </div>

      {/* version bas-gauche */}
      <div className="fixed bottom-5 left-12 hidden font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)] md:block">
        {brand.name} // v0.1.0
      </div>
    </div>
  );
}
