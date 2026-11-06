import type { Creator } from '@lignezero/types';
import { BackdropWord, Bloom, BrandHeader, C, CornerTicks, DISPLAY, Frame, MONO, Photo, unit } from '../primitives';
import { hashtags, lines } from '../caption';
import { brandName } from '../brand';
import type { FieldDef, StudioData, TemplateDef } from '../types';

export interface LiveNowContent {
  brand: string;
  name: string;
  role: string;
  platform: string;
  title: string;
  viewers: string;
  avatar?: string;
}

const FIELDS: FieldDef<LiveNowContent>[] = [
  { key: 'name', label: 'Nom' },
  { key: 'role', label: 'Rôle' },
  { key: 'platform', label: 'Plateforme' },
  { key: 'viewers', label: 'Spectateurs' },
  { key: 'title', label: 'Titre du live', span: 2 },
  { key: 'avatar', label: 'Avatar / miniature', type: 'image' },
];

/** Barres d'égaliseur pseudo-aléatoires mais stables (déterministes par index). */
function eqHeights(n: number): number[] {
  return Array.from({ length: n }, (_, i) => 0.35 + 0.6 * Math.abs(Math.sin(i * 1.7 + 0.6)));
}

function LiveNowVisual({ content: c, w, h }: { content: LiveNowContent; w: number; h: number }) {
  const u = unit(w, h);
  const land = w / h >= 1.3;

  // Écran de stream 16:9.
  const scW = land ? w * 0.5 : w * 0.86;
  const scH = scW * (9 / 16);
  const scLeft = land ? w - scW - w * 0.05 : (w - scW) / 2;
  const scTop = land ? (h - scH) / 2 + h * 0.03 : h * 0.5;

  return (
    <Frame w={w} h={h} texture={{ scanlines: 0.08 }} bg={`radial-gradient(130% 100% at ${land ? '72%' : '50%'} 12%, ${C.base700} 0%, ${C.base900} 66%)`}>
      <BackdropWord text="LIVE" u={u} x={w * 0.02} y={h * 0.08} size={u * 44} color="rgba(242,49,39,0.07)" />
      <Bloom color={C.accent} x={scLeft + scW / 2} y={scTop + scH / 2} size={scW * 1.3} opacity={0.32} />
      <BrandHeader u={u} brand={c.brand} />

      {/* ── ÉCRAN DE STREAM ── */}
      <div style={{ position: 'absolute', left: scLeft, top: scTop, width: scW, height: scH }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            border: `${u * 0.45}px solid rgba(255,255,255,0.6)`,
            background: c.avatar ? C.base900 : `radial-gradient(120% 120% at 50% 30%, ${C.base700}, ${C.base900})`,
            boxShadow: `${u * 1.8}px ${u * 2.2}px 0 rgba(0,0,0,0.65), 0 0 ${u * 6}px rgba(242,49,39,0.35)`,
          }}
        >
          {c.avatar ? (
            <Photo src={c.avatar} fit="cover" style={{ width: '100%', height: '100%' }} />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISPLAY, fontWeight: 700, fontSize: scH * 0.5, color: 'rgba(255,255,255,0.12)' }}>
              {c.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          {/* vignette écran */}
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 45%, transparent 45%, rgba(0,0,0,0.55) 100%)' }} />
          <CornerTicks u={u} size={2.8} inset={1.8} weight={0.4} />

          {/* LIVE pill (haut-gauche) */}
          <div style={{ position: 'absolute', top: u * 2, left: u * 2, display: 'flex', alignItems: 'center', gap: u * 1, background: C.accent, color: '#fff', fontFamily: MONO, fontWeight: 700, fontSize: u * 2, letterSpacing: u * 0.3, padding: `${u * 0.5}px ${u * 1.4}px`, boxShadow: `0 0 ${u * 3}px rgba(242,49,39,0.7)` }}>
            <span style={{ width: u * 1.3, height: u * 1.3, borderRadius: '50%', background: '#fff' }} />
            LIVE
          </div>
          {/* viewers (haut-droite) */}
          <div style={{ position: 'absolute', top: u * 2, right: u * 2, display: 'flex', alignItems: 'center', gap: u * 0.8, background: 'rgba(0,0,0,0.6)', color: '#fff', fontFamily: MONO, fontSize: u * 1.9, padding: `${u * 0.5}px ${u * 1.2}px` }}>
            ● {c.viewers}
          </div>

          {/* barre de lecture / infos bas */}
          <div style={{ position: 'absolute', left: u * 2, right: u * 2, bottom: u * 1.8 }}>
            {/* égaliseur */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: u * 0.5, height: u * 4, marginBottom: u * 1 }}>
              {eqHeights(Math.round(scW / (u * 1.4))).map((v, i) => (
                <div key={i} style={{ flex: 1, height: `${v * 100}%`, background: i % 5 === 0 ? C.accent : 'rgba(255,255,255,0.75)' }} />
              ))}
            </div>
            <div style={{ height: u * 0.5, background: 'rgba(255,255,255,0.25)' }}>
              <div style={{ width: '64%', height: '100%', background: C.accent }} />
            </div>
          </div>
        </div>
        {/* étiquette plateforme sous l'écran */}
        <div style={{ position: 'absolute', bottom: -u * 3.4, right: 0, fontFamily: MONO, fontSize: u * 1.8, letterSpacing: u * 0.2, color: C.dim }}>
          ▶ {c.platform.toUpperCase()} / {c.name.toUpperCase()}
        </div>
      </div>

      {/* ── COLONNE TEXTE ── */}
      <div style={{ position: 'absolute', left: u * 7, top: land ? h * 0.24 : h * 0.6, maxWidth: land ? '44%' : '86%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: u * 1.2, fontFamily: MONO, fontSize: u * 2.2, letterSpacing: u * 0.3, color: C.accent, textTransform: 'uppercase' }}>
          <span style={{ width: u * 1.4, height: u * 1.4, borderRadius: '50%', background: C.accent, boxShadow: `0 0 ${u * 2}px ${C.accent}` }} />
          En direct · {c.platform}
        </div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 12, lineHeight: 0.86, textTransform: 'uppercase', color: C.text, textShadow: `${u * 0.5}px ${u * 0.65}px 0 ${C.accent}`, marginTop: u * 0.8 }}>
          {c.name}
        </div>
        <div style={{ fontFamily: MONO, fontSize: u * 2, color: C.dim, marginTop: u * 0.6 }}>{c.role}</div>

        {/* quote box titre du live */}
        <div style={{ position: 'relative', marginTop: u * 2.4, padding: `${u * 1.4}px ${u * 2}px`, borderLeft: `${u * 0.5}px solid ${C.accent}`, background: 'rgba(18,16,19,0.72)' }}>
          <CornerTicks u={u} size={1.6} inset={0.8} weight={0.25} color={C.line} />
          <div style={{ fontFamily: MONO, fontSize: u * 2.1, color: C.text }}>« {c.title} »</div>
        </div>

        {/* CTA */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: u * 1.2, marginTop: u * 2.4, fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 3, textTransform: 'uppercase', letterSpacing: u * 0.15, color: '#fff', background: C.accent, padding: `${u * 1}px ${u * 2.2}px`, boxShadow: `${u * 0.6}px ${u * 0.6}px 0 rgba(0,0,0,0.55)` }}>
          Regarder le live ▶
        </div>
      </div>
    </Frame>
  );
}

export const liveNowTemplate: TemplateDef<LiveNowContent> = {
  id: 'live-now',
  label: 'En live',
  group: 'commu',
  source: 'creator',
  hint: 'Signale un créateur en direct (écran + titre + spectateurs).',
  fields: FIELDS,
  Visual: LiveNowVisual,
  fromData: (data: StudioData, sel) => {
    const cr: Creator | undefined = data.creators.find((x) => x.id === sel.creatorId) ?? data.creators[0];
    if (!cr) return null;
    return {
      brand: brandName(),
      name: cr.name,
      role: cr.role ?? 'Créateur',
      platform: cr.platform,
      title: cr.title ?? 'En direct maintenant',
      viewers: cr.viewers ? `${cr.viewers.toLocaleString('fr-FR')} viewers` : 'LIVE',
      avatar: cr.avatar,
    };
  },
  caption: (c) =>
    lines(
      `🔴 ${c.name} EST EN LIVE sur ${c.platform} !`,
      ``,
      `« ${c.title} »`,
      `Rejoins le stream 👇`,
      ``,
      hashtags(undefined, ['live', c.platform]),
    ),
};
