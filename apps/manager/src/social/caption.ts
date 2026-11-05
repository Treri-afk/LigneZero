/**
 * Helpers partagés pour construire les légendes. Chaque template fournit sa
 * propre fonction `caption(content)` ; ces utilitaires évitent d'y dupliquer la
 * logique de hashtags / hôte de stream / nettoyage.
 *
 * Le nom de la structure vient de `./brand` (réglé dans le manager, page
 * Identité) — plus de placeholder codé en dur.
 */
import { brandName } from './brand';

/** Slug hashtag depuis un libellé (retire accents/espaces/ponctuation). */
export function tag(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '');
}

/** Bloc de hashtags standard : #<marque> #<jeu> #esport + extras. */
export function hashtags(gameTag?: string, extra: string[] = []): string {
  return [`#${tag(brandName())}`, gameTag ? `#${tag(gameTag)}` : '', '#esport', ...extra.map((e) => `#${tag(e)}`)]
    .filter(Boolean)
    .join(' ');
}

/** Hôte lisible d'une URL de stream/VOD (ex. "twitch.tv/…"). */
export function hostOf(url: string | undefined): string {
  if (!url) return '';
  try {
    return new URL(url).host.replace(/^www\./, '') + '/…';
  } catch {
    return '';
  }
}

/** Assemble des lignes en compressant les sauts multiples. */
export function lines(...ls: (string | false | undefined)[]): string {
  return ls
    .filter((l) => l !== undefined && l !== false)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
