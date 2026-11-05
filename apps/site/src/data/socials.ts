/** Réseaux de la structure. Édite ici pour changer les liens. */
export interface Social {
  id: string;
  label: string;
  handle: string;
  url: string;
}

/** Invitation Discord — partagée avec le bloc CTA de la page Communauté. */
export const DISCORD_URL = 'https://discord.gg/m6FXDpk6Jp';

/**
 * Liens RÉELS de la structure. Les handles diffèrent d'un réseau à l'autre
 * (@Ligne_Zero sur X, ligne__zero sur Instagram) : ils sont donc écrits en
 * clair plutôt que dérivés d'un handle unique, qui produirait des URL fausses.
 *
 * Twitch, YouTube et TikTok sont volontairement absents — pas de compte actif.
 */
export const socials: Social[] = [
  { id: 'x', label: 'X', handle: '@Ligne_Zero', url: 'https://x.com/Ligne_Zero' },
  { id: 'instagram', label: 'Instagram', handle: '@ligne__zero', url: 'https://www.instagram.com/ligne__zero/' },
  { id: 'discord', label: 'Discord', handle: 'discord.gg', url: DISCORD_URL },
];
