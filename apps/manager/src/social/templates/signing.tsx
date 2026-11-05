import type { Player } from '@lignezero/types';
import { BackdropWord, Bloom, BrandHeader, C, ConeHeadline, DISPLAY, Frame, Glow, HazardBand, MONO, Silhouette, shade, unit } from '../primitives';
import { hashtags, lines } from '../caption';
import { brandName } from '../brand';
import type { FieldDef, StudioData, TemplateDef } from '../types';

export interface SigningContent {
  headline: string;
  brand: string;
  playerName: string;
  playerRole: string;
  gameTag: string;
  playerColor: string;
  playerPhoto?: string;
  welcomeLine: string;
  sinceLabel: string;
  /** Libellé du tag HUD (ex. « Nouvelle recrue », « Départ »). */
  kicker: string;
}

const FIELDS: FieldDef<SigningContent>[] = [
  { key: 'headline', label: 'Accroche (cône)', span: 2 },
  { key: 'playerName', label: 'Pseudo' },
  { key: 'playerRole', label: 'Rôle' },
  { key: 'gameTag', label: 'Sigle jeu' },
  { key: 'sinceLabel', label: 'Depuis (label)' },
  { key: 'playerColor', label: 'Couleur joueur', type: 'color' },
  { key: 'playerPhoto', label: 'Photo joueur', type: 'image' },
  { key: 'welcomeLine', label: 'Ligne d’accueil', span: 2 },
];

function SigningVisual({ content: c, w, h }: { content: SigningContent; w: number; h: number }) {
  const u = unit(w, h);
  const col = c.playerColor || C.accent;
  const land = w / h >= 1.3;
  const dark = shade(col, 52);

  const figH = land ? h * 0.92 : h * 0.62;
  const figW = figH * 0.66;
  const figLeft = land ? w - figW - w * 0.04 : (w - figW) / 2;
  const figTop = h - figH;

  return (
    <Frame w={w} h={h} bg={`radial-gradient(120% 90% at ${land ? '72%' : '50%'} 8%, ${dark} 0%, ${C.base900} 68%)`}>
      {/* Nom géant en filigrane derrière le sujet */}
      <BackdropWord
        text={c.playerName}
        u={u}
        x={land ? w * 0.28 : w * 0.02}
        y={land ? h * 0.28 : h * 0.16}
        size={u * (land ? 34 : 26)}
        color={`color-mix(in srgb, ${col} 14%, transparent)`}
      />
      <Bloom color={col} x={figLeft + figW / 2} y={h * 0.5} size={figW * 2.2} opacity={0.45} />
      <Glow color={col} x={figLeft + figW / 2} y={h * 0.55} size={figW * 1.5} opacity={0.22} />
      <HazardBand u={u} w={w} h={h} color={col} top={0.82} />

      {/* silhouette / photo */}
      <div style={{ position: 'absolute', left: figLeft, top: figTop, width: figW, height: figH, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div style={{ height: '100%', width: '100%' }}>
          {c.playerPhoto ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <img src={c.playerPhoto} style={{ height: '100%', width: '100%', objectFit: 'contain', objectPosition: 'bottom' }} />
          ) : (
            <Silhouette color={col} />
          )}
        </div>
      </div>
      {/* ombre au sol pour asseoir le sujet */}
      <div aria-hidden style={{ position: 'absolute', left: figLeft, bottom: h * 0.06, width: figW, height: u * 3, background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, transparent 70%)' }} />

      <BrandHeader u={u} brand={c.brand} tag={c.gameTag} />

      {/* Tag NEW SIGNING (détail HUD) */}
      <div style={{ position: 'absolute', left: w * 0.05, top: land ? h * 0.115 : h * 0.075, display: 'flex', alignItems: 'center', gap: u * 1.2 }}>
        <span style={{ width: u * 1.3, height: u * 1.3, background: C.accent, borderRadius: '50%', boxShadow: `0 0 ${u * 1.4}px ${C.accent}` }} />
        <span style={{ fontFamily: MONO, fontSize: u * 1.8, letterSpacing: u * 0.4, color: C.accent, textTransform: 'uppercase' }}>{c.kicker} // {c.sinceLabel}</span>
      </div>

      {/* accroche 3D */}
      <div style={{ position: 'absolute', left: w * 0.05, top: land ? h * 0.17 : h * 0.11 }}>
        <ConeHeadline text={c.headline} u={u} depth={C.accent} />
      </div>

      {/* bloc identité (bas-gauche) */}
      <div style={{ position: 'absolute', left: u * 7, bottom: u * 10, maxWidth: land ? '52%' : '72%' }}>
        <span style={{ display: 'inline-block', fontFamily: MONO, fontSize: u * 2, letterSpacing: u * 0.2, color: C.ink, background: col, padding: `${u * 0.5}px ${u * 1.4}px`, textTransform: 'uppercase', boxShadow: `${u * 0.5}px ${u * 0.5}px 0 rgba(0,0,0,0.5)` }}>
          {c.playerRole} · {c.gameTag}
        </span>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 13, lineHeight: 0.86, textTransform: 'uppercase', color: C.text, textShadow: `${u * 0.5}px ${u * 0.65}px 0 ${col}`, marginTop: u * 1.2 }}>
          {c.playerName}
        </div>
        <div style={{ width: u * 14, height: u * 0.4, background: col, marginTop: u * 1.4 }} />
        <div style={{ fontFamily: MONO, fontSize: u * 2.4, color: C.dim, marginTop: u * 1.4, maxWidth: u * 60 }}>{c.welcomeLine}</div>
      </div>
    </Frame>
  );
}

