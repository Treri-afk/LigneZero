import { BackdropWord, Bloom, BrandHeader, C, CornerTicks, DISPLAY, DotGrid, Frame, HazardBand, MONO, unit } from '../primitives';
import { hashtags, lines } from '../caption';
import { brandName } from '../brand';
import type { FieldDef, TemplateDef } from '../types';

/**
 * Cap franchi / anniversaire : un CHIFFRE énorme et un message court.
 * Volontairement générique — 10 000 abonnés, 3 ans de structure, 100e match…
 * c'est le même poste, seul le libellé change.
 */
export interface MilestoneContent {
  brand: string;
  value: string;
  unitLabel: string;
  title: string;
  message: string;
  accent: string;
}

const FIELDS: FieldDef<MilestoneContent>[] = [
  { key: 'value', label: 'Le chiffre', placeholder: '10K' },
  { key: 'unitLabel', label: 'Unité', placeholder: 'ABONNÉS' },
  { key: 'title', label: 'Titre', span: 2, placeholder: 'MERCI À VOUS' },
  { key: 'message', label: 'Message', type: 'textarea', span: 2 },
  { key: 'accent', label: 'Couleur', type: 'color' },
];

function MilestoneVisual({ content: c, w, h }: { content: MilestoneContent; w: number; h: number }) {
  const u = unit(w, h);
  const accent = c.accent || C.accent;
  // Le chiffre est la star : il occupe la moitié de la hauteur, quelle que
  // soit sa longueur (« 3 » comme « 10 000 » doivent tenir).
  const vLen = c.value.length;
  const valueSize = u * (vLen <= 2 ? 46 : vLen <= 4 ? 36 : vLen <= 6 ? 27 : 20);

  return (
    <Frame w={w} h={h}>
      <DotGrid u={u} opacity={0.22} />
      <Bloom color={accent} x={w * 0.5} y={h * 0.45} size={w * 1.1} opacity={0.2} />
      <BackdropWord text={c.unitLabel} u={u} x={w * 0.03} y={h * 0.78} size={u * 22} color="rgba(255,255,255,0.05)" />
      <HazardBand u={u} w={w} h={h} top={0.92} />
      <BrandHeader u={u} brand={c.brand} tag="MILESTONE" />
      <CornerTicks u={u} />

      {/* chiffre + unité */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: u * 1,
        }}
      >
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: valueSize,
            lineHeight: 0.82,
            color: C.text,
            textShadow: `${u * 0.9}px ${u * 1.1}px 0 ${accent}`,
          }}
        >
          {c.value}
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontWeight: 700,
            fontSize: u * 3.4,
            letterSpacing: u * 0.6,
            textTransform: 'uppercase',
            background: accent,
            color: C.ink,
            padding: `${u * 0.9}px ${u * 2.4}px`,
          }}
        >
          {c.unitLabel}
        </div>
      </div>

      {/* titre + message */}
      <div style={{ position: 'absolute', left: u * 8, right: u * 8, bottom: u * 11, textAlign: 'center' }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 6, textTransform: 'uppercase', color: C.text, lineHeight: 1 }}>
          {c.title}
        </div>
        {c.message && (
          <div style={{ marginTop: u * 2, fontFamily: MONO, fontSize: u * 2.4, lineHeight: 1.5, color: C.dim }}>
            {c.message}
          </div>
        )}
      </div>
    </Frame>
  );
}

export const milestoneTemplate: TemplateDef<MilestoneContent> = {
  id: 'milestone',
  label: 'Cap / anniversaire',
  group: 'divers',
  source: 'none',
  hint: 'Un gros chiffre : abonnés, années d’existence, matchs joués…',
  fields: FIELDS,
  Visual: MilestoneVisual,
  fromData: () => ({
    brand: brandName(),
    value: '10K',
    unitLabel: 'ABONNÉS',
    title: 'Merci à vous',
    message: 'Sans la commu, rien de tout ça. La suite arrive vite.',
    accent: C.accent,
  }),
  caption: (c) =>
    lines(`🎉 ${c.value} ${c.unitLabel} !`, ``, c.title, c.message, ``, hashtags(undefined, ['merci', 'commu'])),
};
