import type { BotConfig, BotFeatureKey } from '@lignezero/types';
import { env } from './env';
import { live } from './state';
import * as db from './db';

/** Valeurs par défaut si le staff n'a pas explicitement (dés)activé la feature. */
const DEFAULTS: Record<BotFeatureKey, boolean> = {
  tickets: true,
  clips: true,
  customCommands: true,
  points: true,
  minigames: true,
  ranks: true,
  watchtime: true,
  shop: true,
  alerts: true,
  predictions: true,
  shoutout: true,
  raffle: true,
  poll: true,
  timers: true,
  quotes: true,
  fun: true,
  matchInfo: true,
  roster: true,
  uptime: true,
  automod: false, // intrusif → off par défaut
  greetings: false, // peut spammer → off par défaut
};

export function isEnabled(cfg: BotConfig, key: BotFeatureKey): boolean {
  return cfg.features[key] ?? DEFAULTS[key];
}

/** Paliers de fidélité selon les points cumulés. */
export const RANKS = [
  { name: 'Bronze', min: 0 },
  { name: 'Argent', min: 500 },
  { name: 'Or', min: 2000 },
  { name: 'Platine', min: 5000 },
  { name: 'Diamant', min: 12000 },
  { name: 'Radiant', min: 30000 },
];
export function rankFor(points: number): { name: string; min: number; next?: { name: string; min: number } } {
  let cur = RANKS[0];
  for (const r of RANKS) if (points >= r.min) cur = r;
  const next = RANKS.find((r) => r.min > cur.min);
  return { ...cur, next };
}

export function uptimeLabel(): string {
  if (!live.online || !live.startedAt) return 'le live n’est pas en cours';
  const ms = Date.now() - live.startedAt.getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`;
}

/** Remplace les tokens d'un template de réponse. */
export async function fillTokens(tpl: string, cfg: BotConfig, user: string): Promise<string> {
  let out = tpl;
  if (out.includes('{nextmatch}')) out = out.split('{nextmatch}').join(await db.nextMatchLabel());
  if (out.includes('{score}')) out = out.split('{score}').join(await db.currentScoreLabel());
  if (out.includes('{roster}')) out = out.split('{roster}').join(await db.rosterLabel());
  if (out.includes('{uptime}')) out = out.split('{uptime}').join(uptimeLabel());
  return out
    .split('{user}').join(user)
    .split('{discord}').join(cfg.discordInvite ?? env.discordInvite ?? '(lien Discord non configuré)')
    .split('{match}').join(live.match?.opponent ?? '—')
    .split('{competition}').join(live.match?.competition ?? '—');
}
