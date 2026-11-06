import type { Player } from '@lignezero/types';
import {
  BackdropWord,
  Bloom,
  BrandHeader,
  C,
  ConeHeadline,
  DISPLAY,
  Frame,
  Glow,
  HazardBand,
  MONO,
  Silhouette,
  shade,
  unit,
} from '../primitives';
import { hashtags, lines } from '../caption';
import { brandName } from '../brand';
import type { FieldDef, StudioData, TemplateDef } from '../types';

export interface StatHighlightContent {
  statValue: string;
  statLabel: string;
  context: string;
  playerName: string;
  playerRole: string;
  gameTag: string;
  brand: string;
  playerColor: string;
  playerPhoto?: string;
}

const FIELDS: FieldDef<StatHighlightContent>[] = [
  { key: 'statValue', label: 'Chiffre' },
  { key: 'statLabel', label: 'Libellé stat' },
  { key: 'playerName', label: 'Pseudo' },
  { key: 'playerRole', label: 'Rôle' },
  { key: 'gameTag', label: 'Sigle jeu' },
  { key: 'playerColor', label: 'Couleur', type: 'color' },
  { key: 'context', label: 'Contexte', span: 2 },
  { key: 'playerPhoto', label: 'Photo joueur', type: 'image' },
];

function StatHighlightVisual({ content: c, w, h }: { content: StatHighlightContent; w: number; h: number }) {
  const u = unit(w, h);
  const col = c.playerColor || C.accent;
  const land = w / h >= 1.3;
  const dark = shade(col, 52);

  const figH = land ? h * 0.9 : h * 0.5;
  const figW = figH * 0.64;
  const figLeft = land ? w - figW - w * 0.04 : (w - figW) / 2;
  const figTop = h - figH;

  return (
    <Frame w={w} h={h} bg={`radial-gradient(120% 90% at ${land ? '74%' : '50%'} 6%, ${dark} 0%, ${C.base900} 66%)`}>
      <BackdropWord text={c.statLabel} u={u} x={w * 0.04} y={h * 0.06} size={u * 16} color="rgba(255,255,255,0.05)" />
      <Bloom color={col} x={figLeft + figW / 2} y={h * 0.5} size={figW * 2.1} opacity={0.4} />
      <Glow color={col} x={figLeft + figW / 2} y={h * 0.55} size={figW * 1.4} opacity={0.2} />
      <HazardBand u={u} w={w} h={h} color={col} top={0.8} />

      {/* figure joueur */}
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

      <BrandHeader u={u} brand={c.brand} tag={c.gameTag} />

      {/* accroche */}
      <div style={{ position: 'absolute', left: w * 0.05, top: land ? h * 0.15 : h * 0.09 }}>
        <ConeHeadline text="STAT" u={u} depth={C.accent} />
      </div>

      {/* chiffre géant */}
      <div style={{ position: 'absolute', left: u * 6, top: land ? h * 0.36 : h * 0.3 }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * (land ? 40 : 34), lineHeight: 0.8, color: C.text, textShadow: `${u * 0.8}px ${u * 1}px 0 ${col}` }}>
          {c.statValue}
        </div>
        <div style={{ display: 'inline-block', marginTop: u * 1, fontFamily: MONO, fontSize: u * 2.4, letterSpacing: u * 0.3, textTransform: 'uppercase', color: C.ink, background: col, padding: `${u * 0.6}px ${u * 1.6}px` }}>
          {c.statLabel}
        </div>
      </div>

      {/* identité + contexte */}
      <div style={{ position: 'absolute', left: u * 7, bottom: u * 8, maxWidth: land ? '52%' : '78%' }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 6, lineHeight: 0.9, textTransform: 'uppercase', color: C.text }}>
          {c.playerName}
          <span style={{ fontFamily: MONO, fontSize: u * 1.8, color: col, marginLeft: u * 1.5 }}>{c.playerRole}</span>
        </div>
        <div style={{ width: u * 12, height: u * 0.4, background: col, margin: `${u * 1.2}px 0` }} />
        <div style={{ fontFamily: MONO, fontSize: u * 2.2, color: C.dim }}>{c.context}</div>
      </div>
    </Frame>
  );
}

export const statHighlightTemplate: TemplateDef<StatHighlightContent> = {
  id: 'stat-highlight',
  label: 'Stat highlight',
  group: 'joueur',
  source: 'player',
  hint: 'Un chiffre marquant d’un joueur (repris de sa 1ʳᵉ stat).',
  fields: FIELDS,
  Visual: StatHighlightVisual,
  fromData: (data: StudioData, sel) => {
    const p: Player | undefined = data.players.find((x) => x.id === sel.playerId) ?? data.players[0];
    if (!p) return null;
    const g = data.games.find((x) => x.id === p.gameId);
    const s = p.stats?.[0];
    return {
      statValue: s?.value ?? '—',
      statLabel: s?.label ?? 'STAT',
      context: `${p.pseudo} continue d’empiler les chiffres cette saison.`,
      playerName: p.pseudo,
      playerRole: p.role,
      gameTag: g?.tag ?? '—',
      brand: brandName(),
      playerColor: p.color ?? C.accent,
      playerPhoto: p.photo,
    };
  },
  caption: (c) =>
    lines(
      `📈 ${c.statValue} ${c.statLabel} — ${c.playerName}`,
      ``,
      c.context,
      ``,
      hashtags(c.gameTag, ['stats']),
    ),
};
