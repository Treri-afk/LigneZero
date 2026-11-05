import { BackdropWord, Bloom, BrandHeader, C, ChamferPanel, ConeHeadline, CornerTicks, DISPLAY, Frame, HazardBand, MONO, unit } from '../primitives';
import { hashtags, lines } from '../caption';
import { brandName } from '../brand';
import type { FieldDef, TemplateDef } from '../types';

export interface RecruitmentContent {
  headline: string;
  brand: string;
  gameTag: string;
  roles: string;
  contact: string;
}

const FIELDS: FieldDef<RecruitmentContent>[] = [
  { key: 'headline', label: 'Accroche (cône)', span: 2 },
  { key: 'gameTag', label: 'Jeu / division' },
  { key: 'roles', label: 'Postes recherchés (un par ligne)', type: 'textarea', span: 2 },
  { key: 'contact', label: 'Contact / CTA', span: 2 },
];

function RecruitmentVisual({ content: c, w, h }: { content: RecruitmentContent; w: number; h: number }) {
  const u = unit(w, h);
  const roles = c.roles.split('\n').map((r) => r.trim()).filter(Boolean).slice(0, 5);

  return (
    <Frame w={w} h={h}>
      <BackdropWord text="TRYOUTS" u={u} x={-u * 1} y={h * 0.58} size={u * 26} color="rgba(242,49,39,0.07)" />
      <Bloom color={C.accent} x={w * 0.7} y={h * 0.3} size={w * 0.6} opacity={0.18} />
      <HazardBand u={u} w={w} h={h} top={0.16} />
      <BrandHeader u={u} brand={c.brand} tag={c.gameTag} />

      <div style={{ position: 'absolute', left: w * 0.05, top: h * 0.15 }}>
        <ConeHeadline text={c.headline} u={u} depth={C.accent} />
      </div>

      {/* postes */}
      <div style={{ position: 'absolute', top: u * 34, bottom: u * 16, left: u * 8, right: u * 8, display: 'flex', flexDirection: 'column', gap: u * 2 }}>
        {roles.map((r, i) => (
          <ChamferPanel key={i} u={u} accent={C.accent} style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', gap: u * 2.4, padding: `${u * 1.2}px ${u * 2.4}px` }}>
            <CornerTicks u={u} size={1.6} inset={0.9} weight={0.24} color={C.line} />
            <span style={{ fontFamily: MONO, fontSize: u * 2, color: C.accent }}>{`${i + 1}`.padStart(2, '0')}</span>
            <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 4, textTransform: 'uppercase', color: C.text }}>{r}</span>
            <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: u * 1.8, color: C.mute }}>OPEN</span>
          </ChamferPanel>
        ))}
      </div>

      {/* CTA */}
      <div style={{ position: 'absolute', left: u * 8, right: u * 8, bottom: u * 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 3, textTransform: 'uppercase', color: C.ink, background: C.accent, padding: `${u * 0.6}px ${u * 1.8}px` }}>
          {c.contact}
        </span>
        <span style={{ fontFamily: MONO, fontSize: u * 2, color: C.dim }}>{c.gameTag}</span>
      </div>
    </Frame>
  );
}

export const recruitmentTemplate: TemplateDef<RecruitmentContent> = {
  id: 'recruitment',
  label: 'Recrutement',
  group: 'divers',
  source: 'none',
  hint: 'Annonce « on recrute ». Un poste par ligne.',
  fields: FIELDS,
  Visual: RecruitmentVisual,
  fromData: () => ({
    headline: 'ON RECRUTE',
    brand: brandName(),
    gameTag: 'VALORANT',
    roles: 'Duelliste\nCoach analyste\nCréateur de contenu',
    contact: 'DM ouverts',
  }),
  caption: (c) =>
    lines(
      `🚨 ${brandName()} RECRUTE — ${c.gameTag}`,
      ``,
      c.roles
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean)
        .map((r) => `• ${r}`)
        .join('\n'),
      ``,
      `${c.contact} 👇`,
      ``,
      hashtags(c.gameTag, ['recrutement', 'tryouts']),
    ),
};
