import type { UserRole } from '@lignezero/types';

export type NavSection = 'Espace' | 'Performance' | 'Direction' | 'Contenu' | 'Paramètres' | 'Admin';

export interface NavItem {
  path: string;
  label: string;
  code: string;
  section: NavSection;
  /** Rôles autorisés à voir/accéder à cette zone. */
  roles: UserRole[];
}

const ALL: UserRole[] = ['admin', 'manager', 'coach', 'joueur', 'staff', 'content', 'graphiste'];
const DIR: UserRole[] = ['admin', 'manager'];
const CONTENT: UserRole[] = ['admin', 'manager', 'content', 'graphiste'];

export const NAV: NavItem[] = [
  { path: '/', label: 'Tableau de bord', code: 'DASH', section: 'Espace', roles: ALL },

  // Espace joueur
  { path: '/me/dispos', label: 'Mes disponibilités', code: 'DISP', section: 'Espace', roles: ['joueur'] },
  { path: '/me/profil', label: 'Mon profil', code: 'PROF', section: 'Espace', roles: ['joueur'] },

  // Performance
  { path: '/matches', label: 'Calendrier', code: 'CAL', section: 'Performance', roles: ALL },
  { path: '/objectifs', label: 'Objectifs', code: 'OBJ', section: 'Performance', roles: ['admin', 'manager', 'coach', 'joueur', 'staff'] },
  { path: '/feedback', label: 'Feedback', code: 'FDBK', section: 'Performance', roles: ['admin', 'manager', 'coach', 'joueur'] },
  { path: '/sessions', label: 'Sessions & scrims', code: 'SESS', section: 'Performance', roles: ['admin', 'manager', 'coach', 'joueur', 'staff'] },
  { path: '/dispos', label: 'Dispos équipe', code: 'GRID', section: 'Performance', roles: ['admin', 'manager', 'coach', 'staff'] },
  { path: '/review', label: 'Revue vidéo', code: 'VOD', section: 'Performance', roles: ['admin', 'manager', 'coach', 'joueur', 'staff'] },
  { path: '/strats', label: 'Strats', code: 'STR', section: 'Performance', roles: ALL },
  { path: '/tryouts', label: 'Candidats tryout', code: 'CDT', section: 'Performance', roles: ['admin', 'manager', 'coach', 'joueur', 'staff'] },
  { path: '/tryouts/creneaux', label: 'Créneaux tryout', code: 'OVLP', section: 'Performance', roles: ['admin', 'manager', 'coach', 'joueur', 'staff'] },
  { path: '/tryouts/campagnes', label: 'Campagnes tryout', code: 'TRY', section: 'Direction', roles: DIR },

  // Direction
  { path: '/players', label: 'Joueurs', code: 'PLR', section: 'Direction', roles: ['admin', 'manager', 'coach', 'staff'] },
  { path: '/staff', label: 'Staff', code: 'STF', section: 'Direction', roles: DIR },
  { path: '/games', label: 'Jeux', code: 'GAM', section: 'Direction', roles: DIR },
  { path: '/sponsors', label: 'Sponsors', code: 'SPN', section: 'Direction', roles: DIR },
  { path: '/suivi-sponsors', label: 'Suivi sponsors', code: 'TRK', section: 'Direction', roles: DIR },
  { path: '/annonces', label: 'Annonces', code: 'ANN', section: 'Direction', roles: ALL },

  // Contenu
  { path: '/social', label: 'Studio réseaux', code: 'SOC', section: 'Contenu', roles: CONTENT },
  { path: '/design', label: 'Studio graphique', code: 'GFX', section: 'Contenu', roles: ALL },
  { path: '/creators', label: 'Créateurs', code: 'CRT', section: 'Contenu', roles: CONTENT },
  { path: '/clips', label: 'Clips', code: 'CLP', section: 'Contenu', roles: CONTENT },
  { path: '/products', label: 'Boutique', code: 'PRD', section: 'Contenu', roles: CONTENT },

  // Paramètres (config Valoplant — maps/agents/compétences, réutilisées par le plan tactique des strats)
  { path: '/parametres/maps', label: 'Maps', code: 'MAP', section: 'Paramètres', roles: DIR },
  { path: '/parametres/agents', label: 'Agents & compétences', code: 'AGT', section: 'Paramètres', roles: DIR },

  // Admin
  { path: '/finance', label: 'Finance', code: 'FIN', section: 'Admin', roles: ['admin'] },
  { path: '/comptes', label: 'Comptes & rôles', code: 'ACL', section: 'Admin', roles: ['admin'] },
];

export const SECTION_ORDER: NavSection[] = ['Espace', 'Performance', 'Direction', 'Contenu', 'Paramètres', 'Admin'];

/** Items visibles pour un rôle. */
export function navFor(role: UserRole | null): NavItem[] {
  if (!role) return [];
  return NAV.filter((n) => n.roles.includes(role));
}
