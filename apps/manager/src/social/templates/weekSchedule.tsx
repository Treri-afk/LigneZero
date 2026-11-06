import { BackdropWord, Bloom, BrandHeader, C, ChamferPanel, CornerTicks, DISPLAY, Frame, HazardBand, LogoBadge, MONO, TitleBlock, unit } from '../primitives';
import { hashtags, lines } from '../caption';
import { brandName } from '../brand';
import type { FieldDef, StudioData, TemplateDef } from '../types';
import { matchesOfWeek } from '../week';

interface ScheduleRow {
  gameTag: string;
  opponent: string;
  opponentLogo?: string;
  dayLabel: string;
  timeLabel: string;
  competition: string;
}

export interface WeekScheduleContent {
  headline: string;
  brand: string;
  weekLabel: string;
  rows: ScheduleRow[];
}

function weekLabelOf(weekStart?: string): string {
  if (!weekStart) return 'CETTE SEMAINE';
  const d = new Date(weekStart);
  const end = new Date(d);
  end.setDate(d.getDate() + 6);
  const fmt = (x: Date) => x.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  return `${fmt(d)} → ${fmt(end)}`;
}

const FIELDS: FieldDef<WeekScheduleContent>[] = [
  { key: 'headline', label: 'Titre', span: 2 },
  { key: 'weekLabel', label: 'Semaine (label)', span: 2 },
];

function WeekScheduleVisual({ content: c, w, h }: { content: WeekScheduleContent; w: number; h: number }) {
  const u = unit(w, h);
  const rows = c.rows.slice(0, 6);

  return (
    <Frame w={w} h={h}>
      <BackdropWord text="AGENDA" u={u} x={-u * 1} y={h * 0.02} size={u * 30} color="rgba(255,255,255,0.045)" />
      <Bloom color={C.accent} x={w * 0.5} y={h * 0.48} size={w * 0.9} opacity={0.15} />
      <HazardBand u={u} w={w} h={h} top={0.22} />
      <BrandHeader u={u} brand={c.brand} />

      <div style={{ position: 'absolute', top: u * 14, left: u * 8, right: u * 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <TitleBlock u={u} kicker={c.weekLabel} title={c.headline} size={u * 11} />
        <div style={{ textAlign: 'right', fontFamily: DISPLAY, fontWeight: 700, lineHeight: 0.9 }}>
          <div style={{ fontSize: u * 8, color: C.accent }}>{rows.length}</div>
          <div style={{ fontFamily: MONO, fontSize: u * 1.6, letterSpacing: u * 0.2, color: C.mute }}>MATCHS</div>
        </div>
      </div>

      <div style={{ position: 'absolute', top: u * 32, bottom: u * 8, left: u * 8, right: u * 8, display: 'flex', flexDirection: 'column', gap: u * 2 }}>
        {rows.length === 0 && (
          <div style={{ fontFamily: MONO, fontSize: u * 2.4, color: C.mute }}>Aucun match cette semaine.</div>
        )}
        {rows.map((r, i) => (
          <ChamferPanel key={i} u={u} accent={C.accent} style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', gap: u * 2.4, padding: `${u * 1.4}px ${u * 2.4}px` }}>
            <CornerTicks u={u} size={1.8} inset={1} weight={0.25} color={C.line} />
            <div style={{ minWidth: u * 22, borderRight: `${u * 0.2}px solid ${C.line}`, paddingRight: u * 2 }}>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 4.6, lineHeight: 1, color: C.text }}>{r.timeLabel}</div>
              <div style={{ fontFamily: MONO, fontSize: u * 1.8, color: C.accent, textTransform: 'uppercase', letterSpacing: u * 0.1 }}>{r.dayLabel}</div>
            </div>
            <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: u * 2, letterSpacing: u * 0.2, background: C.accent, color: C.ink, padding: `${u * 0.5}px ${u * 1.2}px`, whiteSpace: 'nowrap' }}>
              {r.gameTag}
            </span>
            <LogoBadge u={u} src={r.opponentLogo} name={r.opponent} size={5} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 3.4, lineHeight: 1, textTransform: 'uppercase', color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span style={{ color: C.dim }}>vs </span>
                {r.opponent}
              </div>
              <div style={{ fontFamily: MONO, fontSize: u * 1.8, color: C.mute }}>{r.competition}</div>
            </div>
            <span style={{ fontFamily: MONO, fontSize: u * 2.2, color: C.mute }}>›</span>
          </ChamferPanel>
        ))}
      </div>
    </Frame>
  );
}

export const weekScheduleTemplate: TemplateDef<WeekScheduleContent> = {
  id: 'week-schedule',
  label: 'Programme de la semaine',
  group: 'match',
  source: 'matchWeek',
  hint: 'Agenda auto des matchs de la semaine choisie (jusqu’à 6).',
  fields: FIELDS,
  Visual: WeekScheduleVisual,
  fromData: (data: StudioData, sel) => {
    const week = matchesOfWeek(data.matches, sel.weekStart);
    return {
      headline: 'PROGRAMME',
      brand: brandName(),
      weekLabel: weekLabelOf(sel.weekStart),
      rows: week.map((m) => {
        const g = data.games.find((x) => x.id === m.gameId);
        const d = new Date(m.dateISO);
        return {
          gameTag: g?.tag ?? '—',
          opponent: m.opponent.name,
          opponentLogo: m.opponent.logo,
          dayLabel: d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' }),
          timeLabel: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          competition: m.competition,
        };
      }),
    };
  },
  caption: (c) =>
    lines(
      `📅 PROGRAMME — ${c.weekLabel}`,
      ``,
      c.rows.map((r) => `${r.dayLabel} ${r.timeLabel} · [${r.gameTag}] vs ${r.opponent}`).join('\n'),
      ``,
      hashtags(undefined, ['planning', 'matchweek']),
    ),
};
