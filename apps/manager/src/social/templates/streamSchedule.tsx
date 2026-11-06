import { BackdropWord, Bloom, BrandHeader, C, ChamferPanel, CornerTicks, DISPLAY, DotGrid, Frame, HazardBand, MONO, unit } from '../primitives';
import { hashtags, lines } from '../caption';
import { brandName } from '../brand';
import type { FieldDef, TemplateDef } from '../types';

/**
 * Grille des streams de la semaine. Complète le planning de MATCHS existant :
 * celui-ci porte les horaires de diffusion, pas les rencontres officielles.
 *
 * Une ligne par jour, saisie au format « HH:MM — Libellé ». Une ligne vide (ou
 * « OFF ») marque un jour sans stream : c'est une information utile, on
 * l'affiche en repos plutôt que de masquer le jour.
 */
export interface StreamScheduleContent {
  brand: string;
  title: string;
  weekLabel: string;
  channel: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sun: string;
}

const FIELDS: FieldDef<StreamScheduleContent>[] = [
  { key: 'title', label: 'Titre', placeholder: 'PLANNING STREAM' },
  { key: 'weekLabel', label: 'Semaine', placeholder: 'SEM. 32' },
  { key: 'channel', label: 'Chaîne affichée', span: 2, placeholder: 'twitch.tv/…' },
  { key: 'mon', label: 'Lundi', placeholder: '21:00 — Ranked' },
  { key: 'tue', label: 'Mardi' },
  { key: 'wed', label: 'Mercredi' },
  { key: 'thu', label: 'Jeudi' },
  { key: 'fri', label: 'Vendredi' },
  { key: 'sat', label: 'Samedi' },
  { key: 'sun', label: 'Dimanche' },
];

const DAYS: { key: keyof StreamScheduleContent; label: string }[] = [
  { key: 'mon', label: 'LUN' },
  { key: 'tue', label: 'MAR' },
  { key: 'wed', label: 'MER' },
  { key: 'thu', label: 'JEU' },
  { key: 'fri', label: 'VEN' },
  { key: 'sat', label: 'SAM' },
  { key: 'sun', label: 'DIM' },
];

function StreamScheduleVisual({ content: c, w, h }: { content: StreamScheduleContent; w: number; h: number }) {
  const u = unit(w, h);
  const portrait = h > w * 1.2;
  const rowH = portrait ? u * 8.4 : u * 7.2;

  return (
    <Frame w={w} h={h}>
      <DotGrid u={u} opacity={0.22} />
      <Bloom color={C.accent} x={w * 0.85} y={h * 0.1} size={w * 0.8} opacity={0.13} />
      <BackdropWord text="LIVE" u={u} x={w * 0.03} y={h * 0.86} size={u * 30} color="rgba(242,49,39,0.08)" />
      <HazardBand u={u} w={w} h={h} top={0.94} />
      <BrandHeader u={u} brand={c.brand} tag={c.weekLabel} />
      <CornerTicks u={u} />

      {/* titre */}
      <div style={{ position: 'absolute', left: u * 8, right: u * 8, top: h * (portrait ? 0.14 : 0.2) }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 7.5, lineHeight: 0.95, textTransform: 'uppercase', color: C.text, textShadow: `${u * 0.35}px ${u * 0.45}px 0 ${C.accent}` }}>
          {c.title}
        </div>
        <div style={{ marginTop: u * 1.2, height: u * 0.4, background: C.accent, width: u * 16 }} />
      </div>

      {/* grille des jours */}
      <div
        style={{
          position: 'absolute',
          left: u * 8,
          right: u * 8,
          top: h * (portrait ? 0.28 : 0.38),
          display: 'flex',
          flexDirection: 'column',
          gap: u * 1.1,
        }}
      >
        {DAYS.map(({ key, label }) => {
          const raw = String(c[key] ?? '').trim();
          const off = raw === '' || raw.toUpperCase() === 'OFF';
          // « 21:00 — Ranked » → heure à gauche, libellé à droite
          const m = raw.match(/^\s*(\d{1,2}\s*[:hH]\s*\d{0,2})\s*[—\-–]?\s*(.*)$/);
          const time = off ? 'OFF' : (m?.[1] ?? '').replace(/\s/g, '') || '—';
          const label2 = off ? 'Pas de stream' : (m?.[2] || raw);

          return (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: u * 2,
                height: rowH,
                paddingLeft: u * 2,
                paddingRight: u * 2,
                background: off ? 'rgba(18,16,19,0.55)' : 'rgba(18,16,19,0.92)',
                borderLeft: `${u * 0.8}px solid ${off ? C.mute : C.accent}`,
                opacity: off ? 0.55 : 1,
              }}
            >
              <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 3.6, letterSpacing: u * 0.2, color: off ? C.mute : C.text, width: u * 9 }}>
                {label}
              </span>
              <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: u * 3.2, color: off ? C.mute : C.accent, width: u * 13 }}>
                {time}
              </span>
              <span style={{ fontFamily: MONO, fontSize: u * 2.6, color: off ? C.mute : C.dim, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {label2}
              </span>
            </div>
          );
        })}
      </div>

      {/* chaîne */}
      {c.channel && (
        <div style={{ position: 'absolute', left: u * 8, right: u * 8, bottom: u * 10 }}>
          <ChamferPanel u={u} accent={C.accent} style={{ padding: `${u * 2}px ${u * 3}px` }}>
            <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: u * 2.8, letterSpacing: u * 0.25, color: C.text }}>
              ▶ {c.channel}
            </span>
          </ChamferPanel>
        </div>
      )}
    </Frame>
  );
}

export const streamScheduleTemplate: TemplateDef<StreamScheduleContent> = {
  id: 'stream-schedule',
  label: 'Planning stream',
  group: 'commu',
  source: 'none',
  hint: 'Horaires de diffusion de la semaine. Laisse un jour vide (ou « OFF ») pour un jour sans stream.',
  formats: ['story', 'square'],
  fields: FIELDS,
  Visual: StreamScheduleVisual,
  fromData: (data) => ({
    brand: brandName(),
    title: 'Planning stream',
    weekLabel: weekLabel(),
    // Handle réglé dans la page Identité → l'URL de chaîne se remplit seule.
    channel: data.brand.handle ? `twitch.tv/${data.brand.handle}` : 'twitch.tv/…',
    mon: '21:00 — Ranked',
    tue: 'OFF',
    wed: '21:00 — Scrims',
    thu: '21:00 — Ranked',
    fri: '21:00 — Chill & chat',
    sat: '18:00 — Tournoi',
    sun: 'OFF',
  }),
  caption: (c) =>
    lines(
      `📅 ${c.title} — ${c.weekLabel}`,
      ``,
      ...DAYS.map(({ key, label }) => {
        const raw = String(c[key] ?? '').trim();
        return `${label} · ${raw === '' || raw.toUpperCase() === 'OFF' ? 'off' : raw}`;
      }),
      ``,
      c.channel ? `▶ ${c.channel}` : '',
      hashtags(undefined, ['stream', 'twitch']),
    ),
};

/** Numéro de semaine ISO courant, pour un libellé par défaut utile. */
function weekLabel(): string {
  const d = new Date();
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (target.getUTCDay() + 6) % 7; // lundi = 0
  target.setUTCDate(target.getUTCDate() - dayNum + 3); // jeudi de la semaine
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 86400000));
  return `SEM. ${week}`;
}
