import type { BotConfig } from '@lignezero/types';
import * as db from './db';
import { fillTokens } from './features';
import { live } from './state';

/** Messages périodiques : postés uniquement pendant le live. */
let handles: ReturnType<typeof setInterval>[] = [];

export async function startTimers(cfg: BotConfig, say: (msg: string) => void) {
  stopTimers();
  const timers = await db.listTimers();
  for (const t of timers) {
    const h = setInterval(async () => {
      if (!live.online) return;
      try {
        say(await fillTokens(t.message, cfg, ''));
      } catch (e) {
        console.error('[timers]', e);
      }
    }, Math.max(60, t.intervalSec) * 1000);
    handles.push(h);
  }
  if (timers.length) console.log(`[timers] ${timers.length} message(s) périodique(s) chargé(s)`);
}

export function stopTimers() {
  handles.forEach(clearInterval);
  handles = [];
}
