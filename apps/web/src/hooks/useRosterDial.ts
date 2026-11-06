import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Sélecteur de joueur partagé par les 3 DA : un seul joueur est "ouvert" à la
 * fois, les autres restent en veille. Rotation automatique tant que personne
 * n'a touché à rien — dès la première interaction, on rend la main.
 */
export function useRosterDial(count: number, intervalMs = 5200) {
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);
  const listRef = useRef<HTMLElement>(null);

  const select = useCallback((next: number) => {
    setAuto(false);
    setIndex(((next % count) + count) % count);
  }, [count]);

  useEffect(() => {
    if (!auto) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => window.clearInterval(id);
  }, [auto, count, intervalMs]);

  /** Flèches gauche/droite quand le focus est dans la liste. */
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        select(index + 1);
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        select(index - 1);
      }
    },
    [index, select],
  );

  return { index, select, auto, listRef, onKeyDown };
}
