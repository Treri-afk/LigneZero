import type { Game, Match, Player } from '@lignezero/types';
import {
  BackdropWord,
  Bloom,
  BrandHeader,
  C,
  ConeHeadline,
  DISPLAY,
  FoilChip,
  Frame,
  Glow,
  HazardBand,
  LogoBadge,
  MONO,
  Silhouette,
  shade,
  tint,
  unit,
} from '../primitives';
import { hashtags, hostOf, lines } from '../caption';
import { brandName } from '../brand';
import type { FieldDef, SocialStat, StudioData, TemplateDef } from '../types';

/** Carte joueur générée depuis un match (matchday / victoire / défaite). */
export interface MatchCardContent {
  kind: 'matchday' | 'result';
  /** En défaite l'extrusion de l'accroche passe en gris (pas rouge). */
  win: boolean;
  headline: string;
  gameTag: string;
  brand: string;
  opponent: string;
  competition: string;
  dateLabel: string;
  timeLabel: string;
  scoreUs: string;
  scoreThem: string;
  streamLabel: string;
  opponentLogo?: string;
  playerName: string;
  playerRole: string;
  playerPhoto?: string;
  playerColor: string;
  playerStats: SocialStat[];
}

function playerFields(p: Player | undefined) {
  return {
    playerName: p?.pseudo ?? 'JOUEUR',
    playerRole: p?.role ?? '',
    playerPhoto: p?.photo,
    playerColor: p?.color ?? C.accent,
    playerStats: (p?.stats ?? []).slice(0, 3).map((s) => ({ label: s.label, value: s.value })),
  };
}

function base(m: Match, g: Game | undefined, p: Player | undefined): Omit<MatchCardContent, 'kind' | 'win' | 'headline'> {
  const d = new Date(m.dateISO);
  return {
    gameTag: g?.tag ?? '—',
    brand: brandName(),
    opponent: m.opponent.name,
    competition: m.competition,
    dateLabel: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' }),
    timeLabel: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    scoreUs: m.score?.us?.toString() ?? '',
    scoreThem: m.score?.them?.toString() ?? '',
    streamLabel: hostOf(m.streamUrl ?? m.vodUrl),
    opponentLogo: m.opponent.logo,
    ...playerFields(p),
  };
}

function resolve(data: StudioData, matchId?: string, playerId?: string) {
  const m = data.matches.find((x) => x.id === matchId) ?? data.matches[0];
  if (!m) return null;
  const g = data.games.find((x) => x.id === m.gameId);
  const roster = data.players.filter((x) => x.gameId === m.gameId);
  const p = data.players.find((x) => x.id === playerId) ?? roster[0];
  return { m, g, p };
}

const FIELDS: FieldDef<MatchCardContent>[] = [
  { key: 'headline', label: 'Accroche (cône)', span: 2 },
  { key: 'gameTag', label: 'Sigle jeu' },
  { key: 'opponent', label: 'Adversaire' },
  { key: 'dateLabel', label: 'Date' },
  { key: 'timeLabel', label: 'Heure' },
  { key: 'scoreUs', label: 'Score nous' },
  { key: 'scoreThem', label: 'Score eux' },
  { key: 'playerColor', label: 'Couleur joueur', type: 'color' },
  { key: 'playerPhoto', label: 'Photo joueur', type: 'image' },
  { key: 'opponentLogo', label: 'Logo adversaire', type: 'image' },
  { key: 'competition', label: 'Compétition', span: 2 },
  { key: 'streamLabel', label: 'Stream (label)', span: 2 },
];

