/**
 * Modèle de données LigneZero — SOURCE UNIQUE partagée par le vitrine
 * (apps/site) et l'esport manager (apps/manager).
 *
 * Ces interfaces (camelCase) sont le "domaine" applicatif. La DB Supabase
 * stocke les mêmes données en snake_case ; la conversion vit dans
 * @lignezero/supabase (mappers). Garder ces interfaces stables : elles sont
 * le contrat entre les deux apps.
 */

export interface SocialLink {
  label: string;
  url: string;
}

/** Un jeu = un effectif. L'archi gère N jeux. */
export interface Game {
  id: string;
  slug: string;
  name: string;
  /** Sigle court (ex. VAL, LoL). */
  tag: string;
  /** Visuel/illustration. Optionnel → placeholder. */
  visual?: string;
  /** Couleur signature du jeu (hex) — teinte la bande foil / le titre. */
  color?: string;
  /** Chiffres clés flottant en 3D autour du pilier (victoires, podiums…). */
  stats?: PlayerStat[];
  palmares: string[];
}

export type PlayerRole = string;

export interface PlayerStat {
  label: string;
  value: string;
}

export interface Player {
  id: string;
  pseudo: string;
  firstName?: string;
  lastName?: string;
  role: PlayerRole;
  /** Relie le joueur à l'effectif d'un jeu (Game.id). */
  gameId: string;
  country?: string;
  /** Couleur signature du joueur (hex) — recolore sa fiche. */
  color?: string;
  /** Portrait. Optionnel → placeholder. */
  photo?: string;
  socials: SocialLink[];
  stats: PlayerStat[];
  palmares: string[];
  joinedYear?: number;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  photo?: string;
  socials: SocialLink[];
  bio?: string;
  /** Matricule badge (ex. "STF-042"). Optionnel → généré depuis l'id. */
  matricule?: string;
  /** Niveau d'habilitation affiché sur le badge (ex. "NIVEAU 3"). */
  clearance?: string;
  /** Division / pôle gravé sur la plaque (ex. "PERFORMANCE"). */
  division?: string;
  /** Année d'arrivée dans la structure. */
  since?: number;
}

export type SponsorTier = 'principal' | 'officiel' | 'technique';

export interface SponsorDossier {
  classification?: string;
  agent?: string;
  /** Faits bruts (puces). */
  intel?: string[];
  /** Récit du partenariat (paragraphe). */
  story?: string;
  /** Où la marque apparaît (activation). */
  activation?: string[];
}

export interface Sponsor {
  id: string;
  name: string;
  /** Logo. Optionnel → placeholder texte. */
  logo?: string;
  /** Couleur signature de la marque (hex) — teinte la scène spotlight. */
  color?: string;
  url: string;
  tier: SponsorTier;
  /** Accroche du partenariat (surtout pour le partenaire principal). */
  tagline?: string;
  /** Secteur d'activité (ex. Énergie, Périphériques). */
  sector?: string;
  /** Année de début du partenariat. */
  since?: number;
  /** Description courte affichée dans la fiche. */
  description?: string;
  /** Ce que le partenaire apporte à la structure. */
  contribution?: string;
  /** Contenu "dossier d'enquête" (lore pour la commu). */
  dossier?: SponsorDossier;
}

export type MatchStatus = 'upcoming' | 'live' | 'finished';

export interface MatchOpponent {
  name: string;
  logo?: string;
}

export interface MatchScore {
  us: number;
  them: number;
}

export interface Match {
  id: string;
  gameId: string;
  opponent: MatchOpponent;
  /** Date ISO (tri chronologique). */
  dateISO: string;
  competition: string;
  status: MatchStatus;
  /** Score si terminé/live. */
  score?: MatchScore;
  streamUrl?: string;
  vodUrl?: string;
}

/** Créateur / streamer de la communauté (page Communauté). */
export interface Creator {
  id: string;
  name: string;
  /** Rôle affiché (ex. "Joueur · Valorant", "Créatrice"). */
  role?: string;
  platform: 'Twitch' | 'YouTube' | 'Kick';
  /** En live actuellement → carte mise en avant + badge LIVE. */
  live?: boolean;
  /** Titre du live / dernière vidéo. */
  title?: string;
  /** Spectateurs si en live. */
  viewers?: number;
  /** Avatar. Optionnel → placeholder. */
  avatar?: string;
  url: string;
}

/** Clip / temps fort partagé par la communauté. */
export interface Clip {
  id: string;
  title: string;
  author: string;
  game?: string;
  /** Vignette. Optionnel → placeholder. */
  thumb?: string;
  url: string;
}

export type ProductStatus = 'available' | 'soon';

export interface Product {
  id: string;
  name: string;
  category: string;
  price?: string;
  image?: string;
  status: ProductStatus;
}

/** Rôle d'un compte (profiles.role côté Supabase). */
export type UserRole = 'admin' | 'manager' | 'coach' | 'joueur' | 'staff' | 'content' | 'member';

export interface Profile {
  id: string;
  role: UserRole;
  displayName?: string;
  /** Lie un compte joueur à sa fiche roster (players.id). */
  playerId?: string;
}

// ── Plateforme d'équipe (manager utilisé par direction + staff + joueurs) ──

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: string;
  createdAt: string;
}

export type ObjectiveScope = 'team' | 'player';
export type ObjectiveStatus = 'todo' | 'doing' | 'done';

export interface Objective {
  id: string;
  scope: ObjectiveScope;
  /** Requis si scope='player'. */
  playerId?: string;
  /** Lundi de la semaine (date ISO) ou vide. */
  week?: string;
  title: string;
  detail?: string;
  status: ObjectiveStatus;
  createdAt: string;
}

export interface Feedback {
  id: string;
  playerId: string;
  /** Match lié (optionnel). */
  matchId?: string;
  body: string;
  acknowledged: boolean;
  reply?: string;
  createdAt: string;
}

export type SessionKind = 'scrim' | 'practice' | 'review' | 'tournament' | 'meeting' | 'event';

export interface Session {
  id: string;
  kind: SessionKind;
  title: string;
  /** Date/heure ISO. */
  startsAt: string;
  durationMin?: number;
  gameId?: string;
  location?: string;
  notes?: string;
}

export type RsvpStatus = 'yes' | 'no' | 'maybe';

export interface SessionRsvp {
  sessionId: string;
  playerId: string;
  status: RsvpStatus;
}

export type AvailabilityStatus = 'available' | 'maybe';

/** Un créneau de disponibilité : un jour + une plage horaire (plusieurs par jour). */
export interface Availability {
  id: string;
  playerId: string;
  /** Jour (date ISO). */
  day: string;
  /** Heure de début 'HH:MM'. */
  startTime?: string;
  /** Heure de fin 'HH:MM'. */
  endTime?: string;
  status: AvailabilityStatus;
  note?: string;
}
