import {
  Client,
  GatewayIntentBits,
  Partials,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type Message,
} from 'discord.js';
import type { BotConfig, DiscordCommand, DiscordRoute } from '@lignezero/types';
import { env } from './env';
import * as db from './db';
import { onCooldown } from './state';
import { BUILTINS } from './discordBuiltins';

/**
 * Bot Discord (optionnel) : annonce les lives, livre les notifications membres
 * (DM ou salon selon le routage), expose des slash commands ET des commandes
 * personnalisées (slash/préfixe) gérées depuis le manager, et synchronise le
 * rôle abonné depuis Twitch. Désactivé si DISCORD_BOT_TOKEN absent.
 *
 * Les commandes PRÉFIXE (!cmd) exigent l'intent privilégié Message Content —
 * activable via bot_config.discord_message_content (à activer AUSSI dans le
 * portail Discord). Les SLASH commands marchent sans cet intent.
 */
let client: Client | null = null;
let notifTimer: ReturnType<typeof setInterval> | null = null;

interface DiscordCfg {
  guildId?: string;
  announceChannelId?: string;
  subRoleId?: string;
  liveMessage: string;
  announce: boolean;
  notifications: boolean;
  subRole: boolean;
  prefix: string;
  messageContent: boolean;
}
let dcfg: DiscordCfg = {
  liveMessage: '🔴 On est EN LIVE !', announce: true, notifications: true, subRole: true, prefix: '!', messageContent: false,
};
let commands: DiscordCommand[] = [];
let routes = new Map<string, DiscordRoute>();

export function setDiscordConfig(cfg: BotConfig) {
  dcfg = {
    guildId: cfg.discordGuildId || env.discordGuildId,
    announceChannelId: cfg.discordAnnounceChannelId || env.discordAnnounceChannelId,
    subRoleId: cfg.discordSubRoleId || env.discordSubRoleId,
    liveMessage: cfg.discordLiveMessage || env.discordLiveMessage || '🔴 On est EN LIVE !',
    announce: cfg.discordAnnounce,
    notifications: cfg.discordNotifications,
    subRole: cfg.discordSubRole,
    prefix: cfg.discordPrefix || '!',
    messageContent: cfg.discordMessageContent,
  };
}

/** Recharge commandes + routage (appelé au start et au refresh périodique). */
export async function syncDiscordData() {
  try {
    commands = await db.listDiscordCommands();
    routes = new Map((await db.listDiscordRoutes()).map((r) => [r.kind, r]));
  } catch (e) {
    console.error('[discord] sync data', e);
  }
}

const cmdWord = (trigger: string) => trigger.replace(/^[!/.]+/, '').trim().toLowerCase();

export async function startDiscord(): Promise<boolean> {
  if (!env.discordBotToken) {
    console.log('[discord] désactivé (DISCORD_BOT_TOKEN absent)');
    return false;
  }
  const intents = [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.DirectMessages];
  if (dcfg.messageContent) intents.push(GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent);
  client = new Client({ intents, partials: [Partials.Channel] });

  client.once('ready', async () => {
    console.log(`[discord] connecté : ${client!.user?.tag}`);
    await registerSlash();
    startNotificationLoop();
  });

  client.on('interactionCreate', async (i) => {
    if (!i.isChatInputCommand()) return;
    try { await handleSlash(i); } catch (e) { console.error('[discord] interaction', e); }
  });

  if (dcfg.messageContent) {
    client.on('messageCreate', (m) => { handlePrefix(m).catch((e) => console.error('[discord] message', e)); });
  }

  await client.login(env.discordBotToken).catch((e) => {
    console.error('[discord] login KO (intents privilégiés non activés dans le portail ?)', e.message);
    client = null;
  });
  return !!client;
}

/** Enregistre les slash (built-ins + custom) sur le serveur configuré. */
async function registerSlash() {
  if (!client || !dcfg.guildId) return;
  const guild = await client.guilds.fetch(dcfg.guildId).catch(() => null);
  if (!guild) return;
  const builtin = commands
    .filter((c) => c.kind === 'builtin' && c.enabled && BUILTINS[cmdWord(c.trigger)])
    .map((c) => BUILTINS[cmdWord(c.trigger)].builder.toJSON());
  const custom = commands
    .filter((c) => c.kind === 'slash')
    .map((c) => new SlashCommandBuilder().setName(cmdWord(c.trigger)).setDescription(c.description || 'Commande personnalisée').toJSON());
  await guild.commands.set([...builtin, ...custom]).catch((e) => console.warn('[discord] slash set KO', e));
}

async function handleSlash(i: ChatInputCommandInteraction) {
  // Commandes intégrées (logique réelle)
  const brow = commands.find((c) => c.kind === 'builtin' && c.enabled && cmdWord(c.trigger) === i.commandName);
  if (brow && BUILTINS[i.commandName]) {
    if (brow.allowedChannels.length && i.channelId && !brow.allowedChannels.includes(i.channelId)) {
      return void i.reply({ content: 'Commande indisponible dans ce salon.', ephemeral: true });
    }
    await BUILTINS[i.commandName].run(i);
    return;
  }

  // Commandes slash personnalisées (réponse texte)
  const cmd = commands.find((c) => c.kind === 'slash' && cmdWord(c.trigger) === i.commandName);
  if (!cmd) return;
  if (cmd.allowedChannels.length && i.channelId && !cmd.allowedChannels.includes(i.channelId)) {
    return void i.reply({ content: 'Commande indisponible dans ce salon.', ephemeral: true });
  }
  await i.reply(await fill(cmd.response, i.user.username));
}

