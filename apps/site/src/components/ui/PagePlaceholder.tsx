import { useDocTitle } from '@/hooks/useDocTitle';
import { HudFrame } from './HudFrame';
import { Bracket } from './Bracket';

interface PagePlaceholderProps {
  code: string;
  title: string;
  /** Description courte de ce qui arrivera dans cette section (phases >1). */
  note?: string;
}

/**
 * Gabarit temporaire des pages (Phase 1-2). Vitrine du langage hard-surface :
 * cadre HUD à équerres, label technique, hazard, glow retenu.
 */
export function PagePlaceholder({ code, title, note }: PagePlaceholderProps) {
  useDocTitle(title);

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-7xl flex-col justify-center px-4 py-24 sm:px-6">
      <HudFrame
        label={`SECTION ${code}`}
        corner="STATUS: STANDBY"
        tone="accent"
        className="cut-panel"
      >
        <div className="p-8 sm:p-12">
          <p className="hud-label mb-5 text-xs">
            <Bracket>INIT</Bracket> <span className="text-accent">&gt;</span> module en attente de déploiement
          </p>

          <h1 className="hud-title text-4xl font-bold sm:text-6xl">
            {title}
          </h1>

          {/* divider hard-surface : trait + hazard */}
          <div className="mt-6 flex items-center gap-3">
            <span className="h-px w-24 bg-accent" />
            <span className="hazard h-3 w-20" aria-hidden />
            <span className="font-mono text-[10px] text-[color:var(--text-mute)]">// {code}-XX</span>
          </div>

          <p className="mt-8 max-w-md font-mono text-sm leading-relaxed text-[color:var(--text-dim)]">
            {note ?? '> Contenu en cours de déploiement.'}
            <span className="ml-1 inline-block h-4 w-2 animate-blink bg-accent align-middle" />
          </p>
        </div>
      </HudFrame>
    </section>
  );
}
