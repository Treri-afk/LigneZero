import { BackdropWord, Bloom, BrandHeader, C, ChamferPanel, CornerTicks, DISPLAY, Frame, HazardBand, LogoBadge, MONO, TitleBlock, unit } from '../primitives';

const WIN = '#4fd08a';
import { hashtags, lines } from '../caption';
import { brandName } from '../brand';
import type { FieldDef, StudioData, TemplateDef } from '../types';
import { matchesOfWeek } from '../week';

interface ResultRow {
  gameTag: string;
  opponent: string;
  opponentLogo?: string;
  scoreUs: string;
  scoreThem: string;
  win: boolean;
  competition: string;
}

export interface ResultsRecapContent {
  headline: string;
  brand: string;
  weekLabel: string;
  wins: number;
  losses: number;
  rows: ResultRow[];
}

function weekLabelOf(weekStart?: string): string {
  if (!weekStart) return 'BILAN';
  const d = new Date(weekStart);
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  const fmt = (x: Date) => x.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  return `${fmt(d)} → ${fmt(end)}`;
}

const FIELDS: FieldDef<ResultsRecapContent>[] = [
  { key: 'headline', label: 'Titre', span: 2 },
  { key: 'weekLabel', label: 'Période (label)', span: 2 },
];

function ResultsRecapVisual({ content: c, w, h }: { content: ResultsRecapContent; w: number; h: number }) {
  const u = unit(w, h);
  const rows = c.rows.slice(0, 6);

  return (
    <Frame w={w} h={h}>
      <BackdropWord text="BILAN" u={u} x={-u * 1} y={h * 0.02} size={u * 30} color="rgba(255,255,255,0.045)" />
      <Bloom color={c.wins >= c.losses ? WIN : C.accent} x={w * 0.78} y={h * 0.2} size={w * 0.6} opacity={0.18} />
      <HazardBand u={u} w={w} h={h} top={0.22} />
      <BrandHeader u={u} brand={c.brand} />

      <div style={{ position: 'absolute', top: u * 14, left: u * 8, right: u * 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <TitleBlock u={u} kicker={c.weekLabel} title={c.headline} size={u * 11} />
        <div style={{ textAlign: 'right', border: `${u * 0.25}px solid ${C.line}`, padding: `${u * 1}px ${u * 2}px`, background: 'rgba(18,16,19,0.6)' }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 8, lineHeight: 1 }}>
            <span style={{ color: WIN }}>{c.wins}</span>
            <span style={{ color: C.mute, fontSize: u * 4 }}>V</span>
            <span style={{ color: C.mute, margin: `0 ${u * 0.6}px` }}>·</span>
            <span style={{ color: C.accent }}>{c.losses}</span>
            <span style={{ color: C.mute, fontSize: u * 4 }}>D</span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: u * 1.6, color: C.mute, letterSpacing: u * 0.3 }}>BILAN DE LA PÉRIODE</div>
        </div>
      </div>

      <div style={{ position: 'absolute', top: u * 32, bottom: u * 8, left: u * 8, right: u * 8, display: 'flex', flexDirection: 'column', gap: u * 2 }}>
        {rows.length === 0 && <div style={{ fontFamily: MONO, fontSize: u * 2.4, color: C.mute }}>Aucun résultat sur la période.</div>}
        {rows.map((r, i) => {
          const tone = r.win ? WIN : C.accent;
          return (
            <ChamferPanel
              key={i}
              u={u}
              accent={tone}
              style={{
                position: 'relative',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: u * 2.4,
                padding: `${u * 1.4}px ${u * 2.4}px`,
                background: `linear-gradient(90deg, color-mix(in srgb, ${tone} 14%, rgba(18,16,19,0.92)) 0%, rgba(18,16,19,0.92) 40%)`,
              }}
            >
              <CornerTicks u={u} size={1.8} inset={1} weight={0.25} color={C.line} />
              <span
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 700,
                  fontSize: u * 3.8,
                  width: u * 6,
                  textAlign: 'center',
                  color: C.ink,
                  background: tone,
                  padding: `${u * 0.4}px 0`,
                  boxShadow: `${u * 0.5}px ${u * 0.5}px 0 rgba(0,0,0,0.5)`,
                }}
              >
                {r.win ? 'V' : 'D'}
              </span>
              <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: u * 1.8, letterSpacing: u * 0.2, color: C.dim, whiteSpace: 'nowrap' }}>{r.gameTag}</span>
              <LogoBadge u={u} src={r.opponentLogo} name={r.opponent} size={5} />
              <div style={{ flex: 1, minWidth: 0, fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 3.4, textTransform: 'uppercase', color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span style={{ color: C.dim }}>vs </span>
                {r.opponent}
              </div>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 4.8, lineHeight: 1, whiteSpace: 'nowrap', textShadow: `${u * 0.25}px ${u * 0.3}px 0 rgba(0,0,0,0.5)` }}>
                <span style={{ color: r.win ? WIN : C.text }}>{r.scoreUs}</span>
                <span style={{ color: C.mute, margin: `0 ${u * 0.6}px` }}>–</span>
                <span style={{ color: r.win ? C.text : C.accent }}>{r.scoreThem}</span>
              </div>
            </ChamferPanel>
          );
        })}
      </div>
    </Frame>
  );
}

export const resultsRecapTemplate: TemplateDef<ResultsRecapContent> = {
  id: 'results-recap',
  label: 'Récap résultats',
  group: 'match',
  source: 'matchWeek',
  hint: 'Bilan auto des matchs terminés (avec score) de la période.',
  fields: FIELDS,
  Visual: ResultsRecapVisual,
  fromData: (data: StudioData, sel) => {
    const week = matchesOfWeek(data.matches, sel.weekStart).filter((m) => m.status === 'finished' && m.score);
    let wins = 0;
    let losses = 0;
    const rows: ResultRow[] = week.map((m) => {
      const g = data.games.find((x) => x.id === m.gameId);
      const win = (m.score?.us ?? 0) >= (m.score?.them ?? 0);
      if (win) wins++;
      else losses++;
      return {
        gameTag: g?.tag ?? '—',
        opponent: m.opponent.name,
        opponentLogo: m.opponent.logo,
        scoreUs: m.score?.us?.toString() ?? '',
        scoreThem: m.score?.them?.toString() ?? '',
        win,
        competition: m.competition,
      };
    });
    return { headline: 'RÉSULTATS', brand: brandName(), weekLabel: weekLabelOf(sel.weekStart), wins, losses, rows };
  },
  caption: (c) =>
    lines(
      `📊 RÉSULTATS — ${c.weekLabel}`,
      `Bilan : ${c.wins}V · ${c.losses}D`,
      ``,
      c.rows.map((r) => `${r.win ? '✅' : '🔴'} vs ${r.opponent} — ${r.scoreUs}–${r.scoreThem} [${r.gameTag}]`).join('\n'),
      ``,
      hashtags(undefined, ['recap', 'results']),
    ),
};