async function handlePrefix(m: Message) {
  if (m.author.bot || !m.content.startsWith(dcfg.prefix)) return;
  const word = m.content.slice(dcfg.prefix.length).split(/\s+/)[0]?.toLowerCase();
  if (!word) return;
  const cmd = commands.find((c) => c.kind === 'prefix' && cmdWord(c.trigger) === word);
  if (!cmd) return;
  if (cmd.allowedChannels.length && !cmd.allowedChannels.includes(m.channelId)) return;
  if (cmd.minRoleId && !m.member?.roles.cache.has(cmd.minRoleId)) return;
  if (onCooldown(`dcmd:${cmd.id}:${m.author.id}`, cmd.cooldownSec)) return;
  await m.reply(await fill(cmd.response, m.author.username)).catch((e) => console.warn('[discord] reply KO', e));
}

/** Substitution de tokens dans une réponse Discord. */
async function fill(tpl: string, user: string): Promise<string> {
  let out = tpl;
  if (out.includes('{nextmatch}')) out = out.split('{nextmatch}').join(await db.nextMatchLabel());
  if (out.includes('{score}')) out = out.split('{score}').join(await db.currentScoreLabel());
  if (out.includes('{roster}')) out = out.split('{roster}').join(await db.rosterLabel());
  return out.split('{user}').join(user);
}

/** Annonce un live dans le salon configuré. */
export async function announceLive(opts: { opponent?: string; competition?: string; url?: string }) {
  if (!client || !dcfg.announce || !dcfg.announceChannelId) return;
  const channel = await client.channels.fetch(dcfg.announceChannelId).catch(() => null);
  if (!channel || !channel.isTextBased() || !('send' in channel)) return;
  const vs = opts.opponent ? ` — vs **${opts.opponent}**${opts.competition ? ` (${opts.competition})` : ''}` : '';
  const link = opts.url ? `\n${opts.url}` : '';
  await channel.send(`${dcfg.liveMessage}${vs}${link}`).catch((e) => console.warn('[discord] annonce KO', e));
}

/** Ajoute le rôle abonné à un membre Discord à partir de son login Twitch. */
export async function grantSubRole(twitchLogin: string) {
  if (!client || !dcfg.subRole || !dcfg.guildId || !dcfg.subRoleId) return;
  const discordId = await db.discordIdByTwitch(twitchLogin);
  if (!discordId) return;
  const guild = await client.guilds.fetch(dcfg.guildId).catch(() => null);
  const member = await guild?.members.fetch(discordId).catch(() => null);
  await member?.roles.add(dcfg.subRoleId).catch((e) => console.warn('[discord] rôle KO', e));
}

function startNotificationLoop() {
  if (notifTimer) clearInterval(notifTimer);
  notifTimer = setInterval(deliverNotifications, 15_000);
}

/** Livre les notifications selon le routage (DM / salon / coupé). */
async function deliverNotifications() {
  if (!client || !dcfg.notifications) return;
  try {
    const pending = await db.listPendingNotifications();
    for (const n of pending) {
      const route = routes.get(n.kind) ?? { kind: n.kind, mode: 'dm' as const };
      const text = `**${n.title}**${n.body ? `\n${n.body}` : ''}`;

      if (route.mode === 'off') { await db.markNotification(n.id, 'delivered'); continue; }

      if (route.mode === 'channel' && route.channelId) {
        const channel = await client.channels.fetch(route.channelId).catch(() => null);
        if (!channel || !channel.isTextBased() || !('send' in channel)) { await db.markNotification(n.id, 'failed'); continue; }
        const mention = await mentionFor(n);
        const ok = await channel.send(`${mention}${text}`).then(() => true).catch(() => false);
        await db.markNotification(n.id, ok ? 'delivered' : 'failed');
        continue;
      }

      // DM par défaut
      const discordId = await resolveDiscordId(n);
      if (!discordId) { await db.markNotification(n.id, 'failed'); continue; }
      const dmUser = await client.users.fetch(discordId).catch(() => null);
      const ok = dmUser ? await dmUser.send(text).then(() => true).catch(() => false) : false;
      await db.markNotification(n.id, ok ? 'delivered' : 'failed');
    }
  } catch (e) {
    console.error('[discord] notifications', e);
  }
}

async function resolveDiscordId(n: { ownerId: string | null; playerId: string | null }): Promise<string | null> {
  return (n.ownerId ? await db.discordIdByOwner(n.ownerId) : null) ?? (n.playerId ? await db.discordIdByPlayer(n.playerId) : null);
}
async function mentionFor(n: { ownerId: string | null; playerId: string | null }): Promise<string> {
  const id = await resolveDiscordId(n);
  return id ? `<@${id}> ` : '';
}

export function discordEnabled(): boolean {
  return !!client;
}
