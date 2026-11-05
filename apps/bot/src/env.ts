import 'dotenv/config';

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`[bot] Variable d'environnement manquante : ${name} (voir .env.example)`);
  return v;
}
function opt(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length ? v : undefined;
}

export const env = {
  supabaseUrl: req('SUPABASE_URL'),
  supabaseServiceKey: req('SUPABASE_SERVICE_ROLE_KEY'),
  twitchClientId: req('TWITCH_CLIENT_ID'),
  twitchClientSecret: req('TWITCH_CLIENT_SECRET'),
  twitchBotUsername: req('TWITCH_BOT_USERNAME'),
  twitchAccessToken: req('TWITCH_BOT_ACCESS_TOKEN'),
  twitchRefreshToken: req('TWITCH_BOT_REFRESH_TOKEN'),
  // Token du BROADCASTER (optionnel) : requis pour les alertes EventSub
  // sub/cheer/follow (scopes channel:read:subscriptions, bits:read, moderator:read:followers).
  twitchBroadcasterAccessToken: opt('TWITCH_BROADCASTER_ACCESS_TOKEN'),
  twitchBroadcasterRefreshToken: opt('TWITCH_BROADCASTER_REFRESH_TOKEN'),
  twitchChannel: opt('TWITCH_CHANNEL'),
  clipPollSec: Number(opt('CLIP_POLL_SEC') ?? '60'),
  discordInvite: opt('DISCORD_INVITE'),
  // ── Discord (optionnel) ──
  discordBotToken: opt('DISCORD_BOT_TOKEN'),
  discordGuildId: opt('DISCORD_GUILD_ID'),
  discordAnnounceChannelId: opt('DISCORD_ANNOUNCE_CHANNEL_ID'),
  discordSubRoleId: opt('DISCORD_SUB_ROLE_ID'),
  discordLiveMessage: opt('DISCORD_LIVE_MESSAGE'),
};
