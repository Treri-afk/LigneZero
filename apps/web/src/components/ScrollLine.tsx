import { useEffect, useRef, useState } from 'react';
import './scroll-line.css';

export type LineSection = { id: string; label: string };

/**
 * « La ligne zéro » : un filet vertical qui traverse toute la page, se
 * remplit à mesure qu'on descend et marque chaque section d'un cran.
 * Le nom de la structure, rendu littéral — c'est le fil conducteur de la
 * navigation plutôt qu'un gadget de décoration.
 */
export function ScrollLine({ sections }: { sections: LineSection[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Progression : scroll lu dans une frame d'animation, écrit en variable CSS
  // (donc en transform côté rendu), jamais en propriété de layout.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      el.style.setProperty('--lz-progress', String(ratio));
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Section courante
  useEffect(() => {
    const nodes = sections
      .map((section) => document.getElementById(section.id))
      .filter((node): node is HTMLElement => node !== null);
    if (!nodes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const next = nodes.indexOf(visible.target as HTMLElement);
        if (next !== -1) setActive(next);
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );

    nodes.forEach((node) => io.observe(node));
    return () => io.disconnect();
  }, [sections]);

  return (
    <div className="lz-line" ref={ref} aria-hidden="true">
      <span className="lz-line__rule" />
      <span className="lz-line__fill" />
      <ol className="lz-line__ticks">
        {sections.map((section, i) => (
          <li key={section.id} className="lz-line__tick" data-active={i === active}>
            <span className="lz-line__dot" />
            <span className="lz-line__label">{section.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
