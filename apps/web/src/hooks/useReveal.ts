import { useEffect, useRef } from 'react';

/**
 * Révèle un bloc à l'entrée dans le viewport (IntersectionObserver, jamais
 * d'écouteur scroll). Respecte prefers-reduced-motion : le bloc est visible
 * immédiatement, sans transition.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.18) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      el.dataset.revealed = 'true';
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.revealed = 'true';
            io.unobserve(entry.target);
          }
        }
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return ref;
}
