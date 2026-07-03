import type { AbilityCategory } from '@lignezero/types';

/** Couleur + libellé par catégorie de compétence — partagés entre le picker HTML et le rendu Konva. */
export const CATEGORY_COLOR: Record<AbilityCategory, string> = {
  smoke: '#9aa0a8',
  flash: '#ffd23f',
  molotov: '#f2632c',
  wall: '#8c6b4f',
  trap: '#c73aa8',
  heal: '#37c26d',
  recon: '#38bdf8',
  dash: '#a78bfa',
  stun: '#facc15',
  shield: '#60a5fa',
  decoy: '#94a3b8',
  ultimate: '#f23127',
  other: '#cbd5e1',
};

export const CATEGORY_LABEL: Record<AbilityCategory, string> = {
  smoke: 'Smoke',
  flash: 'Flash',
  molotov: 'Molotov / feu',
  wall: 'Mur',
  trap: 'Piège',
  heal: 'Soin',
  recon: 'Recon',
  dash: 'Déplacement',
  stun: 'Stun',
  shield: 'Bouclier',
  decoy: 'Leurre',
  ultimate: 'Ultime',
  other: 'Autre',
};

export const ALL_CATEGORIES = Object.keys(CATEGORY_LABEL) as AbilityCategory[];
