import { BackdropWord, Bloom, BrandHeader, C, DISPLAY, Frame, HazardBand, MONO, unit } from '../primitives';
import { hashtags, lines } from '../caption';
import { brandName } from '../brand';
import type { FieldDef, TemplateDef } from '../types';

export interface QuoteContent {
  brand: string;
  quote: string;
  author: string;
  role: string;
}

const FIELDS: FieldDef<QuoteContent>[] = [
  { key: 'quote', label: 'Citation', type: 'textarea', span: 2 },
  { key: 'author', label: 'Auteur' },
  { key: 'role', label: 'Rôle / contexte' },
];

function QuoteVisual({ content: c, w, h }: { content: QuoteContent; w: number; h: number }) {
  const u = unit(w, h);
  const len = c.quote.length;
  const size = u * (len < 40 ? 8 : len < 90 ? 6 : len < 160 ? 4.6 : 3.6);

  return (
    <Frame w={w} h={h}>
      <BackdropWord text="“" u={u} x={w * 0.02} y={-u * 6} size={u * 70} color="rgba(242,49,39,0.1)" />
      <Bloom color={C.accent} x={w * 0.3} y={h * 0.5} size={w * 0.7} opacity={0.14} />
      <HazardBand u={u} w={w} h={h} top={0.86} />
      <BrandHeader u={u} brand={c.brand} />

      {/* guillemet accent */}
      <div style={{ position: 'absolute', left: u * 7, top: h * 0.2, fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 20, lineHeight: 0.6, color: C.accent }}>“</div>

      {/* citation */}
      <div style={{ position: 'absolute', left: u * 8, right: u * 8, top: h * 0.3, bottom: h * 0.24, display: 'flex', alignItems: 'center' }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: size, lineHeight: 1.02, textTransform: 'uppercase', color: C.text, textShadow: `${u * 0.35}px ${u * 0.45}px 0 ${C.accent}` }}>
          {c.quote}
        </div>
      </div>

      {/* auteur */}
      <div style={{ position: 'absolute', left: u * 8, bottom: u * 8 }}>
        <div style={{ width: u * 10, height: u * 0.5, background: C.accent, marginBottom: u * 1.4 }} />
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 4, textTransform: 'uppercase', color: C.text }}>{c.author}</div>
        <div style={{ fontFamily: MONO, fontSize: u * 2, color: C.dim }}>{c.role}</div>
      </div>
    </Frame>
  );
}

export const quoteTemplate: TemplateDef<QuoteContent> = {
  id: 'quote',
  label: 'Citation',
  group: 'divers',
  source: 'none',
  hint: 'Citation / punchline. Contenu 100% libre.',
  fields: FIELDS,
  Visual: QuoteVisual,
  fromData: () => ({
    brand: brandName(),
    quote: 'On ne joue pas pour participer.',
    author: 'LE COACH',
    role: 'Avant le derby',
  }),
  caption: (c) =>
    lines(`« ${c.quote} »`, ``, `— ${c.author}, ${c.role}`, ``, hashtags(undefined, ['mindset'])),
};
