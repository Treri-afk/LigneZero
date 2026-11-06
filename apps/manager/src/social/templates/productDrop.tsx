import type { Product } from '@lignezero/types';
import { BackdropWord, Bloom, BrandHeader, C, ChamferPanel, ConeHeadline, CornerTicks, DISPLAY, Frame, MONO, Photo, unit } from '../primitives';
import { hashtags, lines } from '../caption';
import { brandName } from '../brand';
import type { FieldDef, StudioData, TemplateDef } from '../types';

export interface ProductDropContent {
  headline: string;
  brand: string;
  name: string;
  category: string;
  price: string;
  status: string;
  image?: string;
}

const FIELDS: FieldDef<ProductDropContent>[] = [
  { key: 'headline', label: 'Accroche (cône)', span: 2 },
  { key: 'name', label: 'Produit' },
  { key: 'category', label: 'Catégorie' },
  { key: 'price', label: 'Prix' },
  { key: 'status', label: 'Statut' },
  { key: 'image', label: 'Visuel produit', type: 'image' },
];

function ProductDropVisual({ content: c, w, h }: { content: ProductDropContent; w: number; h: number }) {
  const u = unit(w, h);
  const land = w / h >= 1.3;
  const boxW = land ? w * 0.4 : w * 0.72;
  const boxH = land ? h * 0.72 : boxW;
  const boxLeft = land ? w - boxW - w * 0.06 : (w - boxW) / 2;
  const boxTop = land ? (h - boxH) / 2 + h * 0.03 : h * 0.32;

  return (
    <Frame w={w} h={h}>
      <BackdropWord text="DROP" u={u} x={-u * 1} y={h * 0.55} size={u * 32} color="rgba(255,255,255,0.05)" />
      <Bloom color={C.accent} x={boxLeft + boxW / 2} y={boxTop + boxH / 2} size={boxW * 1.5} opacity={0.24} />
      <BrandHeader u={u} brand={c.brand} tag={c.category} />

      <div style={{ position: 'absolute', left: w * 0.05, top: land ? h * 0.16 : h * 0.09 }}>
        <ConeHeadline text={c.headline} u={u} depth={C.accent} />
      </div>

      {/* visuel produit */}
      <ChamferPanel u={u} accent={C.accent} style={{ position: 'absolute', left: boxLeft, top: boxTop, width: boxW, height: boxH, background: `radial-gradient(120% 90% at 50% 15%, ${C.base700}, ${C.base900})`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <CornerTicks u={u} size={2.6} inset={1.6} weight={0.34} />
        {c.image ? (
          <Photo src={c.image} fit="contain" style={{ width: '84%', height: '84%' }} />
        ) : (
          <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 6, color: C.mute, textTransform: 'uppercase' }}>{c.name}</span>
        )}
        {/* pastille statut */}
        <div style={{ position: 'absolute', top: u * 2, left: u * 2, fontFamily: MONO, fontWeight: 700, fontSize: u * 1.8, letterSpacing: u * 0.2, textTransform: 'uppercase', background: C.accent, color: '#fff', padding: `${u * 0.5}px ${u * 1.2}px` }}>
          {c.status}
        </div>
      </ChamferPanel>

      {/* identité + prix */}
      <div style={{ position: 'absolute', left: u * 7, bottom: u * 9, maxWidth: land ? '48%' : '80%' }}>
        <span style={{ fontFamily: MONO, fontSize: u * 1.8, letterSpacing: u * 0.2, color: C.dim, textTransform: 'uppercase' }}>{c.category}</span>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 9, lineHeight: 0.9, textTransform: 'uppercase', color: C.text, textShadow: `${u * 0.5}px ${u * 0.6}px 0 ${C.accent}`, marginTop: u * 0.6 }}>
          {c.name}
        </div>
        {c.price && (
          <div style={{ display: 'inline-block', marginTop: u * 1.4, fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 4.6, color: C.ink, background: C.paper, padding: `${u * 0.4}px ${u * 1.8}px`, boxShadow: `${u * 0.6}px ${u * 0.6}px 0 ${C.base900}` }}>
            {c.price}
          </div>
        )}
      </div>
    </Frame>
  );
}

const STATUS_LABEL: Record<string, string> = { available: 'DISPO', soon: 'BIENTÔT' };

export const productDropTemplate: TemplateDef<ProductDropContent> = {
  id: 'product-drop',
  label: 'Drop produit',
  group: 'boutique',
  source: 'product',
  hint: 'Sortie boutique. Uploade le visuel produit pour un rendu net.',
  fields: FIELDS,
  Visual: ProductDropVisual,
  fromData: (data: StudioData, sel) => {
    const p: Product | undefined = data.products.find((x) => x.id === sel.productId) ?? data.products[0];
    if (!p) return null;
    return {
      headline: p.status === 'soon' ? 'BIENTÔT' : 'DISPO',
      brand: brandName(),
      name: p.name,
      category: p.category,
      price: p.price ?? '',
      status: STATUS_LABEL[p.status] ?? p.status,
      image: p.image,
    };
  },
  caption: (c) =>
    lines(
      `🛒 ${c.status} — ${c.name}`,
      ``,
      `${c.category}${c.price ? ` · ${c.price}` : ''}`,
      `Dispo sur la boutique 👇`,
      ``,
      hashtags(undefined, ['shop', 'drop']),
    ),
};