/** Visuel façon carte joueur full-art 3D — commun aux 3 variantes. */
function MatchCardVisual({ content: c, w, h }: { content: MatchCardContent; w: number; h: number }) {
  const u = unit(w, h);
  const col = c.playerColor || C.accent;
  const isResult = c.kind === 'result';
  const dark = shade(col, 52);
  const lite = tint(col, 72);
  const land = w / h >= 1.3;

  const cardH = land ? h * 0.84 : Math.min(h * 0.58, w * 0.66);
  const cardW = cardH * 0.72;
  const cardTop = (h - cardH) / 2 + (land ? 0 : h * 0.02);
  const cardLeft = land ? w - cardW - w * 0.05 : (w - cardW) / 2;
  const stats = (c.playerStats ?? []).slice(0, 3);

  return (
    <Frame w={w} h={h} bg={`radial-gradient(120% 90% at ${land ? '72%' : '50%'} 0%, ${C.base700} 0%, ${C.base900} 72%)`}>
      {/* Wordmark géant en fond : remplit le vide + donne l'échelle */}
      <BackdropWord
        text={c.gameTag}
        u={u}
        x={land ? -u * 2 : w * 0.02}
        y={land ? h * 0.18 : h * 0.3}
        size={u * (land ? 62 : 44)}
        color={`color-mix(in srgb, ${col} 12%, transparent)`}
      />
      <Bloom color={col} x={cardLeft + cardW / 2} y={cardTop + cardH * 0.42} size={cardW * 2.2} opacity={0.4} />
      <Glow color={col} x={cardLeft + cardW / 2} y={cardTop + cardH / 2} size={cardW * 1.5} opacity={0.22} />
      {/* Stries diagonales d'énergie derrière la carte */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          aria-hidden
          style={{
            position: 'absolute',
            left: land ? w * 0.42 : -w * 0.05,
            top: cardTop + cardH * (0.28 + i * 0.14),
            width: land ? w * 0.5 : w * 1.1,
            height: u * (i === 1 ? 0.5 : 0.22),
            transform: 'rotate(-6deg)',
            background: `linear-gradient(90deg, transparent, ${col} 60%, transparent)`,
            opacity: 0.35 - i * 0.08,
          }}
        />
      ))}
      <HazardBand u={u} w={w} h={h} color={col} />

      {/* ── CARTE JOUEUR (perspective + tilt 3D) ── */}
      <div style={{ position: 'absolute', left: cardLeft, top: cardTop, width: cardW, height: cardH, perspective: u * 150 }}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: u * 2.4,
            border: `${u * 0.3}px solid rgba(255,255,255,0.55)`,
            overflow: 'hidden',
            background: `radial-gradient(120% 80% at 50% 8%, ${lite} 0%, ${col} 42%, ${dark} 100%)`,
            transform: `rotateY(${land ? -11 : -8}deg) rotateX(4deg)`,
            transformOrigin: 'center',
            // Ombre dure décalée (BD) + halo coloré + rim-light interne
            boxShadow: [
              `${u * 2.8}px ${u * 3.4}px 0 -2px rgba(0,0,0,0.72)`,
              `0 ${u * 3}px ${u * 10}px -${u * 2}px ${col}`,
              `inset 0 ${u * 0.5}px ${u * 1.2}px rgba(255,255,255,0.4)`,
              `inset 0 -${u * 3}px ${u * 5}px -${u * 2}px rgba(0,0,0,0.55)`,
            ].join(','),
          }}
        >
          {/* rim-light haut (arête éclairée) */}
          <div aria-hidden style={{ position: 'absolute', top: 0, left: '6%', right: '6%', height: u * 0.35, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)' }} />
          {/* barcode / serial (coin haut gauche, détail cockpit) */}
          <div style={{ position: 'absolute', top: u * 2, left: u * 2, display: 'flex', flexDirection: 'column', gap: u * 0.6 }}>
            <div aria-hidden style={{ width: u * 10, height: u * 1.4, background: `repeating-linear-gradient(90deg, rgba(255,255,255,0.85) 0 ${u * 0.25}px, transparent ${u * 0.25}px ${u * 0.6}px)` }} />
            <span style={{ fontFamily: MONO, fontSize: u * 1.3, letterSpacing: u * 0.1, color: 'rgba(255,255,255,0.7)' }}>№ {c.gameTag}-{(c.playerName || 'X').slice(0, 3).toUpperCase()}</span>
          </div>
          {/* ticks d'angle de carte */}
          {(['tl', 'tr', 'bl', 'br'] as const).map((p) => (
            <div
              key={p}
              aria-hidden
              style={{
                position: 'absolute',
                width: u * 2.6,
                height: u * 2.6,
                top: p[0] === 't' ? u * 1.4 : undefined,
                bottom: p[0] === 'b' ? u * 1.4 : undefined,
                left: p[1] === 'l' ? u * 1.4 : undefined,
                right: p[1] === 'r' ? u * 1.4 : undefined,
                borderTop: p[0] === 't' ? `${u * 0.35}px solid rgba(255,255,255,0.85)` : undefined,
                borderBottom: p[0] === 'b' ? `${u * 0.35}px solid rgba(255,255,255,0.85)` : undefined,
                borderLeft: p[1] === 'l' ? `${u * 0.35}px solid rgba(255,255,255,0.85)` : undefined,
                borderRight: p[1] === 'r' ? `${u * 0.35}px solid rgba(255,255,255,0.85)` : undefined,
              }}
            />
          ))}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: u * 15,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              color: 'rgba(255,255,255,0.16)',
            }}
          >
            {c.playerName}
          </div>

          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div style={{ height: '94%', width: '90%' }}>
              {c.playerPhoto ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <img src={c.playerPhoto} style={{ height: '100%', width: '100%', objectFit: 'contain', objectPosition: 'bottom' }} />
              ) : (
                <Silhouette color="rgba(255,255,255,0.85)" />
              )}
            </div>
          </div>

          <div aria-hidden style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${dark} 3%, transparent 45%)` }} />
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(118deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.12) 42%, rgba(255,255,255,0.5) 47%, rgba(255,255,255,0.12) 52%, rgba(255,255,255,0) 64%)',
              mixBlendMode: 'screen',
            }}
          />
          <div style={{ position: 'absolute', left: u * 2, right: u * 2, bottom: u * 1.6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: MONO, fontSize: u * 1.8, letterSpacing: u * 0.15, color: 'rgba(255,255,255,0.8)' }}>
              {c.brand} · {c.gameTag}
            </span>
            <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 2.4, color: '#fff' }}>★★★★★</span>
          </div>
        </div>
      </div>

      {/* ── CHIPS DATA FOIL (stats joueur) ── */}
      {stats.length > 0 && (
        <div
          style={{
            position: 'absolute',
            left: land ? w * 0.06 : cardLeft + cardW - u * 3,
            top: land ? h * 0.46 : cardTop + cardH * 0.16,
            display: 'flex',
            flexDirection: 'column',
            gap: u * 1.8,
            perspective: u * 80,
          }}
        >
          {stats.map((s, i) => (
            <div key={s.label} style={{ transformOrigin: land ? 'left center' : 'right center', transform: `rotateY(${land ? 22 : -24}deg) rotate(${(i - 1) * 1.5}deg)` }}>
              <FoilChip u={u} color={col} value={s.value} label={s.label} />
            </div>
          ))}
        </div>
      )}

      {/* ── ACCROCHE 3D DOUBLE COULEUR EN CÔNE ── */}
      <div style={{ position: 'absolute', left: w * 0.05, top: land ? h * 0.14 : h * 0.07 }}>
        <ConeHeadline text={c.headline} u={u} depth={c.kind === 'result' && !c.win ? C.mute : C.accent} />
      </div>

      {/* Readout HUD confiné (remplit le vide centre-gauche, détail cockpit) */}
      {land && (
        <div style={{ position: 'absolute', left: w * 0.06, top: h * 0.3, width: w * 0.34 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: u * 1.4, fontFamily: MONO, fontSize: u * 1.7, letterSpacing: u * 0.16, color: C.dim, textTransform: 'uppercase' }}>
            <span style={{ width: u * 1.3, height: u * 1.3, background: C.accent, borderRadius: '50%' }} />
            <span style={{ color: C.accent }}>● REC</span>
            <span style={{ color: C.mute }}>//</span>
            <span>{isResult ? 'FINAL' : 'UPCOMING'}</span>
          </div>
          <div style={{ marginTop: u * 1, height: u * 0.2, background: `repeating-linear-gradient(90deg, ${C.line} 0 ${u * 0.9}px, transparent ${u * 0.9}px ${u * 2}px)` }} />
          <div style={{ marginTop: u * 1, fontFamily: MONO, fontSize: u * 1.8, color: C.text, letterSpacing: u * 0.1 }}>
            {c.dateLabel.toUpperCase()} · {c.timeLabel}
          </div>
        </div>
      )}

      {/* ── SCORE / KICKOFF (chip 3D) ── */}
      <div style={{ position: 'absolute', left: cardLeft - u * 5, top: cardTop - u * 3, perspective: u * 60 }}>
        <div style={{ transformOrigin: 'right center', transform: 'rotateY(-26deg) rotate(-3deg)' }}>
          {isResult ? (
            <div style={{ border: `${u * 0.3}px solid rgba(255,255,255,0.7)`, background: 'rgba(18,16,19,0.95)', padding: `${u * 1.2}px ${u * 2.4}px`, boxShadow: `${u * 0.8}px ${u * 0.8}px 0 ${C.base900}`, textAlign: 'center' }}>
              <div style={{ fontFamily: MONO, fontSize: u * 1.7, letterSpacing: u * 0.2, color: C.mute }}>SCORE</div>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 10, lineHeight: 1, color: C.text }}>
                {c.scoreUs}
                <span style={{ color: C.accent, margin: `0 ${u}px` }}>–</span>
                {c.scoreThem}
              </div>
            </div>
          ) : (
            <div style={{ border: `${u * 0.3}px solid rgba(255,255,255,0.7)`, background: 'rgba(18,16,19,0.95)', padding: `${u * 1.2}px ${u * 2.4}px`, boxShadow: `${u * 0.8}px ${u * 0.8}px 0 ${C.base900}` }}>
              <div style={{ fontFamily: MONO, fontSize: u * 1.7, letterSpacing: u * 0.2, color: C.mute }}>KICKOFF</div>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 4.6, lineHeight: 1, color: C.text }}>{c.timeLabel}</div>
              <div style={{ fontFamily: MONO, fontSize: u * 1.9, color: C.dim }}>{c.dateLabel}</div>
            </div>
          )}
        </div>
      </div>

      <BrandHeader u={u} brand={c.brand} tag={c.gameTag} />

      {/* nom joueur (bas-gauche) + rôle */}
      <div style={{ position: 'absolute', left: u * 7, bottom: u * 12, maxWidth: land ? '48%' : '60%' }}>
        <span
          style={{
            display: 'inline-block',
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: u * 2.6,
            textTransform: 'uppercase',
            letterSpacing: u * 0.2,
            background: col,
            color: '#0a0a0c',
            padding: `${u * 0.4}px ${u * 1.4}px`,
          }}
        >
          {c.playerRole}
        </span>
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: u * 10,
            lineHeight: 0.88,
            textTransform: 'uppercase',
            color: C.text,
            textShadow: `${u * 0.4}px ${u * 0.55}px 0 ${col}`,
            marginTop: u * 1,
          }}
        >
          {c.playerName}
        </div>
      </div>

      {/* footer : matchup + compétition + stream */}
      <div style={{ position: 'absolute', left: u * 7, right: u * 7, bottom: u * 4.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: u * 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: u * 1.6 }}>
          {c.opponentLogo && <LogoBadge u={u} src={c.opponentLogo} name={c.opponent} size={6} />}
          <div>
            <div style={{ fontFamily: MONO, fontSize: u * 2.4, letterSpacing: u * 0.12 }}>
              <span style={{ color: C.text }}>{c.brand}</span>
              <span style={{ color: C.mute }}> vs </span>
              <span style={{ color: C.dim }}>{c.opponent}</span>
            </div>
            <div style={{ fontFamily: MONO, fontSize: u * 2, color: C.mute, marginTop: u * 0.4 }}>{c.competition}</div>
          </div>
        </div>
        {c.streamLabel && (
          <div style={{ fontFamily: MONO, fontSize: u * 2.2, color: C.accent, border: `${Math.max(1, u * 0.25)}px solid ${C.accent}`, padding: `${u * 0.7}px ${u * 1.5}px`, whiteSpace: 'nowrap' }}>
            ▶ {c.streamLabel}
          </div>
        )}
      </div>
    </Frame>
  );
}

// ── Les 3 templates partagent le visuel, diffèrent par contenu + légende ──

export const matchdayTemplate: TemplateDef<MatchCardContent> = {
  id: 'matchday',
  label: 'Match du jour',
  group: 'match',
  source: 'match',
  secondary: ['player'],
  hint: 'Annonce d’un match à venir. Choisis le match + le joueur mis en avant.',
  fields: FIELDS,
  Visual: MatchCardVisual,
  fromData: (data, sel) => {
    const r = resolve(data, sel.matchId, sel.playerId);
    if (!r) return null;
    return { kind: 'matchday', win: false, headline: 'MATCHDAY', ...base(r.m, r.g, r.p) };
  },
  caption: (c) =>
    lines(
      `🔴 MATCH DU JOUR — ${c.gameTag}`,
      ``,
      `${brandName()} 🆚 ${c.opponent}`,
      `🏆 ${c.competition}`,
      `🗓️ ${c.dateLabel} · ${c.timeLabel}`,
      c.streamLabel && `📺 ${c.streamLabel}`,
      ``,
      hashtags(c.gameTag),
    ),
};

export const victoireTemplate: TemplateDef<MatchCardContent> = {
  id: 'victoire',
  label: 'Victoire',
  group: 'match',
  source: 'match',
  secondary: ['player'],
  hint: 'Résultat gagnant. Le score est repris depuis le match.',
  fields: FIELDS,
  Visual: MatchCardVisual,
  fromData: (data, sel) => {
    const r = resolve(data, sel.matchId, sel.playerId);
    if (!r) return null;
    return { kind: 'result', win: true, headline: 'GGWP', ...base(r.m, r.g, r.p) };
  },
  caption: (c) =>
    lines(
      `✅ VICTOIRE ${c.scoreUs}–${c.scoreThem} !`,
      ``,
      `${brandName()} s'impose face à ${c.opponent}.`,
      `🏆 ${c.competition}`,
      ``,
      `${hashtags(c.gameTag)} #Victory`,
    ),
};

