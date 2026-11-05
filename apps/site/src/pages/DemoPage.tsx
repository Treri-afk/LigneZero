import { useDocTitle } from '@/hooks/useDocTitle';
import { KeycapButton } from '@/components/ui/KeycapButton';
import { KeycapCard } from '@/components/ui/KeycapCard';
import { HudFrame } from '@/components/ui/HudFrame';
import { StatusTag } from '@/components/ui/StatusTag';
import { Bracket } from '@/components/ui/Bracket';
import { GlitchText } from '@/components/animation/GlitchText';
import { TypeWriter } from '@/components/animation/TypeWriter';
import { BootSequence } from '@/components/animation/BootSequence';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useCounter } from '@/hooks/useCounter';

function Stat({ label, to, suffix = '' }: { label: string; to: number; suffix?: string }) {
  const { ref, value } = useCounter<HTMLSpanElement>({ to });
  return (
    <div className="flex flex-col">
      <span ref={ref} className="hud-title text-4xl font-bold text-accent glow-text">
        {value}
        {suffix}
      </span>
      <span className="hud-label mt-1 text-[10px]">{label}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-20">
      <p className="hud-label mb-5 text-xs">
        <span className="text-accent">&gt;</span> {title}
      </p>
      {children}
    </section>
  );
}

export default function DemoPage() {
  const reveal = useScrollReveal<HTMLDivElement>();

  useDocTitle('Demo kit');

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <header className="mb-16">
        <p className="hud-label mb-3 text-xs">[ LAB ] motion system</p>
        <GlitchText as="h1" text="ANIMATION KIT" className="hud-title text-5xl font-bold glow-text sm:text-7xl" />
        <p className="mt-5 font-mono text-sm text-[color:var(--text-dim)]">
          <TypeWriter text="> composants réutilisables — phase 2 validée" />
        </p>
      </header>

      <Section title="HudFrame — cadres hard-surface (équerres d'angle)">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <HudFrame label="ROSTER / VALORANT" corner="05 UNITS" tone="accent" className="cut-panel">
            <div className="p-6">
              <p className="font-mono text-xs leading-relaxed text-[color:var(--text-dim)]">
                &gt; cadre standard : équerres + label technique + lignes de blindage.
              </p>
              <div className="mt-4 panel-grooves h-6 w-full opacity-60" aria-hidden />
            </div>
          </HudFrame>

          <HudFrame label="ALERT" corner="SECTOR 7" variant="secondary" tone="accent" className="cut-panel-alt">
            <div className="flex items-center gap-4 p-6">
              <span className="hazard h-12 w-12 shrink-0" aria-hidden />
              <p className="font-mono text-xs leading-relaxed text-[color:var(--text-dim)]">
                &gt; variante secondaire (violet), coupe inversée, bande hazard.
              </p>
            </div>
          </HudFrame>
        </div>
      </Section>

      <Section title="StatusTag — statuts calendrier">
        <div className="flex flex-wrap items-center gap-4">
          <StatusTag status="upcoming" />
          <StatusTag status="live" />
          <StatusTag status="finished" />
          <Bracket className="font-mono text-sm text-[color:var(--text-dim)]">SYS.READY</Bracket>
        </div>
      </Section>

      <Section title="KeycapButton — boutons mécaniques">
        <div className="flex flex-wrap items-center gap-5">
          <KeycapButton sound>Primary</KeycapButton>
          <KeycapButton variant="secondary" sound>
            Secondary
          </KeycapButton>
          <KeycapButton size="sm" sound>
            Small
          </KeycapButton>
          <KeycapButton size="lg" sound>
            Large
          </KeycapButton>
          <KeycapButton to="/" sound>
            ← Accueil (Link)
          </KeycapButton>
        </div>
        <p className="mt-4 font-mono text-xs text-[color:var(--text-dim)]">
          Active [ SND:ON ] en bas de page pour le "clac".
        </p>
      </Section>

      <Section title="KeycapCard — cartes hard-surface (scroll reveal)">
        <div ref={reveal} className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {['ALPHA', 'BRAVO', 'CHARLIE'].map((c, i) => (
            <KeycapCard
              key={c}
              data-reveal
              interactive
              scanlines
              variant={i === 1 ? 'secondary' : 'primary'}
              className="p-6"
            >
              <p className="hud-label text-[10px]">UNIT_{String(i).padStart(2, '0')}</p>
              <p className="hud-title mt-2 text-2xl font-bold">{c}</p>
              <p className="mt-3 font-mono text-xs text-[color:var(--text-dim)]">
                &gt; survol = élévation. clic = enfoncement.
              </p>
            </KeycapCard>
          ))}
        </div>
      </Section>

      <Section title="Compteurs HUD (incrément à l'entrée)">
        <div className="flex flex-wrap gap-12">
          <Stat label="Titres" to={12} />
          <Stat label="Matchs joués" to={148} />
          <Stat label="Winrate" to={67} suffix="%" />
          <Stat label="Membres" to={9} />
        </div>
      </Section>

      <Section title="GlitchText (survol)">
        <GlitchText as="h2" text="HARD SURFACE" className="hud-title text-4xl font-bold" />
      </Section>

      <Section title="BootSequence (inline)">
        <div className="cut-panel overflow-hidden border border-line">
          <BootSequence fullscreen={false} duration={2600} steps={['> demo boot', '> ok']} />
        </div>
      </Section>

      <p className="mt-8 font-mono text-xs text-[color:var(--text-dim)]">
        Navigue entre les pages (header) pour voir la <span className="text-accent">PageTransition</span> blast-door.
      </p>
    </div>
  );
}
