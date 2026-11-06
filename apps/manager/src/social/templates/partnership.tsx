import type { Sponsor } from '@lignezero/types';
import {
  BackdropWord,
  Bloom,
  BrandHeader,
  C,
  ConeHeadline,
  CornerTicks,
  DISPLAY,
  Frame,
  Glow,
  HudStrip,
  MONO,
  Photo,
  unit,
} from '../primitives';
import { hashtags, lines } from '../caption';
import { brandName } from '../brand';
import type { FieldDef, StudioData, TemplateDef } from '../types';

export interface PartnershipContent {
  headline: string;
  brand: string;
  sponsorName: string;
  sponsorLogo?: string;
  tagline: string;
  tier: string;
  sector: string;
  since: string;
}

const FIELDS: FieldDef<PartnershipContent>[] = [
  { key: 'headline', label: 'Accroche (cône)', span: 2 },
  { key: 'sponsorName', label: 'Sponsor' },
  { key: 'tier', label: 'Niveau (tier)' },
  { key: 'sector', label: 'Secteur' },
  { key: 'since', label: 'Depuis (année)' },
  { key: 'sponsorLogo', label: 'Logo sponsor', type: 'image' },
  { key: 'tagline', label: 'Accroche partenariat', span: 2 },
];

function PartnershipVisual({ content: c, w, h }: { content: PartnershipContent; w: number; h: number }) {
  const u = unit(w, h);
  const land = w / h >= 1.3;

  const boxW = land ? w * 0.42 : w * 0.76;
  const boxH = boxW * 0.6;
  const boxLeft = land ? w - boxW - w * 0.06 : (w - boxW) / 2;
  const boxTop = land ? (h - boxH) / 2 + h * 0.05 : h * 0.34;

  return (
    <Frame w={w} h={h} bg={`radial-gradient(130% 100% at ${land ? '74%' : '50%'} 12%, ${C.base700} 0%, ${C.base900} 68%)`}>
      <BackdropWord text="OFFICIAL" u={u} x={-u * 1} y={h * 0.58} size={u * 24} color="rgba(255,255,255,0.04)" />
      <Bloom color={C.accent} x={boxLeft + boxW / 2} y={boxTop + boxH / 2} size={boxW * 1.7} opacity={0.28} />
      <Glow color={C.accent} x={boxLeft + boxW / 2} y={boxTop + boxH / 2} size={boxW * 1.1} opacity={0.16} />

      <BrandHeader u={u} brand={c.brand} />

      {/* accroche */}
      <div style={{ position: 'absolute', left: w * 0.05, top: land ? h * 0.17 : h * 0.09 }}>
        <ConeHeadline text={c.headline} u={u} depth={C.accent} />
      </div>

      {/* ── CARTE LOGO PREMIUM ── */}
      <div style={{ position: 'absolute', left: boxLeft, top: boxTop, width: boxW, height: boxH, perspective: u * 140 }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            transform: `rotateY(${land ? -8 : 0}deg) rotateX(3deg)`,
            transformOrigin: 'center',
            // Cadre foncé + double liseré + ombre dure
            background: C.base900,
            border: `${u * 0.35}px solid ${C.accent}`,
            padding: u * 1.4,
            boxShadow: `${u * 2}px ${u * 2.6}px 0 -2px rgba(0,0,0,0.7), 0 ${u * 3}px ${u * 8}px -${u * 2}px ${C.accent}`,
          }}
        >
          {/* label OFFICIAL PARTNER */}
          <div style={{ position: 'absolute', top: -u * 2.4, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: u * 1, background: C.accent, color: '#fff', fontFamily: MONO, fontWeight: 700, fontSize: u * 1.7, letterSpacing: u * 0.3, padding: `${u * 0.5}px ${u * 1.8}px`, whiteSpace: 'nowrap', boxShadow: `${u * 0.5}px ${u * 0.5}px 0 rgba(0,0,0,0.5)` }}>
            ★ PARTENAIRE {c.tier.toUpperCase()}
          </div>

          {/* panneau clair intérieur */}
          <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: `radial-gradient(120% 120% at 50% 0%, #ffffff 0%, ${C.paper} 55%, ${C.concrete} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `${u * 0.2}px solid rgba(255,255,255,0.8)` }}>
            <CornerTicks u={u} size={2.4} inset={1.4} weight={0.3} color="rgba(13,13,11,0.35)" />
            {c.sponsorLogo ? (
              <Photo src={c.sponsorLogo} fit="contain" style={{ maxWidth: '80%', maxHeight: '68%' }} />
            ) : (
              <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 7, color: C.ink, textAlign: 'center', textTransform: 'uppercase', letterSpacing: u * 0.2 }}>{c.sponsorName}</span>
            )}
            {/* foil : sheen diagonal */}
            <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(255,255,255,0) 34%, rgba(255,255,255,0.55) 48%, rgba(255,255,255,0) 60%)', mixBlendMode: 'screen' }} />
            {/* since */}
            {c.since && (
              <span style={{ position: 'absolute', bottom: u * 1.2, right: u * 1.6, fontFamily: MONO, fontSize: u * 1.5, letterSpacing: u * 0.1, color: 'rgba(13,13,11,0.6)' }}>DEPUIS {c.since}</span>
            )}
          </div>
        </div>
      </div>

      {/* connecteur × entre brandName() et le sponsor */}
      <div style={{ position: 'absolute', left: land ? boxLeft - u * 7 : w * 0.5 - u * 4, top: land ? boxTop + boxH / 2 - u * 5.5 : boxTop - u * 9, textAlign: 'center' }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 9, lineHeight: 1, color: C.accent, textShadow: `${u * 0.4}px ${u * 0.5}px 0 ${C.base900}` }}>×</div>
      </div>

      {/* identité sponsor (bas-gauche) */}
      <div style={{ position: 'absolute', left: u * 7, bottom: u * 11, maxWidth: land ? '46%' : '82%' }}>
        <div style={{ fontFamily: MONO, fontSize: u * 1.8, letterSpacing: u * 0.2, color: C.dim, textTransform: 'uppercase' }}>
          {c.brand} accueille
        </div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 9.5, lineHeight: 0.9, textTransform: 'uppercase', color: C.text, textShadow: `${u * 0.5}px ${u * 0.6}px 0 ${C.accent}`, marginTop: u * 0.6 }}>
          {c.sponsorName}
        </div>
        <div style={{ width: u * 12, height: u * 0.4, background: C.accent, margin: `${u * 1.2}px 0` }} />
        <div style={{ fontFamily: MONO, fontSize: u * 2.2, color: C.dim, maxWidth: u * 62 }}>{c.tagline}</div>
      </div>

      <HudStrip u={u} top={h - u * 5.5} items={[`TIER ${c.tier.toUpperCase()}`, c.sector || 'PARTENARIAT', c.since ? `DEPUIS ${c.since}` : 'OFFICIEL']} />
    </Frame>
  );
}

export const partnershipTemplate: TemplateDef<PartnershipContent> = {
  id: 'partnership',
  label: 'Partenariat',
  group: 'sponsor',
  source: 'sponsor',
  hint: 'Annonce d’un partenaire. Uploade son logo pour un rendu net.',
  fields: FIELDS,
  Visual: PartnershipVisual,
  fromData: (data: StudioData, sel) => {
    const s: Sponsor | undefined = data.sponsors.find((x) => x.id === sel.sponsorId) ?? data.sponsors[0];
    if (!s) return null;
    return {
      headline: 'PARTENAIRE',
      brand: brandName(),
      sponsorName: s.name,
      sponsorLogo: s.logo,
      tagline: s.tagline ?? s.description ?? `${brandName()} × ${s.name}.`,
      tier: s.tier,
      sector: s.sector ?? '',
      since: s.since ? `${s.since}` : '',
    };
  },
  caption: (c) =>
    lines(
      `🤝 ${brandName()} × ${c.sponsorName}`,
      ``,
      c.tagline,
      `Partenaire ${c.tier}${c.sector ? ` · ${c.sector}` : ''}.`,
      ``,
      hashtags(undefined, ['partenariat', 'sponsor']),
    ),
};
