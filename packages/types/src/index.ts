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
  /** Setup gaming (souris, clavier, tapis, écran…) — renseigné par le joueur. */
  setup: PlayerStat[];
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

/** État du partenariat dans le pipeline de suivi (public : pilote la vitrine). */
export type SponsorStatus = 'prospect' | 'contact' | 'negociation' | 'actif' | 'pause' | 'termine';

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
  /** État du pipeline — seuls les 'actif' apparaissent sur la vitrine. */
  status: SponsorStatus;
}

/** Suivi business d'un sponsor — table PRIVÉE (manager/admin uniquement). */
export interface SponsorTracking {
  sponsorId: string;
  /** Date ISO (jour). */
  contractStart?: string;
  contractEnd?: string;
  /** Valeur annuelle du contrat (€). */
  valueAnnual?: number;
  contactName?: string;
  contactEmail?: string;
  notes?: string;
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

/**
 * Paramètres visuels du TICKET d'un match (Studio Match). Enregistrés sur le
 * match, ils pilotent le rendu du ticket partout (calendrier + inventaire).
 * Tous optionnels : un champ vide = valeur par défaut de la DA béton/rouge.
 */
export interface TicketField {
  label: string;
  value: string;
}

/** Gabarit du ticket. classic = corps + talon simple ; boarding = billet typographique. */
export type TicketLayout = 'classic' | 'boarding';

// ── Éditeur canvas : document ticket en 2 panneaux (corps | talon) ──
// La césure entre les deux panneaux = la ligne de déchirure du calendrier.

export type TicketFont = 'display' | 'mono' | 'sans';
export type TicketAlign = 'left' | 'center' | 'right';

/** Ombre portée (dure ou floue, ou lueur) commune à tout élément. */
export interface TicketShadow {
  x: number;
  y: number;
  blur: number;
  color: string;
}

/** Rayons des 4 angles (px) — haut-gauche, haut-droit, bas-droit, bas-gauche. */
export interface TicketCorners {
  tl: number;
  tr: number;
  br: number;
  bl: number;
}

/** Type de foil (reflet métallique) applicable à n'importe quel élément. */
export type TicketFoilType = 'holo' | 'rainbow' | 'gold' | 'silver' | 'chrome' | 'gradient';

/** Foil par élément : reflet métallique/holographique paramétrable. */
export interface TicketFoil {
  type: TicketFoilType;
  /** Direction du reflet (deg). */
  angle?: number;
  /** Intensité / opacité du foil (0–1). */
  opacity?: number;
  /** Mode de fusion avec l'élément (défaut selon le type). */
  blend?: 'normal' | 'overlay' | 'screen' | 'color-dodge' | 'soft-light' | 'hard-light';
  /** Couleurs pour le type 'gradient'. */
  from?: string;
  to?: string;
}

interface TicketElBase {
  id: string;
  /** Position/taille en px, relatives au panneau. */
  x: number;
  y: number;
  w: number;
  h: number;
  rotate?: number;
  /** Opacité 0–1. */
  opacity?: number;
  /** Ombre portée / lueur. */
  shadow?: TicketShadow;
  /** Rayon uniforme des angles (px). Ignoré si `radii` est défini. */
  radius?: number;
  /** Rayons par angle (prime sur `radius`). */
  radii?: TicketCorners;
  /** Foil (reflet) appliqué à l'élément — texte métallique, forme holo, etc. */
  foil?: TicketFoil;
  /** Nom d'affichage dans le panneau de calques. */
  name?: string;
  /** Verrouillé : non sélectionnable/déplaçable sur le canvas. */
  locked?: boolean;
  /** Masqué : non rendu. */
  hidden?: boolean;
}
export interface TicketTextEl extends TicketElBase {
  type: 'text';
  /** Texte, avec tokens {opponent} {date} {time} {score} {competition} {gameTag} {serial} {brand} {access}. */
  text: string;
  font: TicketFont;
  size: number;
  weight: number;
  color: string;
  align: TicketAlign;
  italic?: boolean;
  /** Interlettrage px. */
  tracking?: number;
  uppercase?: boolean;
  /** Interligne (ratio). */
  lineHeight?: number;
  /** Contour de texte. */
  stroke?: TicketBorder;
  /** Surlignage (fond derrière le texte). */
  bg?: string;
  /** Padding interne quand bg défini. */
  padding?: number;
}
export interface TicketRectEl extends TicketElBase {
  type: 'rect';
  color: string;
  radius?: number;
  border?: TicketBorder;
}
export interface TicketImageEl extends TicketElBase {
  type: 'image';
  url: string;
  radius?: number;
  fit?: 'cover' | 'contain';
  border?: TicketBorder;
}
export interface TicketBarcodeEl extends TicketElBase {
  type: 'barcode';
  color: string;
}
export interface TicketQrEl extends TicketElBase {
  type: 'qr';
  color: string;
  /** Contenu encodé (URL/texte, tokens acceptés). Vide = numéro de série. */
  data?: string;
}

/** Variantes de forme vectorielle. 'path' = tracé libre éditable point par point. */
export type TicketShapeVariant =
  | 'rect' | 'ellipse' | 'triangle' | 'diamond' | 'pentagon' | 'hexagon' | 'star' | 'line' | 'polygon' | 'path';

/** Un point d'ancrage d'un tracé libre. */
export interface TicketPathPoint {
  /** Position relative à la boîte de l'élément (0–1). */
  x: number;
  y: number;
  /** Rayon d'arrondi du coin à ce point (px). Ignoré si point courbe (poignées). */
  r?: number;
  /** Poignée bézier entrante (position 0–1). Point courbe si `cIn`/`cOut` défini. */
  cIn?: { x: number; y: number };
  /** Poignée bézier sortante (position 0–1). */
  cOut?: { x: number; y: number };
}

/** Forme vectorielle (SVG) : pleine ou contour, épaisseur, foil, tracé éditable. */
export interface TicketShapeEl extends TicketElBase {
  type: 'shape';
  variant: TicketShapeVariant;
  /** Couleur de remplissage. Vide/undefined = contour seul (pas de fond). */
  fill?: string;
  /** Contour vectoriel (épaisseur + couleur). */
  stroke?: TicketBorder;
  /** Nb de branches (star) ou de côtés (polygon). */
  points?: number;
  /** Tracé libre (variant 'path') : points d'ancrage éditables. */
  path?: TicketPathPoint[];
  /** Tracé fermé (défaut true). Ouvert = polyligne. */
  closed?: boolean;
}
export type TicketEl = TicketTextEl | TicketRectEl | TicketImageEl | TicketBarcodeEl | TicketQrEl | TicketShapeEl;

export type TicketPattern = 'none' | 'checker' | 'dots' | 'hazard' | 'holo';

export interface TicketGradient {
  from: string;
  to: string;
  /** Angle du dégradé (deg). */
  angle: number;
}

export interface TicketBorder {
  width: number;
  color: string;
}

/** Un panneau (corps OU talon) — entièrement personnalisable séparément. */
export interface TicketPanel {
  /** Couleur de fond du panneau (hex). */
  bg: string;
  /** Dégradé de fond (remplace la couleur unie si défini). */
  gradient?: TicketGradient;
  /** Image de fond (URL) — recouvre couleur/dégradé. */
  bgImage?: string;
  /** Motif en surimpression du fond. */
  pattern?: TicketPattern;
  patternColor?: string;
  /** Opacité du motif (0–1). */
  patternOpacity?: number;
  /** Direction du motif (deg) — foil/holo/hazard directionnels. Défaut 115. */
  patternAngle?: number;
  /** Rayon des angles extérieurs de CE panneau (px). Défaut : radius du doc. */
  radius?: number;
  /** Rayons par angle de CE panneau (prime sur `radius`/doc). */
  radii?: TicketCorners;
  /** Bordure interne de CE panneau. */
  border?: TicketBorder;
  elements: TicketEl[];
}

/** Document ticket complet (éditeur canvas). Rendu à l'identique partout. */
export interface TicketDoc {
  /** Dimensions totales du ticket (px). */
  width: number;
  height: number;
  /** Rayon des angles extérieurs (px). */
  radius: number;
  /** Largeur du panneau talon (droite) — la césure est à width-stubWidth. */
  stubWidth: number;
  /** Perforation sur la césure. */
  seam?: 'dots' | 'none';
  body: TicketPanel;
  stub: TicketPanel;
}

/** Template de ticket réutilisable (bibliothèque du Studio Match). */
export interface TicketTemplate {
  id: string;
  name: string;
  doc: TicketDoc;
  createdAt: string;
}

export interface MatchTicket {
  /** Gabarit. Défaut : 'classic'. */
  layout?: TicketLayout;
  /** Fond du corps du ticket (hex). Défaut : béton clair. */
  bodyColor?: string;
  /** Fond du talon (hex). Défaut : rouge accent. */
  stubColor?: string;
  /** Couleur d'accent (chips/highlights). Défaut : = stubColor. */
  accentColor?: string;
  /** Couleur du texte sur le corps (hex). */
  inkColor?: string;
  /** Couleur du texte sur le talon (hex). */
  stubInkColor?: string;
  /** Image de fond du corps (URL) — recouvre bodyColor. */
  background?: string;
  /** Petit libellé d'édition en tête (ex. "SAISON 2026"). */
  edition?: string;
  /** Gros texte typographique (boarding). Défaut : nom de l'adversaire. */
  bigText?: string;
  /** Grille de données (GATE/2, ROW/11…). Vide = dérivée du match. */
  fields?: TicketField[];
  /** Texte du haut du talon. Défaut : "ADMIT ONE". */
  stubText?: string;
  /** Numéro de série affiché sur le talon. Défaut : dérivé de l'id. */
  serial?: string;
  /** Afficher le code-barres. Défaut : true. */
  showBarcode?: boolean;
  /** Afficher un QR décoratif. */
  showQr?: boolean;
  /** Afficher une bande damier. */
  showChecker?: boolean;
  /** Finition holographique (sheen irisé) sur la bande d'art. */
  holo?: boolean;
  /** Tampon diagonal en surimpression (ex. "VIP", "SOLD OUT"). */
  stamp?: string;
  /** Document éditeur canvas. Si présent, prime sur les params simples ci-dessus. */
  doc?: TicketDoc;
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
  /** Paramètres du ticket (Studio Match) — pilote l'affichage du ticket. */
  ticket?: MatchTicket;
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
export type UserRole = 'admin' | 'manager' | 'coach' | 'joueur' | 'staff' | 'content' | 'graphiste' | 'member';

export interface Profile {
  id: string;
  role: UserRole;
  displayName?: string;
  /** Lie un compte joueur à sa fiche roster (players.id). */
  playerId?: string;
}


// ── Tournois organisés par la structure ────────────────────────────────
/**
 * ⚠ À ne pas confondre avec `Match` : `Match` = un match JOUÉ par l'équipe.
 * Ici, la structure ORGANISE l'événement et y accueille des équipes externes.
 *
 * Le modèle est générique : un seul jeu de types porte tous les formats.
 * `TournamentStage` permet d'enchaîner des phases (poules puis arbre), et
 * `nextMatchId`/`nextSlot` encodent l'arbre d'élimination.
 */
export type TournamentFormat = 'single_elim' | 'double_elim' | 'groups_bracket' | 'round_robin' | 'swiss';
export type TournamentStatus = 'draft' | 'registration' | 'running' | 'finished';
export type TournamentTeamStatus = 'registered' | 'checked_in' | 'eliminated' | 'winner';
export type TournamentStageKind = 'group' | 'bracket' | 'round_robin' | 'swiss';
/** Côté de l'arbre : loser/final ne servent qu'en double élimination. */
export type BracketSide = 'winner' | 'loser' | 'final';
export type TournamentMatchStatus = 'pending' | 'live' | 'finished';

export const TOURNAMENT_FORMATS: { id: TournamentFormat; label: string; hint: string }[] = [
  { id: 'single_elim', label: 'Élimination simple', hint: 'Une défaite et c\'est fini.' },
  { id: 'double_elim', label: 'Élimination double', hint: 'Arbre vainqueurs + arbre perdants.' },
  { id: 'groups_bracket', label: 'Poules puis arbre', hint: 'Phase de groupes, puis phase finale.' },
  { id: 'round_robin', label: 'Round robin', hint: 'Tout le monde affronte tout le monde.' },
  { id: 'swiss', label: 'Système suisse', hint: 'Appariement par score, sans élimination.' },
];

export interface TournamentPlayer {
  id: string;
  teamId: string;
  pseudo: string;
  role?: string;
  isCaptain: boolean;
  sortOrder: number;
}

export interface TournamentTeam {
  id: string;
  tournamentId: string;
  name: string;
  tag?: string;
  logoUrl?: string;
  color?: string;
  /** Tête de série (1 = meilleure). */
  seed?: number;
  status: TournamentTeamStatus;
  /** Classement final une fois le tournoi terminé. */
  placement?: number;
  /** Exclue du tournoi ENTIER (≠ DNF, qui ne vaut que pour un round). */
  disqualified: boolean;
  disqualifiedReason?: string;
  players: TournamentPlayer[];
}

export interface TournamentStage {
  id: string;
  tournamentId: string;
  kind: TournamentStageKind;
  name: string;
  sortOrder: number;
}

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  stageId?: string;
  bracket?: BracketSide;
  round: number;
  position: number;
  /** Poule d'appartenance (formats à groupes). */
  groupLabel?: string;
  teamAId?: string;
  teamBId?: string;
  scoreA?: number;
  scoreB?: number;
  winnerId?: string;
  /** Match où remonte le vainqueur, et dans quel slot. */
  nextMatchId?: string;
  nextSlot?: 'a' | 'b';
  /** Match où TOMBE le perdant (double élimination) et dans quel slot. */
  loserMatchId?: string;
  loserSlot?: 'a' | 'b';
  status: TournamentMatchStatus;
  scheduledAt?: string;
  streamUrl?: string;
}


/* ── Phase de groupes « The Finals » ─────────────────────────────────
   Un match oppose N équipes et c'est le PLACEMENT qui rapporte des points.
   Rien à voir avec le 1v1 de `TournamentMatch`, qui reste réservé aux
   playoffs : les deux cohabitent dans un même tournoi. */

/** Recomposition des lobbies entre deux rounds. */
export type ReseedMode =
  /** Groupes figés pour tout le tournoi. */
  | 'keep'
  /** Tirage, en évitant les adversaires déjà rencontrés. */
  | 'random'
  /** Par classement : les 1ers ensemble, les 2es ensemble… (type suisse). */
  | 'by_rank';

export const RESEED_MODES: { id: ReseedMode; label: string; hint: string }[] = [
  { id: 'keep', label: 'Groupes fixes', hint: 'Les mêmes lobbies à chaque round.' },
  { id: 'random', label: 'Tirage aléatoire', hint: 'Mélange à chaque round, en évitant les adversaires déjà croisés.' },
  { id: 'by_rank', label: 'Par classement (suisse)', hint: 'Les 1ers ensemble, les 2es ensemble, etc.' },
];

/** Une ligne du barème : tel placement rapporte tant de points. */
export interface PointRule {
  placement: number;
  points: number;
}

/** Barème par défaut d'un lobby à 4. */
export const DEFAULT_POINT_RULES: PointRule[] = [
  { placement: 1, points: 12 },
  { placement: 2, points: 8 },
  { placement: 3, points: 5 },
  { placement: 4, points: 2 },
];

export type LobbyStatus = 'pending' | 'live' | 'finished';

/** Participation d'une équipe à un lobby. */
export interface LobbyEntry {
  id: string;
  lobbyId: string;
  teamId: string;
  /** 1 = meilleur. Absent tant que le lobby n'est pas joué. */
  placement?: number;
  points: number;
  /** Abandon sur CE round. L'équipe reste dans le tournoi. */
  dnf: boolean;
  sortOrder: number;
}

/** Un lobby : N équipes dans un round donné. */
export interface TournamentLobby {
  id: string;
  tournamentId: string;
  round: number;
  position: number;
  label?: string;
  status: LobbyStatus;
  scheduledAt?: string;
  streamUrl?: string;
  entries: LobbyEntry[];
}

export interface Tournament {
  id: string;
  slug: string;
  name: string;
  gameId?: string;
  format: TournamentFormat;
  status: TournamentStatus;
  teamSize: number;
  maxTeams?: number;
  /** Format à poules : nombre de poules et qualifiés PAR poule. */
  groupCount: number;
  qualifiersPerGroup: number;
  /** Format de la phase finale, quand le tournoi en a une. */
  playoffFormat: 'single_elim' | 'double_elim';
  /** Phase de groupes à lobbies : nombre de rounds et taille des lobbies. */
  groupRounds: number;
  teamsPerLobby: number;
  /** Barème placement → points, librement éditable par l'organisateur. */
  pointRules: PointRule[];
  reseedMode: ReseedMode;
  prize?: string;
  rules?: string;
  description?: string;
  coverUrl?: string;
  startsAt?: string;
  endsAt?: string;
}

/** Tournoi + tout son contenu, pour la page de détail. */
export interface TournamentFull extends Tournament {
  teams: TournamentTeam[];
  stages: TournamentStage[];
  /** Playoffs, en 1v1. */
  matches: TournamentMatch[];
  /** Phase de groupes, en lobbies à N équipes. */
  lobbies: TournamentLobby[];
}

// ── Identité de marque ─────────────────────────────────────────────────
/**
 * Réglages de marque, ligne UNIQUE en base (`brand_settings`). Remplace le
 * placeholder `__BRAND__` qui était codé en dur dans la vitrine, le manager et
 * les tickets : le nom et les logos se changent désormais sans recompiler.
 * Le manager écrit, la vitrine et le studio réseaux lisent.
 */
export interface BrandSettings {
  /** Nom complet affiché (titres, pied de page, légendes). */
  name: string;
  /** Nom court / trigramme pour les espaces contraints. */
  shortName: string;
  /** Logo horizontal (URL publique). Absent → repli sur le nom en typo display. */
  logoUrl?: string;
  /** Monogramme carré (favicon, pastille, badge). Absent → repli sur shortName. */
  markUrl?: string;
  /** Couleur d'accent de la marque (hex). */
  accent: string;
  tagline?: string;
  /** Handle réseaux commun, sans le @ (ex. « lignezero »). */
  handle?: string;
}

/** Valeurs de secours si la table n'a pas encore été renseignée. */
export const DEFAULT_BRAND: BrandSettings = {
  name: 'LIGNE ZERO',
  shortName: 'LZ',
  accent: '#f23127',
};

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
  /** Renvoie à un checkpoint précis d'une revue vidéo (auto-créé depuis la revue). */
  reviewId?: string;
  timestampSec?: number;
  createdAt: string;
}

