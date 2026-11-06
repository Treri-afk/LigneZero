import { useDocTitle } from '@/hooks/useDocTitle';
import type { ReactNode } from 'react';
import { GlitchText } from '@/components/animation/GlitchText';
import { Bracket } from '@/components/ui/Bracket';

interface PageHeaderProps {
  code: string;
  title: string;
  subtitle?: string;
  /** Méta alignée à droite (compteurs, filtres). */
  meta?: ReactNode;
}

/** En-tête de page brutalist : code rouge, gros titre, hazard, méta. Pose le <title>. */
export function PageHeader({ code, title, subtitle, meta }: PageHeaderProps) {
  useDocTitle(title);

  return (
    <header className="relative border-b-2 border-line-strong pb-8">
      {/* bande hazard fine en haut */}
      <div className="hazard mb-8 h-3 w-full opacity-60" aria-hidden />

      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="hud-label mb-4 flex items-center gap-3 text-xs">
            <Bracket>SECTION {code}</Bracket>
            <span className="h-px w-12 bg-accent" />
          </p>
          <h1 className="hud-title text-5xl font-bold leading-none glow-text sm:text-7xl">
            <GlitchText text={title} />
          </h1>
          {subtitle && (
            <p className="mt-4 max-w-xl font-mono text-sm leading-relaxed text-[color:var(--text-dim)]">
              &gt; {subtitle}
            </p>
          )}
        </div>
        {meta && <div className="shrink-0">{meta}</div>}
      </div>
    </header>
  );
}
