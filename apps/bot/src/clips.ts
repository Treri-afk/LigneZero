import type { BotConfig } from '@lignezero/types';
import { api } from './twitch';
import * as db from './db';

/**
 * Scrute les nouveaux clips de la chaîne pendant le live et crée une cartouche
 * d'inventaire pour le clippeur (si son compte Twitch est lié). Twitch n'a pas
 * d'event "clip créé" fiable → polling de l'API Helix.
 */
let timer: ReturnType<typeof setInterval> | null = null;
let since = new Date();

export function startClipPolling(broadcasterId: string, cfg: BotConfig, intervalSec: number) {
  stopClipPolling();
  since = new Date();
  timer = setInterval(() => {
    pollOnce(broadcasterId, cfg).catch((e) => console.error('[clips] erreur', e));
  }, Math.max(20, intervalSec) * 1000);
  console.log(`[clips] polling actif (${intervalSec}s)`);
}

export function stopClipPolling() {
  if (timer) clearInterval(timer);
  timer = null;
}

async function pollOnce(broadcasterId: string, cfg: BotConfig) {
  const now = new Date();
  const res = await api.clips.getClipsForBroadcaster(broadcasterId, {
    startDate: since.toISOString(),
    endDate: now.toISOString(),
    limit: 50,
  });
  since = now;
  for (const clip of res.data) {
    // HelixClip n'expose que l'id du clippeur → on résout son login.
    const creator = clip.creatorId ? await api.users.getUserById(clip.creatorId).catch(() => null) : null;
    const login = creator?.name ?? clip.creatorDisplayName;
    if (!login) continue;
    const ownerId = await db.resolveOwnerByTwitch(login);
    if (!ownerId) {
      await db.logEvent({ kind: 'clip_unlinked', twitchUser: login, detail: { url: clip.url, title: clip.title } });
      continue;
    }
    const r = await db.grantCartridge(ownerId, {
      name: cfg.cartridgeName,
      title: clip.title,
      url: clip.url,
      thumb: clip.thumbnailUrl,
    });
    await db.logEvent({ kind: r === 'granted' ? 'clip_cartridge' : 'clip_already', twitchUser: login, ownerId, detail: { url: clip.url } });
    console.log(`[clips] ${r} cartouche pour ${login}`);
  }
}
