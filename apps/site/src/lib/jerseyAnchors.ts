import type { Sponsor } from '@/types';

/**
 * Emplacements sponsors sur le maillot (repère LOCAL du modèle, géométrie
 * centrée — voir SponsorJersey). Chaque ancre porte sa position, sa normale
 * sortante (direction depuis laquelle la caméra vient se placer), la taille du
 * patch et la distance caméra en focus. Front = +z, dos = -z.
 *
 * Ordre = priorité d'attribution : le partenaire principal prend le torse,
 * les suivants remplissent manches/poitrine/dos. 100% data-driven côté sponsors
 * (aucun champ "emplacement" en base), l'attribution est calculée ici.
 */
export interface JerseyAnchor {
  id: string;
  /** Libellé humain de l'emplacement (rail + HUD). */
  label: string;
  /** Position sur la surface du maillot (repère local). */
  position: [number, number, number];
  /** Normale sortante (unitaire) — la caméra se place le long de cet axe. */
  normal: [number, number, number];
  /** Taille du patch [largeur, hauteur]. */
  size: [number, number];
  /** Distance caméra ↔ patch quand il est en focus (petit = zoom fort). */
  camDist: number;
}

/** Ancres du plus prestigieux (torse) au moins exposé (bas du dos). */
export const JERSEY_ANCHORS: JerseyAnchor[] = [
  { id: 'chest',      label: 'Torse — central',   position: [0, 0.12, 0.19],    normal: [0, 0, 1],  size: [1.15, 0.5], camDist: 1.9 },
  { id: 'sleeve-l',   label: 'Manche gauche',     position: [-1.16, 0.42, 0.19], normal: [-0.55, 0.05, 0.83], size: [0.42, 0.28], camDist: 1.4 },
  { id: 'sleeve-r',   label: 'Manche droite',     position: [1.16, 0.42, 0.19],  normal: [0.55, 0.05, 0.83],  size: [0.42, 0.28], camDist: 1.4 },
  { id: 'chest-r',    label: 'Poitrine droite',   position: [0.5, 0.5, 0.19],    normal: [0.18, 0.1, 0.98],   size: [0.38, 0.24], camDist: 1.3 },
  { id: 'back-top',   label: 'Dos — haut',        position: [0, 0.42, -0.19],    normal: [0, 0.05, -1],       size: [0.9, 0.32], camDist: 1.7 },
  { id: 'back-low',   label: 'Dos — bas',         position: [0, -0.5, -0.19],    normal: [0, -0.05, -1],      size: [0.8, 0.3], camDist: 1.6 },
  { id: 'chest-l',    label: 'Poitrine gauche',   position: [-0.5, 0.5, 0.19],   normal: [-0.18, 0.1, 0.98],  size: [0.38, 0.24], camDist: 1.3 },
];

export interface PlacedSponsor {
  sponsor: Sponsor;
  anchor: JerseyAnchor;
}

const TIER_RANK: Record<Sponsor['tier'], number> = {
  principal: 0,
  officiel: 1,
  technique: 2,
};

/**
 * Attribue chaque sponsor à un emplacement du maillot. Tri par palier
 * (principal d'abord) → les ancres les plus visibles vont aux plus gros
 * partenaires. Si plus de sponsors que d'ancres, on boucle (rare).
 */
export function placeSponsors(sponsors: Sponsor[]): PlacedSponsor[] {
  const ordered = [...sponsors].sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier]);
  return ordered.map((sponsor, i) => ({
    sponsor,
    anchor: JERSEY_ANCHORS[i % JERSEY_ANCHORS.length],
  }));
}
