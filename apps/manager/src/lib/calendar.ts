import type { Game, Match, Session, SessionKind } from '@lignezero/types';

/**
 * Métadonnées d'affichage des types d'événement du calendrier (label + couleur).
 * Le code couleur est un affordance UI de l'outil interne (distinguer les types
 * d'un coup d'œil) — indépendant de la DA publique mono-accent.
 */
export type EventType = 'match' | SessionKind;

export interface KindMeta {
  label: string;
  color: string;
}

export const KIND_META: Record<EventType, KindMeta> = {
  match: { label: 'Match', color: '#f23127' },
  tournament: { label: 'Tournoi', color: '#f0a53a' },
  scrim: { label: 'Scrim', color: '#3aa0f0' },
  practice: { label: 'Entraînement', color: '#4fd08a' },
  review: { label: 'Review / VOD', color: '#a06cf0' },
  meeting: { label: 'Réunion', color: '#8c8375' },
  event: { label: 'Événement', color: '#2dd4ff' },
  tryout: { label: 'Pracc tryout', color: '#f23127' },
};

/** Types de session éditables (tout sauf 'match', qui a sa propre entité). */
export const SESSION_KINDS: { id: SessionKind; label: string }[] = (
  ['practice', 'scrim', 'review', 'tournament', 'meeting', 'event', 'tryout'] as SessionKind[]
).map((id) => ({ id, label: KIND_META[id].label }));

/** Événement normalisé pour la grille calendrier. */
export interface CalEvent {
  id: string;
  source: 'match' | 'session';
  type: EventType;
  title: string;
  sub?: string;
  start: Date;
  durationMin?: number;
  gameTag?: string;
  location?: string;
  raw: Match | Session;
}

// ── Helpers date ──────────────────────────────────────────────────────

export function mondayOf(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // 0 = lundi
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Libellé « 12 – 18 mai » pour la semaine commençant lundi `start`. */
export function weekLabel(start: Date): string {
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth();
  const d = (x: Date) => x.getDate();
  const m = (x: Date) => x.toLocaleDateString('fr-FR', { month: 'long' });
  const y = end.getFullYear();
  return sameMonth ? `${d(start)} – ${d(end)} ${m(end)} ${y}` : `${d(start)} ${m(start)} – ${d(end)} ${m(end)} ${y}`;
}

/** Construit la liste normalisée d'événements depuis matchs + sessions. */
export function buildEvents(matches: Match[], sessions: Session[], games: Game[]): CalEvent[] {
  const tag = (id?: string) => games.find((g) => g.id === id)?.tag;

  const fromMatches: CalEvent[] = matches.map((m) => ({
    id: `m_${m.id}`,
    source: 'match',
    type: 'match',
    title: `vs ${m.opponent.name}`,
    sub: m.competition,
    start: new Date(m.dateISO),
    gameTag: tag(m.gameId),
    raw: m,
  }));

  const fromSessions: CalEvent[] = sessions.map((s) => ({
    id: `s_${s.id}`,
    source: 'session',
    type: s.kind,
    title: s.title,
    sub: KIND_META[s.kind]?.label,
    start: new Date(s.startsAt),
    durationMin: s.durationMin,
    gameTag: tag(s.gameId),
    location: s.location,
    raw: s,
  }));

  return [...fromMatches, ...fromSessions].sort((a, b) => a.start.getTime() - b.start.getTime());
}
