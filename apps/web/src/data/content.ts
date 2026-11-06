/**
 * Contenu unique partagé par les 3 directions artistiques.
 * Même matière, trois mises en scène : c'est la DA qu'on compare, pas le texte.
 * Branchable sur Supabase plus tard sans toucher aux vues.
 */

export const brand = {
  name: 'LIGNEZERO',
  short: 'LZ',
  tagline: 'Structure esport française — THE FINALS',
  claim: 'Trois joueurs. Une ligne de conduite.',
  handle: '@lignezero',
  founded: 2024,
  city: 'Lyon, FR',
} as const;

export type Player = {
  pseudo: string;
  role: string;
  build: 'LIGHT' | 'MEDIUM' | 'HEAVY';
  number: string;
  since: string;
  stat: { label: string; value: string };
};

export const roster: Player[] = [
  {
    pseudo: 'ZENITH',
    role: 'Capitaine · Entrée',
    build: 'LIGHT',
    number: '01',
    since: '2024',
    stat: { label: 'Éliminations / match', value: '14.2' },
  },
  {
    pseudo: 'VORTEX',
    role: 'Contrôle · Objectif',
    build: 'MEDIUM',
    number: '02',
    since: '2024',
    stat: { label: 'Cashouts sécurisés', value: '186' },
  },
  {
    pseudo: 'HALO',
    role: 'Soutien · Anchor',
    build: 'HEAVY',
    number: '03',
    since: '2025',
    stat: { label: 'Revives / match', value: '7.8' },
  },
];

export const nextMatch = {
  competition: 'World Tour #4',
  stage: 'Quarts de finale',
  opponent: 'OBSIDIAN RUN',
  date: '2026-11-02T20:00:00+01:00',
  dateLabel: 'Dim. 02 nov.',
  timeLabel: '20:00',
  venue: 'Diffusé sur Twitch',
  mode: 'Tournament · 3v3v3',
} as const;

export const results = [
  { date: '19.10', competition: 'World Tour #4 — Groupes', opponent: 'NOVA SIEGE', score: '2 — 0', win: true },
  { date: '12.10', competition: 'Open Series FR', opponent: 'ATLAS NINE', score: '2 — 1', win: true },
  { date: '05.10', competition: 'World Tour #3 — Demi', opponent: 'KRYPT COLLECTIVE', score: '1 — 2', win: false },
  { date: '28.09', competition: 'Open Series FR', opponent: 'MIRAGE UNIT', score: '2 — 0', win: true },
] as const;

export const figures = [
  { value: 4, padTo: 2, label: 'Titres nationaux', note: 'depuis 2024', gauge: 0.44 },
  { value: 68, label: 'Matchs joués', note: 'saison 2026', gauge: 0.78 },
  { value: 71, suffix: '%', label: 'Taux de victoire', note: 'sur 68 matchs', gauge: 0.71 },
  { value: 12, suffix: 'k', label: 'Communauté', note: 'tous réseaux', gauge: 0.92 },
] as const;

export const partners = [
  { name: 'FORGE PERIPH', tier: 'Partenaire principal' },
  { name: 'NOCTAL ENERGY', tier: 'Nutrition' },
  { name: 'ATELIER 7', tier: 'Textile' },
  { name: 'RELAY HOST', tier: 'Infrastructure' },
] as const;

export const socials = [
  { label: 'Twitch', handle: '/lignezero', href: '#' },
  { label: 'X', handle: '@lignezero', href: '#' },
  { label: 'YouTube', handle: '/lignezero', href: '#' },
  { label: 'Discord', handle: 'rejoindre', href: '#' },
] as const;

/** Fil des derniers résultats + prochaine échéance, pour le bandeau défilant. */
export const tickerItems = [
  {
    text: `Prochain — ${brand.short} vs ${nextMatch.opponent} · ${nextMatch.dateLabel} ${nextMatch.timeLabel}`,
    tone: 'neutral' as const,
  },
  ...results.map((result) => ({
    text: `${result.win ? 'V' : 'D'} ${result.score} ${result.opponent} · ${result.competition}`,
    tone: (result.win ? 'win' : 'loss') as 'win' | 'loss',
  })),
  { text: `Saison 2026 · 71% de victoires sur 68 matchs`, tone: 'neutral' as const },
];
