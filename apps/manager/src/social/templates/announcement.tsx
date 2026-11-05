import { BackdropWord, Bloom, BrandHeader, C, ChamferPanel, CornerTicks, DISPLAY, DotGrid, Frame, HazardBand, MONO, unit } from '../primitives';
import { hashtags, lines } from '../caption';
import { brandName } from '../brand';
import type { FieldDef, TemplateDef } from '../types';

/**
 * Communiqué : le seul poste 100% ÉDITORIAL du studio. Pas de match, pas de
 * joueur — juste un titre et un corps de texte, pour annoncer ce qui n'entre
 * dans aucune autre case (changement d'organisation, prise de position,
 * information officielle).
 *
 * Si des annonces ont déjà été saisies dans le manager, la plus récente
 * pré-remplit le formulaire : on évite de retaper un texte déjà écrit.
 */
export interface AnnouncementContent {
  brand: string;
  kicker: string;
  title: string;
  body: string;
  signature: string;
  date: string;
}

const FIELDS: FieldDef<AnnouncementContent>[] = [
  { key: 'kicker', label: 'Surtitre', placeholder: 'COMMUNIQUÉ OFFICIEL' },
  { key: 'date', label: 'Date affichée', placeholder: '05.08.2026' },
  { key: 'title', label: 'Titre', type: 'textarea', span: 2, placeholder: 'Le titre de l’annonce' },
  { key: 'body', label: 'Corps du texte', type: 'textarea', span: 2, placeholder: 'Le contenu du communiqué…' },
  { key: 'signature', label: 'Signature', placeholder: 'LA DIRECTION' },
];

function AnnouncementVisual({ content: c, w, h }: { content: AnnouncementContent; w: number; h: number }) {
  const u = unit(w, h);
  const portrait = h > w * 1.2;

  // La typo s'adapte à la longueur : un communiqué court doit remplir le cadre,
  // un long doit rester lisible sans déborder.
  const tLen = c.title.length;
  const titleSize = u * (tLen < 28 ? 9 : tLen < 55 ? 7 : tLen < 90 ? 5.4 : 4.2);
  const bLen = c.body.length;
  const bodySize = u * (bLen < 160 ? 3.2 : bLen < 320 ? 2.7 : 2.3);

  return (
    <Frame w={w} h={h}>
      <DotGrid u={u} opacity={0.25} />
      <BackdropWord text="INFO" u={u} x={w * 0.04} y={h * 0.52} size={u * 46} color="rgba(242,49,39,0.08)" />
      <Bloom color={C.accent} x={w * 0.82} y={h * 0.12} size={w * 0.7} opacity={0.12} />
      <HazardBand u={u} w={w} h={h} top={0.9} />
      <BrandHeader u={u} brand={c.brand} tag={c.date} />
      <CornerTicks u={u} />

      {/* surtitre + filet */}
      <div style={{ position: 'absolute', left: u * 8, right: u * 8, top: h * (portrait ? 0.2 : 0.24) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: u * 2 }}>
          <span
            style={{
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: u * 2.4,
              letterSpacing: u * 0.3,
              textTransform: 'uppercase',
              background: C.accent,
              color: C.ink,
              padding: `${u * 0.8}px ${u * 1.8}px`,
            }}
          >
            {c.kicker}
          </span>
          <span style={{ flex: 1, height: u * 0.3, background: C.line }} />
        </div>

        {/* titre */}
        <div
          style={{
            marginTop: u * 4,
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: titleSize,
            lineHeight: 0.98,
            textTransform: 'uppercase',
            color: C.text,
            textShadow: `${u * 0.35}px ${u * 0.45}px 0 ${C.accent}`,
          }}
        >
          {c.title}
        </div>
      </div>

      {/* corps sur panneau béton */}
      <div style={{ position: 'absolute', left: u * 8, right: u * 8, bottom: h * (portrait ? 0.16 : 0.14) }}>
        <ChamferPanel u={u} style={{ padding: `${u * 4}px ${u * 4}px` }}>
          <div style={{ fontFamily: MONO, fontSize: bodySize, lineHeight: 1.6, color: C.text, whiteSpace: 'pre-wrap' }}>
            {c.body}
          </div>
          <div style={{ marginTop: u * 3, display: 'flex', alignItems: 'center', gap: u * 1.6 }}>
            <span style={{ width: u * 6, height: u * 0.4, background: C.accent }} />
            <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 2.8, textTransform: 'uppercase', letterSpacing: u * 0.15, color: C.dim }}>
              {c.signature}
            </span>
          </div>
        </ChamferPanel>
      </div>
    </Frame>
  );
}

/** JJ.MM.AAAA — format court, cohérent avec les autres visuels. */
function shortDate(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

export const announcementTemplate: TemplateDef<AnnouncementContent> = {
  id: 'announcement',
  label: 'Communiqué',
  group: 'divers',
  source: 'none',
  hint: 'Annonce texte libre. Pré-rempli avec la dernière annonce du manager si elle existe.',
  fields: FIELDS,
  Visual: AnnouncementVisual,
  fromData: (data) => {
    const last = data.announcements[0];
    return {
      brand: brandName(),
      kicker: 'COMMUNIQUÉ OFFICIEL',
      date: shortDate(last?.createdAt),
      title: last?.title ?? 'Titre du communiqué',
      body: last?.body ?? 'Le contenu de l’annonce. Deux ou trois phrases suffisent : le visuel porte le titre, la légende porte le détail.',
      signature: 'LA DIRECTION',
    };
  },
  caption: (c) => lines(`📢 ${c.title}`, ``, c.body, ``, `— ${c.signature}`, ``, hashtags(undefined, ['communique'])),
};
