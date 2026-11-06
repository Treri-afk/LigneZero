import type { EventSubWsListener } from '@twurple/eventsub-ws';
import type { AlertEventType } from '@lignezero/types';
import * as db from './db';

/**
 * Alertes → évènement configurable. Souscrit aux évènements EventSub et poste
 * le message paramétré dans `bot_alerts` + attribue un bonus de points.
 *
 * Les souscriptions sub/cheer/follow nécessitent le TOKEN DU BROADCASTER avec
 * les bons scopes ; chaque souscription est protégée pour ne pas planter le bot
 * si le scope manque (log d'avertissement).
 */
interface Ctx {
  user: string;      // affichage
  login: string;     // login (pour points)
  amount?: number;   // bits / nb subs offerts
  months?: number;   // resub
  viewers?: number;  // raid
}

export function setupAlerts(opts: {
  listener: EventSubWsListener;
  broadcasterId: string;
  isOn: () => boolean;
  say: (msg: string) => void;
  /** Appelé au (ré)abonnement — sert à synchroniser un rôle Discord. */
  onSubscriber?: (login: string) => void;
}) {
  const { listener, broadcasterId, isOn, say, onSubscriber } = opts;

  const fire = async (type: AlertEventType, c: Ctx) => {
    try {
      if (!isOn()) return;
      const alert = await db.getAlert(type);
      if (!alert || !alert.enabled) return;
      const measure = c.amount ?? c.viewers ?? 0;
      if (alert.minAmount > 0 && measure < alert.minAmount) return;
      say(fillAlert(alert.message, c));
      if (alert.rewardPoints > 0 && c.login) {
        const owner = await db.resolveOwnerByTwitch(c.login).catch(() => null);
        await db.addPoints(c.login, owner, alert.rewardPoints);
      }
      await db.logEvent({ kind: `alert_${type}`, twitchUser: c.login, detail: { measure } });
    } catch (e) {
      console.error(`[alerts:${type}]`, e);
    }
  };

  const guard = (label: string, fn: () => unknown) => {
    try { fn(); console.log(`[alerts] ${label} souscrit`); }
    catch (e) { console.warn(`[alerts] ${label} indisponible (scope manquant ?)`, (e as Error).message); }
  };

  guard('subscribe', () =>
    listener.onChannelSubscription(broadcasterId, (e) => { fire('sub', { user: e.userDisplayName, login: e.userName, amount: 1 }); onSubscriber?.(e.userName); }));
  guard('resub', () =>
    listener.onChannelSubscriptionMessage(broadcasterId, (e) => { fire('resub', { user: e.userDisplayName, login: e.userName, months: e.cumulativeMonths }); onSubscriber?.(e.userName); }));
  guard('giftsub', () =>
    listener.onChannelSubscriptionGift(broadcasterId, (e) => fire('giftsub', { user: e.gifterDisplayName ?? 'Anonyme', login: e.gifterName ?? '', amount: e.amount })));
  guard('raid', () =>
    listener.onChannelRaidTo(broadcasterId, (e) => fire('raid', { user: e.raidingBroadcasterDisplayName, login: e.raidingBroadcasterName, viewers: e.viewers })));
  guard('cheer', () =>
    listener.onChannelCheer(broadcasterId, (e) => fire('cheer', { user: e.userDisplayName ?? 'Anonyme', login: e.userName ?? '', amount: e.bits })));
  guard('follow', () =>
    listener.onChannelFollow(broadcasterId, broadcasterId, (e) => fire('follow', { user: e.userDisplayName, login: e.userName })));
}

function fillAlert(tpl: string, c: Ctx): string {
  return tpl
    .split('{user}').join(c.user)
    .split('{amount}').join(String(c.amount ?? ''))
    .split('{months}').join(String(c.months ?? ''))
    .split('{viewers}').join(String(c.viewers ?? ''));
}
