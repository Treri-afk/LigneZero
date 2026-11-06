import {
  fromBotConfigRow,
  fromBotCommandRow,
  fromBotTimerRow,
  fromBotRewardRow,
  fromBotAlertRow,
  fromMatchPredictionRow,
  fromDiscordCommandRow,
  fromDiscordRouteRow,
} from '@lignezero/supabase';
import type { BotConfig, BotCommand, BotTimer, BotReward, BotAlert, AlertEventType, MatchPrediction, DiscordCommand, DiscordRoute } from '@lignezero/types';
import { supa } from './supabase';

const norm = (login: string) => login.replace(/^@/, '').trim().toLowerCase();
const oppName = (j: unknown): string => (j && typeof j === 'object' ? ((j as { name?: string }).name ?? '???') : '???');

// ── Config / commandes / timers ────────────────────────────────────
export async function getConfig(): Promise<BotConfig | null> {
  const { data, error } = await supa.from('bot_config').select('*').eq('id', true).maybeSingle();
  if (error) throw error;
  return data ? fromBotConfigRow(data) : null;
}
export async function listCommands(): Promise<BotCommand[]> {
  const { data, error } = await supa.from('bot_commands').select('*').eq('enabled', true);
  if (error) throw error;
  return (data ?? []).map(fromBotCommandRow);
}
export async function addCommand(trigger: string, response: string): Promise<void> {
  const { error } = await supa.from('bot_commands').upsert({ trigger, response, enabled: true }, { onConflict: 'trigger' });
  if (error) throw error;
}
export async function removeCommand(trigger: string): Promise<void> {
  const { error } = await supa.from('bot_commands').delete().eq('trigger', trigger);
  if (error) throw error;
}
export async function listTimers(): Promise<BotTimer[]> {
  const { data, error } = await supa.from('bot_timers').select('*').eq('enabled', true);
  if (error) throw error;
  return (data ?? []).map(fromBotTimerRow);
}

// ── Liaison compte membre ──────────────────────────────────────────
export async function resolveOwnerByTwitch(login: string): Promise<string | null> {
  const { data, error } = await supa
    .from('member_links')
    .select('owner_id, twitch_handle')
    .ilike('twitch_handle', norm(login))
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.owner_id ?? null;
}

// ── Matchs ─────────────────────────────────────────────────────────
export interface CurrentMatch { id: string; opponent: string; competition: string }

/** Match rattaché au live : 'live' d'abord, sinon le plus proche de maintenant (±12h). */
export async function findCurrentMatch(): Promise<CurrentMatch | null> {
  const { data, error } = await supa.from('matches').select('id, opponent, competition, status, date_iso');
  if (error) throw error;
  const rows = data ?? [];
  const live = rows.find((r) => r.status === 'live');
  let pick = live;
  if (!pick) {
    const now = Date.now();
    const within = rows
      .map((r) => ({ r, dt: Math.abs(new Date(r.date_iso).getTime() - now) }))
      .filter((x) => x.dt < 12 * 3600 * 1000)
      .sort((a, b) => a.dt - b.dt)[0];
    pick = within?.r;
  }
  if (!pick) return null;
  return { id: pick.id, opponent: oppName(pick.opponent), competition: pick.competition };
}
export async function setMatchLive(matchId: string): Promise<void> {
  await supa.from('matches').update({ status: 'live' }).eq('id', matchId).eq('status', 'upcoming');
}
export async function nextMatchLabel(): Promise<string> {
  const { data } = await supa
    .from('matches')
    .select('opponent, date_iso')
    .gte('date_iso', new Date().toISOString())
    .order('date_iso')
    .limit(1);
  const m = data?.[0];
  if (!m) return 'aucun match programmé';
  return `${oppName(m.opponent)} — ${new Date(m.date_iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}`;
}
export async function currentScoreLabel(): Promise<string> {
  const { data } = await supa.from('matches').select('opponent, score, status').eq('status', 'live').limit(1);
  const m = data?.[0];
  if (!m) return 'aucun match en cours';
  const s = m.score as { us?: number; them?: number } | null;
  if (!s) return `vs ${oppName(m.opponent)} — pas encore de score`;
  return `vs ${oppName(m.opponent)} : ${s.us ?? 0} - ${s.them ?? 0}`;
}
export async function rosterLabel(): Promise<string> {
  const { data } = await supa.from('players').select('pseudo, role').order('pseudo');
  const rows = data ?? [];
  if (!rows.length) return 'roster à venir';
  return rows.map((p) => p.pseudo).join(', ');
}

