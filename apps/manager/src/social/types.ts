import type { FC } from 'react';
import type { Announcement, BrandSettings, Clip, Creator, Game, Match, Player, Product, Sponsor, Staff } from '@lignezero/types';
import { DEFAULT_BRAND } from '@lignezero/types';
import type { FormatId } from './formats';

/** Chiffre clé affiché sur un visuel (chip foil, ligne de stat…). */
export interface SocialStat {
  label: string;
  value: string;
}

/** Toutes les données chargées une fois, disponibles pour tout template. */
export interface StudioData {
  games: Game[];
  players: Player[];
  matches: Match[];
  staff: Staff[];
  sponsors: Sponsor[];
  clips: Clip[];
  creators: Creator[];
  products: Product[];
  /** Identité de la structure (nom, logos) — réglée dans la page Identité. */
  brand: BrandSettings;
  /** Annonces déjà saisies, pour pré-remplir le template Communiqué. */
  announcements: Announcement[];
}

export const EMPTY_DATA: StudioData = {
  games: [],
  players: [],
  matches: [],
  staff: [],
  sponsors: [],
  clips: [],
  creators: [],
  products: [],
  brand: DEFAULT_BRAND,
  announcements: [],
};

/** Ce que l'utilisateur a choisi comme source (selon le SourceKind du template). */
export interface Selection {
  matchId?: string;
  playerId?: string;
  gameId?: string;
  sponsorId?: string;
  clipId?: string;
  creatorId?: string;
  productId?: string;
  /** Lundi (ISO date) de la semaine pour les templates multi-matchs. */
  weekStart?: string;
}

/**
 * Quelle source de données pilote le template → quel sélecteur la page affiche.
 * 'none' = pas de source, contenu 100% éditable (annonce texte, citation…).
 */
export type SourceKind =
  | 'match'
  | 'matchWeek'
  | 'player'
  | 'game'
  | 'sponsor'
  | 'clip'
  | 'creator'
  | 'product'
  | 'none';

/**
 * Sélecteur SECONDAIRE optionnel affiché en plus de la source principale
 * (ex. « joueur mis en avant » sur une carte de match). 'player' filtre sur
 * le jeu du match sélectionné si disponible.
 */
export type SecondaryKind = 'player';

/** Familles pour regrouper les templates dans le sélecteur. */
export type TemplateGroup = 'match' | 'joueur' | 'effectif' | 'sponsor' | 'commu' | 'boutique' | 'divers';

export const GROUP_LABELS: Record<TemplateGroup, string> = {
  match: 'Match',
  joueur: 'Joueur',
  effectif: 'Effectif',
  sponsor: 'Sponsor',
  commu: 'Communauté',
  boutique: 'Boutique',
  divers: 'Divers',
};

export type FieldType = 'text' | 'textarea' | 'color' | 'url' | 'number' | 'image';

/** Un champ éditable → le formulaire de la page s'auto-génère depuis cette liste. */
export interface FieldDef<C> {
  key: Extract<keyof C, string>;
  label: string;
  type?: FieldType;
  /** Largeur dans la grille 2 colonnes. Défaut 1. */
  span?: 1 | 2;
  placeholder?: string;
}

export interface VisualProps<C> {
  content: C;
  w: number;
  h: number;
}

/**
 * Descripteur autonome d'un template. Ajouter un poste = créer un fichier qui
 * exporte un TemplateDef, puis l'ajouter au registry (social/index.ts). Aucune
 * modification de la page n'est nécessaire.
 */
export interface TemplateDef<C = Record<string, unknown>> {
  id: string;
  label: string;
  group: TemplateGroup;
  /** Source de données pilotant le sélecteur. */
  source: SourceKind;
  /** Sélecteurs secondaires optionnels (ex. joueur mis en avant). */
  secondary?: SecondaryKind[];
  /** Courte aide affichée sous le sélecteur. */
  hint?: string;
  /** Formats proposés. Défaut : tous. */
  formats?: FormatId[];
  /** Champs éditables (formulaire auto). */
  fields: FieldDef<C>[];
  /** Construit le contenu depuis la DB + la sélection. `null` si sélection incomplète. */
  fromData: (data: StudioData, sel: Selection) => C | null;
  /** Rendu du visuel (rempli le conteneur w×h fourni par la page). */
  Visual: FC<VisualProps<C>>;
  /** Légende prête à coller. */
  caption: (c: C) => string;
}
