import { Circle, Group, Line, RegularPolygon, Ring, Star } from 'react-konva';
import type { AbilityCategory } from '@lignezero/types';
import { CATEGORY_COLOR } from '@/lib/abilityCategories';

/**
 * Glyphes GÉNÉRIQUES par catégorie de compétence — formes géométriques
 * originales (cercle, étoile, triangle…), jamais les icônes officielles Riot
 * (sous copyright). But : distinguer d'un coup d'œil "c'est un smoke / un
 * flash / un mur…" sans reproduire l'art d'un agent précis.
 */

/** Version HTML (inline SVG) — utilisée dans le sélecteur d'agent/compétence. */
export function AbilityGlyphHtml({ category, size = 20 }: { category: AbilityCategory; size?: number }) {
  const c = CATEGORY_COLOR[category];
  const s = size;
  const mid = s / 2;
  switch (category) {
    case 'smoke':
    case 'decoy':
      return (
        <svg width={s} height={s} viewBox="0 0 20 20">
          <circle cx={10} cy={10} r={7} fill="none" stroke={c} strokeWidth={2} strokeDasharray={category === 'decoy' ? '3 2' : undefined} />
        </svg>
      );
    case 'flash':
    case 'stun':
      return (
        <svg width={s} height={s} viewBox="0 0 20 20">
          <polygon points="10,1 12,8 19,8 13,12 15,19 10,14 5,19 7,12 1,8 8,8" fill={c} />
        </svg>
      );
    case 'molotov':
      return (
        <svg width={s} height={s} viewBox="0 0 20 20">
          <polygon points="10,2 17,17 3,17" fill={c} />
        </svg>
      );
    case 'wall':
    case 'shield':
      return (
        <svg width={s} height={s} viewBox="0 0 20 20">
          <rect x={3} y={5} width={14} height={10} rx={category === 'shield' ? 4 : 1} fill="none" stroke={c} strokeWidth={2} />
        </svg>
      );
    case 'trap':
      return (
        <svg width={s} height={s} viewBox="0 0 20 20">
          <polygon points="10,2 18,10 10,18 2,10" fill={c} />
        </svg>
      );
    case 'heal':
      return (
        <svg width={s} height={s} viewBox="0 0 20 20">
          <rect x={8.5} y={2} width={3} height={16} fill={c} />
          <rect x={2} y={8.5} width={16} height={3} fill={c} />
        </svg>
      );
    case 'recon':
      return (
        <svg width={s} height={s} viewBox="0 0 20 20">
          <ellipse cx={10} cy={10} rx={9} ry={5} fill="none" stroke={c} strokeWidth={2} />
          <circle cx={10} cy={10} r={2.5} fill={c} />
        </svg>
      );
    case 'dash':
      return (
        <svg width={s} height={s} viewBox="0 0 20 20">
          <polyline points="4,4 12,10 4,16" fill="none" stroke={c} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'ultimate':
      return (
        <svg width={s} height={s} viewBox="0 0 20 20">
          <polygon points="10,1 12.5,7.5 19,10 12.5,12.5 10,19 7.5,12.5 1,10 7.5,7.5" fill={c} />
        </svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 20 20">
          <circle cx={mid} cy={mid} r={6} fill={c} />
        </svg>
      );
  }
}

/** Version Konva — placée sur le canvas du plan tactique. */
export function AbilityGlyphKonva({ category, x, y, radius = 14 }: { category: AbilityCategory; x: number; y: number; radius?: number }) {
  const c = CATEGORY_COLOR[category];
  switch (category) {
    case 'smoke':
    case 'decoy':
      return <Ring x={x} y={y} innerRadius={radius - 3} outerRadius={radius} fill={c} opacity={0.85} />;
    case 'flash':
    case 'stun':
      return <Star x={x} y={y} numPoints={6} innerRadius={radius * 0.45} outerRadius={radius} fill={c} />;
    case 'molotov':
      return <RegularPolygon x={x} y={y} sides={3} radius={radius} fill={c} />;
    case 'wall':
    case 'shield':
      return <RegularPolygon x={x} y={y} sides={4} radius={radius} rotation={45} fill={c} />;
    case 'trap':
      return <RegularPolygon x={x} y={y} sides={4} radius={radius} fill={c} />;
    case 'heal':
      return (
        <Group x={x} y={y}>
          <Line points={[-radius, 0, radius, 0]} stroke={c} strokeWidth={4} />
          <Line points={[0, -radius, 0, radius]} stroke={c} strokeWidth={4} />
        </Group>
      );
    case 'recon':
      return <Circle x={x} y={y} radius={radius * 0.6} stroke={c} strokeWidth={2} fill="rgba(0,0,0,0.4)" />;
    case 'dash':
      return <RegularPolygon x={x} y={y} sides={3} radius={radius} rotation={90} fill={c} />;
    case 'ultimate':
      return <Star x={x} y={y} numPoints={5} innerRadius={radius * 0.5} outerRadius={radius} fill={c} />;
    default:
      return <Circle x={x} y={y} radius={radius * 0.7} fill={c} />;
  }
}
