import type { BrandSettings } from '@lignezero/types';
import { DEFAULT_BRAND } from '@lignezero/types';

/**
 * Identité de marque COURANTE du studio réseaux.
 *
 * Les templates sont des fonctions de rendu pures appelées depuis des dizaines
 * d'endroits (visuels, légendes, primitives) : leur faire remonter la marque en
 * paramètre imposerait de la propager dans chaque `content`. Comme le studio est
 * un outil mono-page qui charge la marque une fois au démarrage, on la garde
 * ici, renseignée par SocialStudioPage via `setStudioBrand`.
 *
 * Remplace l'ancien `export const BRAND = '__BRAND__'`, qui obligeait à
 * recompiler pour changer le nom et ne permettait aucun logo.
 */
let current: BrandSettings = DEFAULT_BRAND;

/** Appelé une fois par le studio, au chargement des données. */
export function setStudioBrand(b: BrandSettings): void {
  current = b;
}

/** Réglages complets (nom, logos, accent). */
export function studioBrand(): BrandSettings {
  return current;
}

/** Nom de la structure — à utiliser dans les visuels et les légendes. */
export function brandName(): string {
  return current.name;
}