export type SessionKind = 'scrim' | 'practice' | 'review' | 'tournament' | 'meeting' | 'event' | 'tryout';

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
  /** Campagne de tryout liée — requis seulement si kind='tryout'. */
  campaignId?: string;
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

/** Revue vidéo : un VOD (YouTube/Twitch/autre) sur lequel le staff pose des annotations. */
export interface VideoReview {
  id: string;
  title: string;
  videoUrl: string;
  /** Jeu concerné (optionnel). */
  gameId?: string;
  /** Session de revue liée (calendrier), optionnelle. */
  sessionId?: string;
  /** Match précis auquel cette revue se rapporte (hub match), optionnel. */
  matchId?: string;
  createdAt: string;
}

/** Checkpoint horodaté sur une VideoReview. Sans playerId = remarque pour toute l'équipe. */
export interface VideoAnnotation {
  id: string;
  reviewId: string;
  /** Instant dans la vidéo, en secondes. */
  timestampSec: number;
  tag: string;
  description: string;
  playerId?: string;
  createdAt: string;
}

/** Stats d'un joueur pour un match précis (hub match) — même forme que PlayerStat. */
export interface MatchPlayerStat {
  id: string;
  matchId: string;
  playerId: string;
  stats: PlayerStat[];
}

/** Objet d'inventaire membre. Attribué par un bot Twitch/Discord externe (lecture seule côté site). */
export type InventoryItemKind = 'ticket' | 'cartouche' | 'special';