export const defaiteTemplate: TemplateDef<MatchCardContent> = {
  id: 'defaite',
  label: 'Défaite',
  group: 'match',
  source: 'match',
  secondary: ['player'],
  hint: 'Résultat perdant. Ton « on revient plus fort ».',
  fields: FIELDS,
  Visual: MatchCardVisual,
  fromData: (data, sel) => {
    const r = resolve(data, sel.matchId, sel.playerId);
    if (!r) return null;
    return { kind: 'result', win: false, headline: 'GG', ...base(r.m, r.g, r.p) };
  },
  caption: (c) =>
    lines(
      `Défaite ${c.scoreUs}–${c.scoreThem} contre ${c.opponent}.`,
      ``,
      `On encaisse, on analyse, on revient plus fort. 🔴`,
      `🏆 ${c.competition}`,
      ``,
      hashtags(c.gameTag),
    ),
};

export const mvpTemplate: TemplateDef<MatchCardContent> = {
  id: 'mvp',
  label: 'MVP / joueur du match',
  group: 'joueur',
  source: 'match',
  secondary: ['player'],
  hint: 'Met en avant le joueur du match (ses stats sur la carte).',
  fields: FIELDS,
  Visual: MatchCardVisual,
  fromData: (data, sel) => {
    const r = resolve(data, sel.matchId, sel.playerId);
    if (!r) return null;
    return { kind: 'result', win: true, headline: 'MVP', ...base(r.m, r.g, r.p) };
  },
  caption: (c) =>
    lines(
      `🏅 MVP — ${c.playerName}`,
      ``,
      `Performance XXL de ${c.playerName} (${c.playerRole}) face à ${c.opponent}.`,
      `🏆 ${c.competition}`,
      ``,
      hashtags(c.gameTag, ['mvp']),
    ),
};
