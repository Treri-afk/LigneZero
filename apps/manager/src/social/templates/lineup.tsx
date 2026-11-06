import type { Game, Match, Player } from '@lignezero/types';
import {
  BackdropWord,
  Bloom,
  BrandHeader,
  C,
  ChamferPanel,
  CornerTicks,
  DISPLAY,
  Frame,
  HazardBand,
  IndexTag,
  MONO,
  Silhouette,
  TitleBlock,
  unit,
} from '../primitives';
import { hashtags, lines } from '../caption';
import { brandName } from '../brand';
import type { FieldDef, StudioData, TemplateDef } from '../types';

interface LineupPlayer {
  name: string;
  role: string;
  color: string;
  photo?: string;
}

export interface LineupContent {
  headline: string;
  gameTag: string;
  brand: string;
  opponent: string;
  competition: string;
  dateLabel: string;
  timeLabel: string;
  players: LineupPlayer[];
}

function rosterOf(data: StudioData, g: Game | undefined): LineupPlayer[] {
  const roster: Player[] = g ? data.players.filter((p) => p.gameId === g.id) : [];
  return roster.slice(0, 6).map((p) => ({
    name: p.pseudo,
    role: p.role,
    color: p.color ?? C.accent,
    photo: p.photo,
  }));
}

const FIELDS: FieldDef<LineupContent>[] = [
  { key: 'headline', label: 'Titre', span: 2 },
  { key: 'gameTag', label: 'Sigle jeu' },
  { key: 'opponent', label: 'Adversaire' },
  { key: 'dateLabel', label: 'Date' },
  { key: 'timeLabel', label: 'Heure' },
  { key: 'competition', label: 'Compétition', span: 2 },
];

function LineupVisual({ content: c, w, h }: { content: LineupContent; w: number; h: number }) {
  const u = unit(w, h);
  const players = c.players.slice(0, 6);
  const n = Math.max(players.length, 1);
  const cols = n <= 3 ? n : 3;

  return (
    <Frame w={w} h={h}>
      <BackdropWord text={c.headline} u={u} x={-u * 1} y={h * 0.02} size={u * 30} color="rgba(255,255,255,0.045)" />
      <Bloom color={C.accent} x={w * 0.5} y={h * 0.5} size={w * 0.9} opacity={0.16} />
      <HazardBand u={u} w={w} h={h} top={0.2} />
      <BrandHeader u={u} brand={c.brand} tag={c.gameTag} />

      {/* Titre */}
      <div style={{ position: 'absolute', top: u * 14, left: u * 8, right: u * 8 }}>
        <TitleBlock u={u} kicker={c.dateLabel ? `${c.dateLabel.toUpperCase()} · ${c.timeLabel}` : c.competition} title={c.headline} size={u * 12} />
      </div>

      {/* Grille joueurs */}
      <div
        style={{
          position: 'absolute',
          top: u * 34,
          bottom: u * 16,
          left: u * 8,
          right: u * 8,
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: u * 2.4,
          alignContent: 'stretch',
        }}
      >
        {players.map((p, i) => (
          <ChamferPanel key={p.name} u={u} accent={p.color} style={{ position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <CornerTicks u={u} size={2} inset={1.1} weight={0.28} color={`color-mix(in srgb, ${p.color} 70%, #fff)`} />
            <div style={{ position: 'absolute', top: u * 1.2, right: u * 1.6, zIndex: 2 }}>
              <IndexTag u={u} index={i} total={n} color={p.color} />
            </div>
            {/* zone visuel : flex:1 + minHeight:0 pour pouvoir rétrécir (sinon le nom déborde) */}
            <div
              style={{
                position: 'relative',
                flex: 1,
                minHeight: 0,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                overflow: 'hidden',
                background: `radial-gradient(120% 78% at 50% 12%, color-mix(in srgb, ${p.color} 42%, transparent) 0%, transparent 68%)`,
              }}
            >
              <div style={{ height: '96%', width: '84%' }}>
                {p.photo ? (
                  // eslint-disable-next-line jsx-a11y/alt-text
                  <img src={p.photo} style={{ height: '100%', width: '100%', objectFit: 'contain', objectPosition: 'bottom' }} />
                ) : (
                  <Silhouette color={p.color} />
                )}
              </div>
              {/* dégradé de pied pour asseoir le nom */}
              <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: u * 7, background: `linear-gradient(to top, rgba(18,16,19,0.96), transparent)` }} />
            </div>
            {/* bandeau identité : hauteur naturelle, jamais clippé */}
            <div style={{ flexShrink: 0, padding: `${u * 0.9}px ${u * 1.6}px ${u * 1.3}px`, borderTop: `${u * 0.3}px solid ${p.color}` }}>
              <span style={{ fontFamily: MONO, fontSize: u * 1.5, textTransform: 'uppercase', letterSpacing: u * 0.15, color: p.color }}>{p.role}</span>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 3.4, lineHeight: 1.05, textTransform: 'uppercase', color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: `${u * 0.25}px ${u * 0.3}px 0 ${p.color}` }}>
                {p.name}
              </div>
            </div>
          </ChamferPanel>
        ))}
      </div>

      {/* footer matchup (ou identité effectif si pas d'adversaire) */}
      <div style={{ position: 'absolute', left: u * 8, right: u * 8, bottom: u * 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: u * 1.6, letterSpacing: u * 0.2, color: C.mute, textTransform: 'uppercase' }}>
            {c.opponent ? 'Prochain adversaire' : 'Effectif'}
          </div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 3.6, textTransform: 'uppercase', lineHeight: 1 }}>
            <span style={{ color: C.text }}>{c.brand}</span>
            {c.opponent ? (
              <>
                <span style={{ color: C.accent }}> vs </span>
                <span style={{ color: C.dim }}>{c.opponent}</span>
              </>
            ) : (
              <span style={{ color: C.accent }}> · {c.gameTag}</span>
            )}
          </div>
        </div>
        <div style={{ fontFamily: MONO, fontSize: u * 2, color: C.mute, textAlign: 'right' }}>{c.competition}</div>
      </div>
    </Frame>
  );
}