export interface InventoryItem {
  id: string;
  ownerId: string;
  kind: InventoryItemKind;
  name: string;
  description?: string;
  image?: string;
  /** Origine du drop (ex. 'twitch', 'discord', 'manuel'). */
  source?: string;
  /** Lien externe porté par l'objet (ex. URL du clip Twitch pour une cartouche). */
  link?: string;
  /** Match lié (si l'objet est un ticket de match) → rendu via ses params. */
  matchId?: string;
  obtainedAt: string;
}

/** Match marqué favori par un membre (auto-service). */
export interface FavoriteMatch {
  ownerId: string;
  matchId: string;
}

/** Comptes externes liés (pour que le bot de drops retrouve le bon membre). */
export interface MemberLinks {
  ownerId: string;
  discordHandle?: string;
  twitchHandle?: string;
  /** Id numérique Twitch (rempli par la liaison OAuth — fiable, insensible au renommage). */
  twitchUserId?: string;
  /** Id Discord (snowflake) — rempli par la liaison OAuth, sert au bot Discord. */
  discordUserId?: string;
}

// ── Bot Twitch/Discord ─────────────────────────────────────────────

/**
 * Clés des features activables/désactivables du bot (un bouton chacune).
 * Le manager pilote `BotConfig.features` (map clé→bool). Défaut = activé
 * sauf indication contraire côté bot.
 */
