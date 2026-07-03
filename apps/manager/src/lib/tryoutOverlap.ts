import type { Availability, CandidateAvailability } from '@lignezero/types';

/** Créneau où au moins `minCount` personnes (joueurs + candidats confondus) sont dispo. */
export interface OverlapWindow {
  day: string;
  startTime: string;
  endTime: string;
  playerIds: string[];
  candidateIds: string[];
}

interface Slot {
  id: string;
  kind: 'player' | 'candidate';
  start: number;
  end: number;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}
function fromMinutes(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}
function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const s = new Set(a);
  return b.every((x) => s.has(x));
}

/**
 * Détecte les fenêtres où au moins `minCount` personnes (pool joueurs de
 * l'effectif ∪ pool candidats en tryout) sont disponibles en même temps, par
 * balayage des points de rupture (début/fin de créneau) jour par jour.
 */
export function findOverlapWindows(
  playerAvailability: Availability[],
  candidateAvailability: CandidateAvailability[],
  minCount = 5,
): OverlapWindow[] {
  const byDay = new Map<string, Slot[]>();
  const push = (day: string, slot: Slot) => {
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(slot);
  };

  for (const a of playerAvailability) {
    if (a.status !== 'available' || !a.startTime || !a.endTime) continue;
    push(a.day, { id: a.playerId, kind: 'player', start: toMinutes(a.startTime), end: toMinutes(a.endTime) });
  }
  for (const c of candidateAvailability) {
    push(c.day, { id: c.candidateId, kind: 'candidate', start: toMinutes(c.startTime), end: toMinutes(c.endTime) });
  }

  const windows: OverlapWindow[] = [];
  for (const [day, slots] of byDay) {
    const points = Array.from(new Set(slots.flatMap((s) => [s.start, s.end]))).sort((a, b) => a - b);
    for (let i = 0; i < points.length - 1; i++) {
      const from = points[i];
      const to = points[i + 1];
      const mid = (from + to) / 2;
      const active = slots.filter((s) => s.start <= mid && s.end > mid);
      const playerIds = [...new Set(active.filter((s) => s.kind === 'player').map((s) => s.id))];
      const candidateIds = [...new Set(active.filter((s) => s.kind === 'candidate').map((s) => s.id))];
      if (playerIds.length + candidateIds.length >= minCount) {
        windows.push({ day, startTime: fromMinutes(from), endTime: fromMinutes(to), playerIds, candidateIds });
      }
    }
  }

  windows.sort((a, b) => a.day.localeCompare(b.day) || a.startTime.localeCompare(b.startTime));

  // Fusionne les intervalles adjacents partageant exactement le même groupe.
  const merged: OverlapWindow[] = [];
  for (const w of windows) {
    const last = merged[merged.length - 1];
    if (last && last.day === w.day && last.endTime === w.startTime && sameSet(last.playerIds, w.playerIds) && sameSet(last.candidateIds, w.candidateIds)) {
      last.endTime = w.endTime;
    } else {
      merged.push({ ...w });
    }
  }
  return merged;
}
