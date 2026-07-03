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

/**
 * Calibrées sur public/models/jersey.glb à partir d'une coupe réelle du
 * maillage par bandes de hauteur (min/max x/z par tranche de y, cf. script
 * d'analyse). Ce modèle est un maillot "à plat" (torse ±0.5 en x jusqu'à
 * y≈0, ailes de manches déployées jusqu'à x≈±0.88 entre y≈0.1 et y≈0.9,
 * profondeur z quasi constante ±0.38→0.43 — donc surface globalement
 * plane, normales proches de ±z partout, pas de galbe manche prononcé).
 * À réajuster à l'œil si un patch flotte ou clippe (modifier ces valeurs
 * puis recharger /sponsors, HMR suffit).
 */
export const JERSEY_ANCHORS: JerseyAnchor[] = [
  { id: 'chest',      label: 'Torse — central',   position: [0, -0.05, 0.46],    normal: [0, 0, 1],   size: [0.4, 0.26], camDist: 1.5 },
  { id: 'sleeve-l',   label: 'Manche gauche',     position: [-0.7, 0.45, 0.32],  normal: [0, 0, 1],   size: [0.22, 0.2], camDist: 1.2 },
  { id: 'sleeve-r',   label: 'Manche droite',     position: [0.7, 0.45, 0.32],   normal: [0, 0, 1],   size: [0.22, 0.2], camDist: 1.2 },
  { id: 'chest-r',    label: 'Poitrine droite',   position: [0.24, 0.23, 0.44],  normal: [0, 0, 1],   size: [0.18, 0.16], camDist: 1.1 },
  { id: 'back-top',   label: 'Dos — haut',        position: [0, 0.1, -0.44],     normal: [0, 0, -1],  size: [0.42, 0.28], camDist: 1.5 },
  { id: 'back-low',   label: 'Dos — bas',         position: [0, -0.5, -0.44],    normal: [0, 0, -1],  size: [0.38, 0.26], camDist: 1.4 },
  { id: 'chest-l',    label: 'Poitrine gauche',   position: [-0.24, 0.23, 0.44], normal: [0, 0, 1],   size: [0.18, 0.16], camDist: 1.1 },
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