export type BotFeatureKey =
  | 'tickets'        // !ticket → drop du ticket de match
  | 'clips'          // clip Twitch → cartouche d'inventaire
  | 'customCommands' // commandes personnalisées (bot_commands)
  | 'points'         // système de points de fidélité
  | 'minigames'      // !gamble, !duel, !slots (jouer ses points)
  | 'ranks'          // paliers de fidélité (!rank)
  | 'watchtime'      // temps de visionnage (!watchtime)
  | 'shop'           // boutique : dépenser les points (!rewards/!redeem)
  | 'alerts'         // alertes follow/sub/raid/cheer → message + bonus points
  | 'predictions'    // paris de match (!predict) misant des points
  | 'shoutout'       // !so @user
  | 'raffle'         // tirage au sort (!raffle/!join/!draw)
  | 'poll'           // sondages (!poll/!vote)
  | 'timers'         // messages périodiques
  | 'quotes'         // citations (!quote)
  | 'fun'            // !dice, !flip, !8ball, !hug…
  | 'matchInfo'      // !match, !next, !score
  | 'roster'         // !roster, !lineup
  | 'uptime'         // !uptime
  | 'automod'        // filtrage liens/caps/mots interdits
  | 'greetings';     // accueil du premier message d'un viewer

/** Liste ordonnée des features (pour l'UI d'admin). */
export const BOT_FEATURES: { key: BotFeatureKey; label: string; desc: string }[] = [
  { key: 'tickets', label: 'Tickets (!ticket)', desc: 'Les spectateurs réclament leur ticket de match pendant le live.' },
  { key: 'clips', label: 'Clips → cartouche', desc: 'Un clip Twitch crée une cartouche dans l’inventaire du clippeur.' },
  { key: 'customCommands', label: 'Commandes custom', desc: 'Commandes de chat personnalisées, éditables par le staff.' },
  { key: 'points', label: 'Points de fidélité', desc: 'Les viewers gagnent des points en participant. !points, !leaderboard.' },
  { key: 'minigames', label: 'Minijeux', desc: 'Jouer ses points : !gamble, !duel, !slots.' },
  { key: 'ranks', label: 'Rangs de fidélité', desc: 'Paliers selon les points cumulés. !rank.' },
  { key: 'watchtime', label: 'Temps de visionnage', desc: 'Cumule le temps passé en live. !watchtime.' },
  { key: 'shop', label: 'Boutique de points', desc: 'Dépenser ses points contre des récompenses. !rewards, !redeem.' },
  { key: 'alerts', label: 'Alertes → évènement', desc: 'Follow/sub/raid/cheer → message configurable + bonus de points.' },
  { key: 'predictions', label: 'Prédictions / paris', desc: 'Les viewers misent des points sur l’issue du match. !predict.' },
  { key: 'shoutout', label: 'Shoutout (!so)', desc: 'Met en avant un autre streamer dans le chat.' },
  { key: 'raffle', label: 'Tirage au sort', desc: '!raffle démarre, !join pour participer, !draw tire un gagnant.' },
  { key: 'poll', label: 'Sondages', desc: '!poll lance un vote, !vote pour répondre.' },
  { key: 'timers', label: 'Messages périodiques', desc: 'Rappels automatiques postés à intervalle pendant le live.' },
  { key: 'quotes', label: 'Citations', desc: '!quote affiche une citation, le staff en ajoute.' },
  { key: 'fun', label: 'Commandes fun', desc: '!dice, !flip, !8ball, !hug, !love…' },
  { key: 'matchInfo', label: 'Infos match', desc: '!match, !next, !score depuis le calendrier.' },
  { key: 'roster', label: 'Roster', desc: '!roster, !lineup listent l’effectif.' },
  { key: 'uptime', label: 'Uptime', desc: '!uptime affiche depuis combien de temps le live tourne.' },
  { key: 'automod', label: 'Auto-modération', desc: 'Filtre liens non autorisés, majuscules excessives, mots interdits.' },
  { key: 'greetings', label: 'Accueil viewers', desc: 'Salue le premier message d’un spectateur dans la session.' },
];

