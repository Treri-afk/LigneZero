import type { Creator, Clip } from '@/types';

/* Le Discord vit désormais dans data/socials.ts (DISCORD_URL). Les compteurs
   membres/en-ligne ont été retirés : ils étaient inventés, et Discord ne les
   expose pas sans widget activé côté serveur. */

/**
 * Créateurs & streamers de la communauté. AJOUTER = une entrée ici.
 * Avatars : public/img/community/. `live: true` met la carte en avant.
 */
export const creators: Creator[] = [
  {
    id: 'c-zenith',
    name: 'ZENITH',
    role: 'Joueur · Valorant',
    platform: 'Twitch',
    live: true,
    title: 'Ranked to Radiant — grind du soir',
    viewers: 1240,
    url: 'https://twitch.tv/',
  },
  {
    id: 'c-pixl',
    name: 'PIXL',
    role: 'Direction créative',
    platform: 'Twitch',
    live: true,
    title: 'Chill design + Q&A communauté',
    viewers: 530,
    url: 'https://twitch.tv/',
  },
  {
    id: 'c-probe',
    name: 'PROBE',
    role: 'Analyste',
    platform: 'YouTube',
    live: false,
    title: 'VOD review — lecture de draft LoL',
    url: 'https://youtube.com/',
  },
  {
    id: 'c-vortex',
    name: 'VORTEX',
    role: 'Joueur · Valorant',
    platform: 'Kick',
    live: false,
    title: 'Scrims & coaching communautaire',
    url: 'https://kick.com/',
  },
];

/**
 * Clips / temps forts. AJOUTER = une entrée ici.
 * Vignettes : public/img/community/.
 */
export const clips: Clip[] = [
  { id: 'clip-1', title: '1v5 clutch sur Ascent en finale', author: 'ZENITH', game: 'Valorant', url: '#' },
  { id: 'clip-2', title: 'Le teamfight qui scelle le Baron', author: 'PROBE', game: 'LoL', url: '#' },
  { id: 'clip-3', title: 'Ace à l’aveugle post-plant', author: 'VORTEX', game: 'Valorant', url: '#' },
  { id: 'clip-4', title: 'Best-of stream design de la semaine', author: 'PIXL', game: 'IRL', url: '#' },
];
