/** Source unique de la navigation. Ajoute/retire une route ici. */
export interface RouteDef {
  path: string;
  label: string;
  /** Index HUD affiché en monospace (ex. 01, 02…). */
  code: string;
}

/**
 * Routes VISIBLES : nav du header, grille de l'accueil, plan du site.
 * Le site couvrait trop de terrain pour l'objectif (promouvoir la structure) :
 * on resserre sur l'essentiel.
 */
export const routes: RouteDef[] = [
  { path: '/tournoi', label: 'Tournoi', code: '01' },
  { path: '/communaute', label: 'Communauté', code: '02' },
];

/**
 * Routes MASQUÉES — volontairement retirées de l'accès, PAS supprimées.
 * Le code des pages, leurs sections et leurs données restent intacts :
 * remonter une entrée dans `routes` ci-dessus suffit à la réactiver.
 * App.tsx redirige ces chemins vers l'accueil pour qu'une ancienne URL
 * ou un lien externe ne tombe pas sur un 404.
 */
export const hiddenRoutes: RouteDef[] = [
  { path: '/staff', label: 'Staff', code: '—' },
  { path: '/sponsors', label: 'Sponsors', code: '—' },
  { path: '/calendrier', label: 'Calendrier', code: '—' },
  { path: '/boutique', label: 'Boutique', code: '—' },
  { path: '/equipe', label: 'Équipe', code: '—' },
];

/** Un chemin est-il masqué ? (utilisé pour la redirection dans App.tsx) */
export function isHidden(path: string): boolean {
  return hiddenRoutes.some((r) => r.path === path);
}