/** Configuration unique du bot (éditée dans le manager, lue par le bot). */
export interface BotConfig {
  /** Chaîne Twitch écoutée (login, sans #). */
  twitchChannel?: string;
  /** Login du compte bot qui parle dans le chat. */
  twitchBotUsername?: string;
  /** Réponse quand un ticket est réclamé. Tokens {user} {match} {competition}. */
  claimMessage: string;
  /** Réponse quand le spectateur n'a pas lié son compte. Token {user}. */
  claimMessageUnlinked: string;
  /** !ticket actif (raccourci historique — miroir de features.tickets). */
  ticketsEnabled: boolean;
  /** Clip Twitch → cartouche d'inventaire actif (miroir de features.clips). */
  clipsEnabled: boolean;
  /** Passe le match du jour en statut 'live' quand le stream démarre. */
  autoSetLive: boolean;
  /** Nom donné aux cartouches créées depuis un clip. */
  cartridgeName: string;
  /** Anti-spam global (secondes) entre deux réponses du bot. */
  cooldownSec: number;
  /** Interrupteurs par feature (clé → activé). Absent = valeur par défaut du bot. */
  features: Partial<Record<BotFeatureKey, boolean>>;
  /** Lien d'invitation Discord (token {discord} des commandes). */
  discordInvite?: string;
  /** Nom d'affichage de la monnaie de points. */
  pointsName: string;
  /** Points gagnés par message (anti-spam intégré). */
  pointsPerMessage: number;
  /** Points bonus à la réclamation d'un ticket. */
  pointsPerClaim: number;
  // ── Bot Discord (token en .env ; le reste éditable ici) ──
  /** Serveur Discord ciblé (id). */
  discordGuildId?: string;
  /** Salon d'annonce des lives (id). */
  discordAnnounceChannelId?: string;
  /** Rôle attribué aux abonnés Twitch liés (id). */
  discordSubRoleId?: string;
  /** Message d'annonce de live. */
  discordLiveMessage: string;
  /** Annoncer les lives dans le salon. */
  discordAnnounce: boolean;
  /** Livrer les notifications membres en DM. */
  discordNotifications: boolean;
  /** Synchroniser le rôle abonné au sub Twitch. */
  discordSubRole: boolean;
  /** Préfixe des commandes texte Discord (ex. '!'). */
  discordPrefix: string;
  /** Active la lecture des messages (intent privilégié) → commandes préfixe. */
  discordMessageContent: boolean;
}