export const signingTemplate: TemplateDef<SigningContent> = {
  id: 'signing',
  label: 'Signature / bienvenue',
  group: 'joueur',
  source: 'player',
  hint: 'Annonce d’arrivée d’un joueur. Choisis le joueur dans l’effectif.',
  fields: FIELDS,
  Visual: SigningVisual,
  fromData: (data: StudioData, sel) => {
    const p: Player | undefined = data.players.find((x) => x.id === sel.playerId) ?? data.players[0];
    if (!p) return null;
    const g = data.games.find((x) => x.id === p.gameId);
    return {
      headline: 'WELCOME',
      brand: brandName(),
      playerName: p.pseudo,
      playerRole: p.role,
      gameTag: g?.tag ?? '—',
      playerColor: p.color ?? C.accent,
      playerPhoto: p.photo,
      welcomeLine: `Bienvenue à ${p.pseudo} qui rejoint l’effectif ${g?.tag ?? ''}.`.trim(),
      sinceLabel: p.joinedYear ? `${p.joinedYear}` : 'NOUVELLE RECRUE',
      kicker: 'Nouvelle recrue',
    };
  },
  caption: (c) =>
    lines(
      `🔴 WELCOME ${c.playerName} !`,
      ``,
      c.welcomeLine,
      `Poste : ${c.playerRole} · ${c.gameTag}`,
      ``,
      hashtags(c.gameTag, ['welcome', 'roster']),
    ),
};

export const farewellTemplate: TemplateDef<SigningContent> = {
  id: 'farewell',
  label: 'Départ / merci',
  group: 'joueur',
  source: 'player',
  hint: 'Annonce de départ d’un joueur, ton reconnaissant.',
  fields: FIELDS,
  Visual: SigningVisual,
  fromData: (data: StudioData, sel) => {
    const p: Player | undefined = data.players.find((x) => x.id === sel.playerId) ?? data.players[0];
    if (!p) return null;
    const g = data.games.find((x) => x.id === p.gameId);
    return {
      headline: 'MERCI',
      brand: brandName(),
      playerName: p.pseudo,
      playerRole: p.role,
      gameTag: g?.tag ?? '—',
      playerColor: p.color ?? C.accent,
      playerPhoto: p.photo,
      welcomeLine: `Merci à ${p.pseudo} pour tout. Bonne route pour la suite. 🔴`,
      sinceLabel: p.joinedYear ? `${p.joinedYear}` : 'MERCI',
      kicker: 'Départ',
    };
  },
  caption: (c) =>
    lines(
      `Merci ${c.playerName} 🔴`,
      ``,
      c.welcomeLine,
      ``,
      hashtags(c.gameTag, ['merci', 'farewell']),
    ),
};
