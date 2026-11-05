import type { CurrentMatch } from './db';

/** État volatil du live (réinitialisé à chaque online/offline). */
interface LiveState {
  online: boolean;
  startedAt: Date | null;
  match: CurrentMatch | null;
}
export const live: LiveState = { online: false, startedAt: null, match: null };

/** Tirage au sort en cours (in-memory). */
export interface Raffle { open: boolean; keyword: string; entrants: Set<string> }
export const raffle: Raffle = { open: false, keyword: '!join', entrants: new Set() };

/** Sondage en cours (in-memory). */
export interface Poll { open: boolean; question: string; options: string[]; votes: Map<string, number> }
export const poll: Poll = { open: false, question: '', options: [], votes: new Map() };

/** Viewers déjà salués dans la session courante (feature greetings). */
export const greeted = new Set<string>();

/** Dernier message par viewer (login → timestamp) pour le watchtime. */
export const chatters = new Map<string, number>();

/** Duels en attente d'acceptation : cible → défi. */
export interface Duel { from: string; fromDisplay: string; amount: number; at: number }
export const duels = new Map<string, Duel>();

export function resetLiveState() {
  live.online = false;
  live.startedAt = null;
  live.match = null;
  raffle.open = false;
  raffle.entrants.clear();
  poll.open = false;
  poll.votes.clear();
  greeted.clear();
  chatters.clear();
  duels.clear();
}

/** Anti-spam générique par clé (retourne true si encore en cooldown). */
const lastUse = new Map<string, number>();
export function onCooldown(key: string, seconds: number): boolean {
  const now = Date.now();
  const prev = lastUse.get(key) ?? 0;
  if (now - prev < seconds * 1000) return true;
  lastUse.set(key, now);
  return false;
}