/** Type d'une commande Discord. 'builtin' = commande intégrée (logique réelle). */
export type DiscordCommandKind = 'slash' | 'prefix' | 'builtin';

/** Commande Discord personnalisée, gérée par le staff. */
export interface DiscordCommand {
  id: string;
  /** 'points' (slash) ou '!points' (prefix). */
  trigger: string;
  kind: DiscordCommandKind;
  /** Réponse. Tokens {user} {nextmatch} {score} {roster}. */
  response: string;
  /** Description (obligatoire pour une slash command). */
  description: string;
  enabled: boolean;
  /** Ids de salons où la commande est utilisable. Vide = tous les salons. */
  allowedChannels: string[];
  /** Rôle Discord requis (id). Vide = tout le monde. */
  minRoleId?: string;
  cooldownSec: number;
}

/** Où livrer une notification d'un type donné. */
export type DiscordRouteMode = 'dm' | 'channel' | 'off';

/** Routage d'un type de notification (feedback, annonce, scrim…). */
export interface DiscordRoute {
  /** feedback | objective | session | announcement | custom | clip. */
  kind: string;
  mode: DiscordRouteMode;
  /** Salon cible si mode = 'channel'. */
  channelId?: string;
}

/** Message périodique posté pendant le live. */
export interface BotTimer {
  id: string;
  label: string;
  message: string;
  intervalSec: number;
  enabled: boolean;
}

/** Citation mémorable. */
export interface BotQuote {
  id: number;
  text: string;
  addedBy?: string;
  createdAt: string;
}

/** Points de fidélité d'un spectateur Twitch. */
export interface ViewerPoints {
  twitchLogin: string;
  ownerId?: string;
  points: number;
  /** Temps de visionnage cumulé (minutes). */
  watchMinutes: number;
}

/** Récompense achetable avec des points (boutique). */
export type BotRewardKind = 'custom' | 'shoutout' | 'points_sink' | 'ticket';
export interface BotReward {
  id: string;
  name: string;
  description?: string;
  cost: number;
  kind: BotRewardKind;
  /** Données libres selon le type (ex. { message } pour shoutout). */
  payload?: Record<string, unknown>;
  /** Stock restant (undefined = illimité). */
  stock?: number;
  enabled: boolean;
  sortOrder: number;
}

/** Demande d'achat d'une récompense, à traiter par le staff. */
export type RedemptionStatus = 'pending' | 'fulfilled' | 'refunded';
export interface RewardRedemption {
  id: string;
  rewardId?: string;
  rewardName: string;
  twitchLogin: string;
  ownerId?: string;
  cost: number;
  status: RedemptionStatus;
  note?: string;
  createdAt: string;
  decidedAt?: string;
}

/** Type d'évènement Twitch déclenchant une alerte. */
export type AlertEventType = 'follow' | 'sub' | 'resub' | 'giftsub' | 'raid' | 'cheer';