// ── Drops : tickets & cartouches ───────────────────────────────────
export async function grantTicket(ownerId: string, matchId: string): Promise<'granted' | 'already'> {
  const { error: cErr } = await supa.from('ticket_claims').insert({ owner_id: ownerId, match_id: matchId, source: 'twitch' });
  if (cErr) {
    if (cErr.code === '23505') return 'already'; // clé primaire dupliquée → déjà réclamé
    throw cErr;
  }
  const { error: iErr } = await supa
    .from('inventory_items')
    .insert({ owner_id: ownerId, kind: 'ticket', name: 'Ticket de match', source: 'twitch', match_id: matchId });
  if (iErr) throw iErr;
  return 'granted';
}
export async function grantCartridge(
  ownerId: string,
  o: { name: string; title: string; url: string; thumb?: string | null },
): Promise<'granted' | 'already'> {
  const { data: existing } = await supa
    .from('inventory_items')
    .select('id')
    .eq('owner_id', ownerId)
    .eq('link', o.url)
    .limit(1)
    .maybeSingle();
  if (existing) return 'already';
  const { error } = await supa.from('inventory_items').insert({
    owner_id: ownerId,
    kind: 'cartouche',
    name: o.name,
    description: o.title,
    image: o.thumb ?? null,
    link: o.url,
    source: 'twitch',
  });
  if (error) throw error;
  return 'granted';
}

// ── Points de fidélité (atomique via RPC) ──────────────────────────
export async function addPoints(login: string, ownerId: string | null, amount: number): Promise<number> {
  const { data, error } = await supa.rpc('award_points', { p_login: norm(login), p_owner: ownerId, p_amount: amount });
  if (error) throw error;
  return data ?? 0;
}
export async function getPoints(login: string): Promise<number> {
  const { data } = await supa.from('viewer_points').select('points').eq('twitch_login', norm(login)).maybeSingle();
  return data?.points ?? 0;
}
export async function getViewer(login: string): Promise<{ points: number; watchMinutes: number }> {
  const { data } = await supa.from('viewer_points').select('points, watch_minutes').eq('twitch_login', norm(login)).maybeSingle();
  return { points: data?.points ?? 0, watchMinutes: data?.watch_minutes ?? 0 };
}
export interface AdjustResult { ok: boolean; remaining: number }
/** Applique un delta de points (débit/crédit). Refuse le négatif à découvert sauf allowNegative. */
export async function adjustPoints(login: string, ownerId: string | null, delta: number, allowNegative = false): Promise<AdjustResult> {
  const { data, error } = await supa.rpc('adjust_points', { p_login: norm(login), p_owner: ownerId, p_delta: delta, p_allow_negative: allowNegative });
  if (error) throw error;
  return (data ?? { ok: false, remaining: 0 }) as unknown as AdjustResult;
}
export async function addWatchtime(login: string, minutes: number): Promise<void> {
  const { error } = await supa.rpc('add_watchtime', { p_login: norm(login), p_minutes: minutes });
  if (error) throw error;
}
export async function topPoints(limit = 5): Promise<{ login: string; points: number }[]> {
  const { data } = await supa.from('viewer_points').select('twitch_login, points').order('points', { ascending: false }).limit(limit);
  return (data ?? []).map((r) => ({ login: r.twitch_login, points: r.points }));
}

// ── Citations ──────────────────────────────────────────────────────
export async function randomQuote(): Promise<{ id: number; text: string } | null> {
  const { data } = await supa.from('bot_quotes').select('id, text');
  const rows = data ?? [];
  if (!rows.length) return null;
  return rows[Math.floor(Math.random() * rows.length)];
}
export async function quoteById(id: number): Promise<{ id: number; text: string } | null> {
  const { data } = await supa.from('bot_quotes').select('id, text').eq('id', id).maybeSingle();
  return data ?? null;
}
export async function addQuote(text: string, addedBy: string): Promise<number> {
  const { data, error } = await supa.from('bot_quotes').insert({ text, added_by: addedBy }).select('id').single();
  if (error) throw error;
  return data.id;
}

// ── Boutique de points ─────────────────────────────────────────────
export async function listRewards(): Promise<BotReward[]> {
  const { data, error } = await supa.from('bot_rewards').select('*').eq('enabled', true).order('sort_order');
  if (error) throw error;
  return (data ?? []).map(fromBotRewardRow);
}
export async function findReward(idOrName: string): Promise<BotReward | null> {
  const rewards = await listRewards();
  const q = idOrName.trim().toLowerCase();
  return rewards.find((r) => r.id === idOrName) ?? rewards.find((r) => r.name.toLowerCase() === q) ?? null;
}
export interface RedeemResult { ok: boolean; reason?: string; remaining?: number; cost?: number; reward?: string }
export async function redeemReward(login: string, rewardId: string): Promise<RedeemResult> {
  const { data, error } = await supa.rpc('redeem_reward', { p_login: norm(login), p_reward_id: rewardId });
  if (error) throw error;
  return (data ?? { ok: false }) as unknown as RedeemResult;
}

