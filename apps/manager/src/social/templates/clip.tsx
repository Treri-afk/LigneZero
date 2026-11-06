import type { Clip } from '@lignezero/types';
import { BackdropWord, Bloom, BrandHeader, C, CornerTicks, DISPLAY, Frame, MONO, Photo, TitleBlock, unit } from '../primitives';
import { hashtags, lines } from '../caption';
import { brandName } from '../brand';
import type { FieldDef, StudioData, TemplateDef } from '../types';

export interface ClipContent {
  headline: string;
  brand: string;
  title: string;
  author: string;
  game: string;
  thumb?: string;
}

const FIELDS: FieldDef<ClipContent>[] = [
  { key: 'headline', label: 'Titre' },
  { key: 'game', label: 'Jeu' },
  { key: 'title', label: 'Titre du clip', span: 2 },
  { key: 'author', label: 'Auteur' },
  { key: 'thumb', label: 'Vignette', type: 'image' },
];

function ClipVisual({ content: c, w, h }: { content: ClipContent; w: number; h: number }) {
  const u = unit(w, h);
  const land = w / h >= 1.3;

  // Cadre média 16:9 centré-haut.
  const frameW = land ? w * 0.56 : w * 0.86;
  const frameH = frameW * (9 / 16);
  const frameLeft = (w - frameW) / 2;
  const frameTop = land ? h * 0.2 : h * 0.24;

  return (
    <Frame w={w} h={h}>
      <BackdropWord text="REPLAY" u={u} x={-u * 1} y={h * 0.62} size={u * 26} color="rgba(255,255,255,0.045)" />
      <Bloom color={C.accent} x={w * 0.5} y={frameTop + frameH / 2} size={frameW * 1.2} opacity={0.24} />
      <BrandHeader u={u} brand={c.brand} tag={c.game} />

      <div style={{ position: 'absolute', top: u * 13, left: u * 8, right: u * 8 }}>
        <TitleBlock u={u} kicker="TEMPS FORT" title={c.headline} size={u * 9} />
      </div>

      {/* cadre média */}
      <div style={{ position: 'absolute', left: frameLeft, top: frameTop, width: frameW, height: frameH }}>
        <div style={{ position: 'relative', width: '100%', height: '100%', border: `${u * 0.4}px solid rgba(255,255,255,0.55)`, overflow: 'hidden', background: C.base800, boxShadow: `${u * 1.6}px ${u * 1.8}px 0 rgba(0,0,0,0.6)` }}>
          {c.thumb ? (
            <Photo src={c.thumb} fit="cover" style={{ width: '100%', height: '100%' }} />
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(45deg, ${C.base700} 0 ${u * 3}px, ${C.base800} ${u * 3}px ${u * 6}px)` }} />
          )}
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,0.4) 100%)' }} />
          <CornerTicks u={u} size={3} inset={2} weight={0.4} />
          {/* bouton play */}
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: u * 12, height: u * 12, borderRadius: '50%', background: 'rgba(242,49,39,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 ${u * 6}px rgba(242,49,39,0.6)` }}>
            <div style={{ width: 0, height: 0, borderTop: `${u * 3}px solid transparent`, borderBottom: `${u * 3}px solid transparent`, borderLeft: `${u * 5}px solid #fff`, marginLeft: u * 1.2 }} />
          </div>
          {/* timecode déco */}
          <div style={{ position: 'absolute', right: u * 1.6, bottom: u * 1.4, fontFamily: MONO, fontSize: u * 1.8, color: '#fff', background: 'rgba(0,0,0,0.6)', padding: `${u * 0.3}px ${u * 1}px` }}>0:14</div>
        </div>
      </div>

      {/* titre du clip + auteur */}
      <div style={{ position: 'absolute', left: u * 8, right: u * 8, bottom: u * 7 }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 4.4, lineHeight: 1, textTransform: 'uppercase', color: C.text }}>{c.title}</div>
        <div style={{ fontFamily: MONO, fontSize: u * 2.2, color: C.accent, marginTop: u * 0.8 }}>▶ {c.author} · {c.game}</div>
      </div>
    </Frame>
  );
}

export const clipTemplate: TemplateDef<ClipContent> = {
  id: 'clip',
  label: 'Clip / temps fort',
  group: 'commu',
  source: 'clip',
  hint: 'Met en avant un clip communautaire (vignette + auteur).',
  fields: FIELDS,
  Visual: ClipVisual,
  fromData: (data: StudioData, sel) => {
    const clip: Clip | undefined = data.clips.find((x) => x.id === sel.clipId) ?? data.clips[0];
    if (!clip) return null;
    return {
      headline: 'CLIP',
      brand: brandName(),
      title: clip.title,
      author: clip.author,
      game: clip.game ?? '—',
      thumb: clip.thumb,
    };
  },
  caption: (c) =>
    lines(
      `🎬 TEMPS FORT — ${c.title}`,
      ``,
      `Signé ${c.author} sur ${c.game}. 🔥`,
      ``,
      hashtags(c.game, ['clip', 'highlight']),
    ),
};