/** Alerte configurable : message posté + bonus de points sur un évènement. */
export interface BotAlert {
  id: string;
  eventType: AlertEventType;
  enabled: boolean;
  /** Message (tokens {user} {amount} {months} {viewers}). */
  message: string;
  /** Points bonus offerts au déclencheur. */
  rewardPoints: number;
  /** Seuil minimal (bits, viewers de raid…) pour déclencher. */
  minAmount: number;
}

/** Prédiction / pari de match (les viewers misent des points). */
export type PredictionStatus = 'open' | 'locked' | 'resolved';
export interface MatchPrediction {
  id: string;
  matchId?: string;
  question: string;
  options: string[];
  status: PredictionStatus;
  /** Index de l'option gagnante une fois résolue. */
  winningOption?: number;
  createdAt: string;
}

/** Mise d'un viewer sur une prédiction. */
export interface PredictionBet {
  id: string;
  predictionId: string;
  twitchLogin: string;
  ownerId?: string;
  optionIndex: number;
  amount: number;
}

/** Agrégat public d'une prédiction (widget vitrine, sans exposer les parieurs). */
export interface PredictionTallyOption {
  index: number;
  label: string;
  bets: number;
  total: number;
}
export interface PredictionTally {
  id: string;
  question: string;
  status: PredictionStatus;
  winning: number | null;
  options: PredictionTallyOption[];
}

/** Notification destinée à un membre, livrée en DM par le bot Discord. */
export type NotificationStatus = 'pending' | 'delivered' | 'failed';
export interface BotNotification {
  id: string;
  ownerId?: string;
  playerId?: string;
  /** objective | feedback | session | custom. */
  kind: string;
  title: string;
  body?: string;
  status: NotificationStatus;
  createdAt: string;
}

/** Rôle Twitch minimum requis pour déclencher une commande. */
export type BotCommandRole = 'everyone' | 'sub' | 'vip' | 'mod' | 'broadcaster';

/** Commande de chat personnalisée, administrable par le staff. */
export interface BotCommand {
  id: string;
  /** Déclencheur, ex. '!discord'. */
  trigger: string;
  /** Réponse. Tokens {user} {discord} {nextmatch} {match} {competition}. */
  response: string;
  enabled: boolean;
  minRole: BotCommandRole;
  cooldownSec: number;
}

/** Entrée du journal d'activité du bot (drops, clips, erreurs, commandes). */
export interface BotEvent {
  id: number;
  /** ex. 'ticket_claim', 'ticket_unlinked', 'clip_cartridge', 'clip_unlinked', 'command', 'error'. */
  kind: string;
  twitchUser?: string;
  ownerId?: string;
  matchId?: string;
  detail?: unknown;
  createdAt: string;
}

export type StratToolKind = 'arrow' | 'line' | 'circle' | 'rect' | 'text' | 'agent' | 'icon';

/**
 * Un objet posé sur le plan tactique d'une strat (flèche, forme, agent en
 * position, icône de compétence…). `points` porte les coordonnées selon
 * `kind` : arrow/line → paire(s) [x1,y1,x2,y2,...] ; sinon un seul point
 * [x,y] d'ancrage. Forme/taille des `icon` toujours résolues en live depuis
 * ValorantAbility (pas figées à la pose) pour rester à jour après un patch note.
 */
/** Position d'un objet à un instant donné de la timeline (secondes). `points`
 * a la même forme que StratBoardObject.points (paires pour arrow/line, [x,y]
 * sinon). Trié par `t` croissant. */
export interface StratKeyframe {
  t: number;
  points: number[];
}

export interface StratBoardObject {
  id: string;
  kind: StratToolKind;
  points: number[];
  color: string;
  /** circle : rayon. */
  radius?: number;
  /** rect : dimensions. */
  width?: number;
  height?: number;
  rotation?: number;
  /** text : contenu. */
  label?: string;
  /** agent uniquement : camp (teinte le marqueur). */
  side?: 'attack' | 'defense';
  /** agent/icon : référence dans le registre agents/compétences (Paramètres → Valoplant). */
  agentId?: string;
  /** icon uniquement (absent pour kind='agent'). */
  abilityId?: string;
  /** Trajectoire animée : ≥2 keyframes = l'objet se déplace quand on joue le plan. */
  keyframes?: StratKeyframe[];
}

/** Entrée de bibliothèque de strats/executes, taguée par jeu/map. */
export interface Strat {
  id: string;
  title: string;
  gameId?: string;
  /** Nom de la map — résout l'image de fond via ValorantMap.name (Paramètres → Valoplant). */
  map?: string;
  description: string;
  tags: string[];
  /** Renvoie vers un instant précis d'une revue vidéo (démonstration). */
  reviewId?: string;
  timestampSec?: number;
  createdAt: string;
  /** Objets dessinés sur le plan tactique. */
  board?: StratBoardObject[];
}

// ── Valoplant (paramètres du plan tactique : maps, agents, compétences) ──

/** Une map jouable, avec son image de fond réutilisable par toutes les strats qui la référencent. */
export interface ValorantMap {
  id: string;
  name: string;
  /** Upload staff (jamais un asset officiel embarqué dans le code). */
  image?: string;
  createdAt: string;
}