// ── Alertes ────────────────────────────────────────────────────────
export async function getAlert(eventType: AlertEventType): Promise<BotAlert | null> {
  const { data, error } = await supa.from('bot_alerts').select('*').eq('event_type', eventType).maybeSingle();
  if (error) throw error;
  return data ? fromBotAlertRow(data) : null;
}

// ── Prédictions / paris ────────────────────────────────────────────
export async function openPrediction(): Promise<MatchPrediction | null> {
  const { data, error } = await supa.from('match_predictions').select('*').in('status', ['open', 'locked']).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data ? fromMatchPredictionRow(data) : null;
}
export async function createPrediction(question: string, options: string[], matchId: string | null): Promise<void> {
  const { error } = await supa.from('match_predictions').insert({ question, options, match_id: matchId, status: 'open' });
  if (error) throw error;
}
export async function setPredictionStatus(id: string, status: 'open' | 'locked' | 'resolved'): Promise<void> {
  const { error } = await supa.from('match_predictions').update({ status }).eq('id', id);
  if (error) throw error;
}
export interface BetResult { ok: boolean; reason?: string; remaining?: number }
export async function placeBet(login: string, ownerId: string | null, predictionId: string, option: number, amount: number): Promise<BetResult> {
  const { data, error } = await supa.rpc('place_bet', { p_login: norm(login), p_owner: ownerId, p_prediction_id: predictionId, p_option: option, p_amount: amount });
  if (error) throw error;
  return (data ?? { ok: false }) as unknown as BetResult;
}
export interface ResolveResult { ok: boolean; reason?: string; total?: number; winners?: number; paid?: number; refunded?: boolean }
export async function resolvePrediction(id: string, winning: number): Promise<ResolveResult> {
  const { data, error } = await supa.rpc('resolve_prediction', { p_prediction_id: id, p_winning: winning });
  if (error) throw error;
  return (data ?? { ok: false }) as unknown as ResolveResult;
}

// ── Discord : résolution d'ids + file de notifications ─────────────
export async function discordIdByOwner(ownerId: string): Promise<string | null> {
  const { data } = await supa.from('member_links').select('discord_user_id').eq('owner_id', ownerId).maybeSingle();
  return data?.discord_user_id ?? null;
}
export async function discordIdByTwitch(login: string): Promise<string | null> {
  const { data } = await supa.from('member_links').select('discord_user_id').ilike('twitch_handle', norm(login)).limit(1).maybeSingle();
  return data?.discord_user_id ?? null;
}
/** Résout un utilisateur Discord → son compte points (login Twitch lié + owner). */
export async function viewerByDiscord(discordUserId: string): Promise<{ login?: string; owner?: string }> {
  const { data } = await supa.from('member_links').select('twitch_handle, owner_id').eq('discord_user_id', discordUserId).maybeSingle();
  if (!data?.twitch_handle) return {};
  return { login: data.twitch_handle.toLowerCase(), owner: data.owner_id ?? undefined };
}
export async function discordIdByPlayer(playerId: string): Promise<string | null> {
  const { data } = await supa.from('profiles').select('id').eq('player_id', playerId).maybeSingle();
  if (!data?.id) return null;
  return discordIdByOwner(data.id);
}
export interface PendingNotif { id: string; ownerId: string | null; playerId: string | null; title: string; body: string | null; kind: string }
export async function listPendingNotifications(): Promise<PendingNotif[]> {
  const { data, error } = await supa.from('bot_notifications').select('id, owner_id, player_id, title, body, kind').eq('status', 'pending').limit(20);
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, ownerId: r.owner_id, playerId: r.player_id, title: r.title, body: r.body, kind: r.kind }));
}
export async function markNotification(id: string, status: 'delivered' | 'failed'): Promise<void> {
  await supa.from('bot_notifications').update({ status, delivered_at: new Date().toISOString() }).eq('id', id);
}
export async function listDiscordCommands(): Promise<DiscordCommand[]> {
  const { data, error } = await supa.from('discord_commands').select('*').eq('enabled', true);
  if (error) throw error;
  return (data ?? []).map(fromDiscordCommandRow);
}
export async function listDiscordRoutes(): Promise<DiscordRoute[]> {
  const { data, error } = await supa.from('discord_routes').select('*');
  if (error) throw error;
  return (data ?? []).map(fromDiscordRouteRow);
}

// ── Journal ────────────────────────────────────────────────────────
export async function logEvent(e: {
  kind: string;
  twitchUser?: string;
  ownerId?: string | null;
  matchId?: string | null;
  detail?: unknown;
}): Promise<void> {
  await supa.from('bot_events').insert({
    kind: e.kind,
    twitch_user: e.twitchUser ?? null,
    owner_id: e.ownerId ?? null,
    match_id: e.matchId ?? null,
    detail: (e.detail ?? null) as never,
  });
}
