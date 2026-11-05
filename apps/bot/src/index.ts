import { ChatClient } from '@twurple/chat';
import { EventSubWsListener } from '@twurple/eventsub-ws';
import type { BotCommand, BotConfig } from '@lignezero/types';
import { env } from './env';
import { api, authProvider, initAuth, initBroadcasterAuth } from './twitch';
import * as db from './db';
import { live, greeted, chatters, onCooldown, resetLiveState } from './state';
import { isEnabled } from './features';
import { inspect } from './automod';
import { handleCommand, type CmdCtx } from './commands';
import { startClipPolling, stopClipPolling } from './clips';
import { startTimers, stopTimers } from './timers';
import { setupAlerts } from './alerts';
import { startDiscord, announceLive, grantSubRole, discordEnabled, setDiscordConfig, syncDiscordData } from './discord';

async function main() {
  console.log('[bot] démarrage…');
  await initAuth();
  const broadcasterAuthed = await initBroadcasterAuth();

  let cfg = await db.getConfig();
  if (!cfg) throw new Error('[bot] bot_config introuvable — applique les migrations Supabase.');
  setDiscordConfig(cfg);
  await syncDiscordData();
  await startDiscord();

  const channel = (env.twitchChannel ?? cfg.twitchChannel ?? '').replace(/^#/, '').toLowerCase();
  if (!channel) throw new Error('[bot] Aucune chaîne : renseigne TWITCH_CHANNEL ou bot_config.twitch_channel.');

  const broadcaster = await api.users.getUserByName(channel);
  if (!broadcaster) throw new Error(`[bot] Chaîne Twitch introuvable : ${channel}`);
  const botLogin = env.twitchBotUsername.toLowerCase();

  // ── Chat ──
  const chat = new ChatClient({ authProvider, channels: [channel], isAlwaysMod: true });
  const say = (msg: string) => { if (msg) chat.say(channel, msg).catch((e) => console.error('[say]', e)); };
  await chat.connect();
  console.log(`[bot] connecté au chat #${channel}`);

  // ── Commandes personnalisées (rechargées à la volée) ──
  let commandMap = new Map<string, BotCommand>();
  const reloadCommands = async () => {
    commandMap = new Map((await db.listCommands()).map((c) => [c.trigger.toLowerCase(), c]));
  };
  await reloadCommands();

  // ── Passage en live / hors-ligne ──
  const goOnline = async (c: BotConfig) => {
    live.online = true;
    live.startedAt = new Date();
    live.match = await db.findCurrentMatch();
    console.log('[live] ONLINE →', live.match?.opponent ?? '(aucun match rapproché)');
    if (live.match && c.autoSetLive) await db.setMatchLive(live.match.id);
    if (isEnabled(c, 'clips')) startClipPolling(broadcaster.id, c, env.clipPollSec);
    if (isEnabled(c, 'timers')) await startTimers(c, say);
    if (discordEnabled()) await announceLive({ opponent: live.match?.opponent, competition: live.match?.competition, url: `https://twitch.tv/${channel}` });
    await db.logEvent({ kind: 'stream_online', matchId: live.match?.id ?? null, detail: { channel } });
  };
  const goOffline = async () => {
    console.log('[live] OFFLINE');
    stopClipPolling();
    stopTimers();
    resetLiveState();
    await db.logEvent({ kind: 'stream_offline', detail: { channel } });
  };

  // ── EventSub (WebSocket) : détection automatique du live ──
  const listener = new EventSubWsListener({ apiClient: api });
  listener.start();
  listener.onStreamOnline(broadcaster.id, () => goOnline(cfg!).catch((e) => console.error('[online]', e)));
  listener.onStreamOffline(broadcaster.id, () => goOffline().catch((e) => console.error('[offline]', e)));
  console.log('[bot] EventSub actif (stream.online / stream.offline)');

  // Alertes (sub/follow/raid/cheer) — nécessite le token broadcaster.
  if (broadcasterAuthed) {
    setupAlerts({ listener, broadcasterId: broadcaster.id, isOn: () => isEnabled(cfg!, 'alerts'), say, onSubscriber: (login) => { if (discordEnabled()) grantSubRole(login).catch((e) => console.error('[subrole]', e)); } });
  } else {
    console.log('[bot] alertes sub/cheer/follow désactivées (TWITCH_BROADCASTER_* non fourni)');
  }

  // Déjà en live au démarrage ?
  const current = await api.streams.getStreamByUserId(broadcaster.id);
  if (current) await goOnline(cfg);

  // ── Watchtime : crédite 5 min aux chatteurs actifs pendant le live ──
  setInterval(async () => {
    if (!live.online || !isEnabled(cfg!, 'watchtime')) return;
    const cutoff = Date.now() - 6 * 60 * 1000;
    for (const [login, ts] of chatters) {
      if (ts >= cutoff) await db.addWatchtime(login, 5).catch((e) => console.error('[watchtime]', e));
    }
  }, 5 * 60 * 1000);

  // ── Rafraîchit config + commandes toutes les 2 min (toggles du manager) ──
  setInterval(async () => {
    try {
      const fresh = await db.getConfig();
      if (fresh) { cfg = fresh; setDiscordConfig(fresh); }
      await reloadCommands();
      await syncDiscordData();
    } catch (e) {
      console.error('[refresh]', e);
    }
  }, 120_000);

  // ── Messages ──
  chat.onMessage(async (_ch, user, text, msg) => {
    if (user.toLowerCase() === botLogin) return;
    const info = msg.userInfo;
    const who = {
      isMod: info.isMod,
      isBroadcaster: info.isBroadcaster,
      isVip: info.isVip,
      isSubscriber: info.isSubscriber,
    };

    chatters.set(user, Date.now()); // présence pour le watchtime

    try {
      // 1) Auto-modération
      if (isEnabled(cfg!, 'automod')) {
        const verdict = inspect(text, who);
        if (verdict) {
          say(`@${info.displayName} ${verdict.reason} ⚠️`);
          await db.logEvent({ kind: 'automod', twitchUser: user, detail: { reason: verdict.reason } });
          return;
        }
      }

      // 2) Points passifs (anti-spam 60s / viewer)
      if (isEnabled(cfg!, 'points') && cfg!.pointsPerMessage > 0 && !onCooldown(`pts:${user}`, 60)) {
        const ownerId = await db.resolveOwnerByTwitch(user).catch(() => null);
        await db.addPoints(user, ownerId, cfg!.pointsPerMessage);
      }

      // 3) Accueil du premier message
      if (isEnabled(cfg!, 'greetings') && live.online && !greeted.has(user) && !who.isBroadcaster) {
        greeted.add(user);
        say(`Bienvenue @${info.displayName} ! Ravi de te voir 👋`);
      }

      // 4) Commandes
      if (text.trim().startsWith('!')) {
        const ctx: CmdCtx = {
          broadcasterId: broadcaster.id,
          user,
          display: info.displayName,
          text,
          who,
          cfg: cfg!,
          commands: commandMap,
          say,
          reloadCommands,
        };
        await handleCommand(ctx);
      }
    } catch (e) {
      console.error('[message]', e);
      await db.logEvent({ kind: 'error', twitchUser: user, detail: { message: String(e) } }).catch(() => {});
    }
  });

  console.log('[bot] prêt ✅');
}

main().catch((e) => {
  console.error('[bot] arrêt sur erreur :', e);
  process.exit(1);
});