export const lineupTemplate: TemplateDef<LineupContent> = {
  id: 'lineup',
  label: 'Line-up / compo',
  group: 'match',
  source: 'match',
  hint: 'Compo de départ : l’effectif du jeu du match sélectionné.',
  fields: FIELDS,
  Visual: LineupVisual,
  fromData: (data, sel) => {
    const m: Match | undefined = data.matches.find((x) => x.id === sel.matchId) ?? data.matches[0];
    if (!m) return null;
    const g = data.games.find((x) => x.id === m.gameId);
    const d = new Date(m.dateISO);
    return {
      headline: 'LINE-UP',
      gameTag: g?.tag ?? '—',
      brand: brandName(),
      opponent: m.opponent.name,
      competition: m.competition,
      dateLabel: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' }),
      timeLabel: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      players: rosterOf(data, g),
    };
  },
  caption: (c) =>
    lines(
      `📋 LINE-UP — ${c.gameTag}`,
      ``,
      `${brandName()} 🆚 ${c.opponent}`,
      `🗓️ ${c.dateLabel} · ${c.timeLabel}`,
      ``,
      c.players.map((p) => `• ${p.name} — ${p.role}`).join('\n'),
      ``,
      hashtags(c.gameTag, ['lineup']),
    ),
};

const REVEAL_FIELDS: FieldDef<LineupContent>[] = [
  { key: 'headline', label: 'Titre', span: 2 },
  { key: 'gameTag', label: 'Sigle jeu' },
  { key: 'competition', label: 'Sous-titre', span: 2 },
];

export const rosterRevealTemplate: TemplateDef<LineupContent> = {
  id: 'roster-reveal',
  label: 'Reveal effectif',
  group: 'effectif',
  source: 'game',
  hint: 'Présente l’effectif complet d’un jeu (jusqu’à 6 joueurs).',
  fields: REVEAL_FIELDS,
  Visual: LineupVisual,
  fromData: (data, sel) => {
    const g = data.games.find((x) => x.id === sel.gameId) ?? data.games[0];
    if (!g) return null;
    return {
      headline: 'ROSTER',
      gameTag: g.tag,
      brand: brandName(),
      opponent: '',
      competition: g.name,
      dateLabel: '',
      timeLabel: '',
      players: rosterOf(data, g),
    };
  },
  caption: (c) =>
    lines(
      `🔴 VOICI VOTRE EFFECTIF ${c.gameTag} !`,
      ``,
      c.players.map((p) => `• ${p.name} — ${p.role}`).join('\n'),
      ``,
      hashtags(c.gameTag, ['roster', 'lineup']),
    ),
};