export type AgentClass = 'duelist' | 'initiator' | 'controller' | 'sentinel';

export interface ValorantAgent {
  id: string;
  name: string;
  cls: AgentClass;
  /** Portrait/icône uploadé (staff) — jamais un asset officiel embarqué. */
  image?: string;
  createdAt: string;
}

export type AbilityCategory =
  | 'smoke'
  | 'flash'
  | 'molotov'
  | 'wall'
  | 'trap'
  | 'heal'
  | 'recon'
  | 'dash'
  | 'stun'
  | 'shield'
  | 'decoy'
  | 'ultimate'
  | 'other';

/**
 * Forme dessinée sur le plan tactique. Les champs `radius`/`width`/`length`
 * sont réinterprétés selon la forme (pour rester recalibrables à chaque
 * patch note sans faire exploser le schéma en colonnes spécifiques) :
 * - circle : `radius` (px), width/length ignorés.
 * - rect   : `width` × `length` (px), rectangle centré sur le point posé.
 * - line   : `length` = longueur du trait (px), `width` = épaisseur (px).
 * - cone   : `length` = portée/rayon (px), `width` = angle d'ouverture (degrés).
 */
export type AbilityShape = 'circle' | 'rect' | 'line' | 'cone';

export interface ValorantAbility {
  id: string;
  agentId: string;
  slot: 'C' | 'Q' | 'E' | 'X';
  name: string;
  category: AbilityCategory;
  shape: AbilityShape;
  radius: number;
  width: number;
  length: number;
  /** Icône uploadée (staff) — si présente, remplace le glyphe générique par catégorie. */
  image?: string;
  createdAt: string;
}

// ── Studio graphique (demandes de visuels traitées par les graphistes) ──

export type DesignKind = 'reseaux' | 'maillot' | 'overlay' | 'print' | 'logo' | 'autre';
export type DesignStatus = 'todo' | 'doing' | 'review' | 'done';

export interface DesignRequest {
  id: string;
  title: string;
  /** Brief / consignes. */
  brief?: string;
  kind: DesignKind;
  status: DesignStatus;
  /** Échéance (date ISO jour). */
  due?: string;
  /** Lien vers le livrable (Drive, Figma, export…). */
  assetUrl?: string;
  createdAt: string;
}

// ── Recrutement / tryouts ─────────────────────────────────────────────

export type TryoutCampaignStatus = 'ouverte' | 'fermee' | 'archivee';

export interface TryoutCampaign {
  id: string;
  title: string;
  gameId?: string;
  /** Poste recherché (libre, ex. "Duelist", "IGL"). */
  roleSought?: string;
  description?: string;
  /** Fenêtre de la campagne (dates ISO jour). */
  opensAt?: string;
  closesAt?: string;
  status: TryoutCampaignStatus;
  createdAt: string;
}

export type CandidateStatus = 'nouveau' | 'en_evaluation' | 'liste_attente' | 'accepte' | 'refuse';

export interface Candidate {
  id: string;
  campaignId: string;
  pseudo: string;
  firstName?: string;
  lastName?: string;
  discord?: string;
  email?: string;
  roleApplied?: string;
  rankCurrent?: string;
  /** Note interne libre (staff uniquement, distincte des évaluations notées). */
  notes?: string;
  status: CandidateStatus;
  /** Jeton opaque du lien public `/tryout/:token` — jamais généré côté client. */
  publicToken: string;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  /** Fiche joueur créée automatiquement quand le candidat passe 'accepte' (players.id). */
  convertedPlayerId?: string;
}

export type CandidateRecommendation = 'oui' | 'non' | 'mitige';

/** Avis noté d'un joueur/coach/staff sur un candidat en tryout. Un seul par (candidat, auteur). */
export interface CandidateEvaluation {
  id: string;
  candidateId: string;
  /** Auteur (profiles.id). */
  authorId: string;
  /** Note 1 à 5. */
  rating: number;
  recommendation: CandidateRecommendation;
  body: string;
  createdAt: string;
}

/**
 * Créneau de dispo d'un candidat — même forme que Availability mais pool séparé
 * (saisi via le lien public par jeton, jamais par un compte staff).
 */
export interface CandidateAvailability {
  id: string;
  candidateId: string;
  /** Jour (date ISO). */
  day: string;
  /** Heure de début 'HH:MM'. */
  startTime: string;
  /** Heure de fin 'HH:MM'. */
  endTime: string;
}

export type CandidateSessionStatus = 'invite' | 'confirme' | 'absent';

/** Lien entre une pracc de tryout (Session) et les candidats invités. */
export interface SessionCandidate {
  sessionId: string;
  candidateId: string;
  status: CandidateSessionStatus;
}

// ── Finance (accès CEO/admin uniquement — RLS stricte) ──

export type TransactionKind = 'depense' | 'revenu';

export interface Transaction {
  id: string;
  kind: TransactionKind;
  /** Catégorie libre (Sponsoring, Salaires, Déplacements, Merch…). */
  category: string;
  label: string;
  /** Montant positif (€) — le sens vient de `kind`. */
  amount: number;
  /** Date de la transaction (ISO jour). */
  date: string;
  /** Sponsor lié (revenus de sponsoring). */
  sponsorId?: string;
  notes?: string;
}
