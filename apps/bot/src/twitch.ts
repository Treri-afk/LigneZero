import { RefreshingAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';
import { env } from './env';

/**
 * Auth Twitch rafraîchissante. Le compte bot fournit un token utilisateur
 * (scopes chat:read chat:edit) utilisé pour le chat ET l'EventSub WebSocket.
 */
export const authProvider = new RefreshingAuthProvider({
  clientId: env.twitchClientId,
  clientSecret: env.twitchClientSecret,
});

export const api = new ApiClient({ authProvider });

/** Enregistre le compte bot et l'intent 'chat'. Renvoie l'user id du bot. */
export async function initAuth(): Promise<string> {
  return authProvider.addUserForToken(
    {
      accessToken: env.twitchAccessToken,
      refreshToken: env.twitchRefreshToken,
      expiresIn: 0,
      obtainmentTimestamp: 0,
      scope: ['chat:read', 'chat:edit'],
    },
    ['chat'],
  );
}

/**
 * Enregistre le token du BROADCASTER (si fourni) → nécessaire pour souscrire
 * aux évènements sub/cheer/follow via EventSub. Renvoie l'user id ou null.
 */
export async function initBroadcasterAuth(): Promise<string | null> {
  if (!env.twitchBroadcasterAccessToken || !env.twitchBroadcasterRefreshToken) return null;
  return authProvider.addUserForToken({
    accessToken: env.twitchBroadcasterAccessToken,
    refreshToken: env.twitchBroadcasterRefreshToken,
    expiresIn: 0,
    obtainmentTimestamp: 0,
    scope: ['channel:read:subscriptions', 'bits:read', 'moderator:read:followers'],
  });
}
