import { HudFrame } from '@/components/ui/HudFrame';
import { KeycapButton } from '@/components/ui/KeycapButton';
import { FunnelStage } from '@/components/animation/FunnelStage';
import { useCounter } from '@/hooks/useCounter';
import { audience } from '@/data/sponsors';
import { SponsorJerseyStage } from './SponsorJerseyStage';

/* ── Devenir partenaire (audience + kit média) ──────────────── */
function AudienceCell({ value, label, suffix }: { value: number; label: string; suffix?: string }) {
  const decimals = value % 1 !== 0 ? 1 : 0;
  const { ref, value: v } = useCounter<HTMLSpanElement>({ to: value, decimals });
  return (
    <div className="panel-concrete border-2 border-line-strong p-5 text-center">
      <span ref={ref} className="hud-title block text-4xl font-bold text-accent glow-text">
        {v}
        {suffix}
      </span>
      <p className="hud-label mt-1 text-[9px]">{label}</p>
    </div>
  );
}

function BecomePartner() {
  return (
    <HudFrame label="DEVENIR PARTENAIRE" corner="OPEN SLOT" tone="accent" className="cut-panel">
      <div className="p-6 sm:p-10">
        <h2 className="hud-title text-3xl font-bold sm:text-5xl">REJOIGNEZ LE SIGNAL</h2>
        <p className="mt-3 max-w-xl font-mono text-sm leading-relaxed text-[color:var(--text-dim)]">
          &gt; Associez votre marque à une structure en pleine ascension. Voici notre audience.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {audience.map((a) => (
            <AudienceCell key={a.label} value={a.value} label={a.label} suffix={a.suffix} />
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <KeycapButton href="mailto:partenariats@example.com" size="lg">
            &gt; Nous contacter
          </KeycapButton>
          <KeycapButton variant="secondary" size="lg" href="#">
            ⤓ Kit média (PDF)
          </KeycapButton>
        </div>
      </div>
    </HudFrame>
  );
}

/* ── Composition ────────────────────────────────────────────── */
export function SponsorShowcase() {
  return (
    <>
      {/* maillot 3D : patchs sponsors cliquables, la caméra zoome sur l'emplacement */}
      <SponsorJerseyStage />

      <FunnelStage intensity={8} depth={60} perspective={1700} className="mt-14">
        <div data-tilt>
          <BecomePartner />
        </div>
      </FunnelStage>
    </>
  );
}
