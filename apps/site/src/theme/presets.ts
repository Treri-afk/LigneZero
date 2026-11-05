/**
 * Presets de couleurs — jeux de variables CSS nommés, applicables en un clic
 * depuis le ThemeTweaker. Les presets "builtin" sont figés dans ce fichier ;
 * les presets custom (enregistrés par l'utilisateur) vivent en localStorage.
 */

export type ThemeVar =
  | '--accent'
  | '--accent-2'
  | '--base-900'
  | '--base-800'
  | '--base-700'
  | '--base-600'
  | '--text'
  | '--text-dim'
  | '--text-mute'
  | '--concrete'
  | '--concrete-2'
  | '--paper'
  | '--ink'
  | '--signal-live'
  | '--signal-ok'
  | '--signal-warn'
  | '--line'
  | '--line-strong'
  | '--line-bright';

export type ThemeColors = Partial<Record<ThemeVar, string>>;

export interface ThemePreset {
  id: string;
  name: string;
  builtin?: boolean;
  colors: ThemeColors;
}

/** Palette actuelle de tokens.css — sert de point de retour "défaut". */
const BRUTALIST_ROUGE: ThemeColors = {
  '--accent': '#f23127',
  '--accent-2': '#e8e4da',
  '--base-900': '#121013',
  '--base-800': '#1a1715',
  '--base-700': '#242019',
  '--base-600': '#2f2a22',
  '--text': '#ece7dd',
  '--text-dim': '#948c7d',
  '--text-mute': '#635b4d',
  '--concrete': '#cfcabb',
  '--concrete-2': '#b8b2a2',
  '--paper': '#e8e4da',
  '--ink': '#0d0d0b',
  '--signal-live': '#f23127',
  '--signal-ok': '#b9b3a3',
  '--signal-warn': '#d8a43a',
  '--line': 'rgba(200, 190, 170, 0.10)',
  '--line-strong': 'rgba(205, 196, 178, 0.24)',
  '--line-bright': 'rgba(220, 212, 196, 0.46)',
};

/**
 * "Tech Grid" — d'après moodboard tech/cyberpunk grid : fond neutre clair
 * dominant, formes quasi-noir bleuté, accent rouge signal vif, traits
 * techniques fins. Garde un seul accent (doctrine DA du site).
 */
const TECH_GRID: ThemeColors = {
  '--accent': '#e63329',
  '--accent-2': '#e4e5e7',
  '--base-900': '#0b1220',
  '--base-800': '#10151f',
  '--base-700': '#171d29',
  '--base-600': '#1f2631',
  '--text': '#e7e8ea',
  '--text-dim': '#9aa0ab',
  '--text-mute': '#5b6270',
  '--concrete': '#e4e5e7',
  '--concrete-2': '#cfd0d2',
  '--paper': '#ededed',
  '--ink': '#0b1220',
  '--signal-live': '#e63329',
  '--signal-ok': '#9aa0ab',
  '--signal-warn': '#d8a43a',
  '--line': 'rgba(180, 190, 205, 0.12)',
  '--line-strong': 'rgba(190, 198, 212, 0.26)',
  '--line-bright': 'rgba(210, 216, 226, 0.48)',
};

/** Variante "Tech Grid" avec l'accent rose magenta de l'image 1 du moodboard. */
const TECH_GRID_MAGENTA: ThemeColors = {
  ...TECH_GRID,
  '--accent': '#e4157a',
  '--signal-live': '#e4157a',
};

/**
 * "Blueprint Clair" — inversion complète : fond blanc cassé, wireframe et
 * texte NOIR, accent rouge signal (réf. affiche DEEA). Le site bascule en
 * plan technique clair ; un seul accent, doctrine DA respectée.
 */
const BLUEPRINT_LIGHT: ThemeColors = {
  '--accent': '#e4231d',
  '--accent-2': '#e8e6e1',
  '--base-900': '#f3f2ef',
  '--base-800': '#ecebe6',
  '--base-700': '#e3e0da',
  '--base-600': '#d7d3cc',
  '--text': '#0d0d0b',
  '--text-dim': '#5a5852',
  '--text-mute': '#9a978f',
  '--concrete': '#e8e6e1',
  '--concrete-2': '#dcd9d2',
  '--paper': '#f3f2ef',
  '--ink': '#0d0d0b',
  '--signal-live': '#e4231d',
  '--signal-ok': '#6a6a64',
  '--signal-warn': '#c8891f',
  '--line': 'rgba(13, 13, 11, 0.10)',
  '--line-strong': 'rgba(13, 13, 11, 0.22)',
  '--line-bright': 'rgba(13, 13, 11, 0.42)',
};

export const BUILTIN_PRESETS: ThemePreset[] = [
  { id: 'brutalist-rouge', name: 'Brutalist Rouge (défaut)', builtin: true, colors: BRUTALIST_ROUGE },
  { id: 'blueprint-light', name: 'Blueprint Clair', builtin: true, colors: BLUEPRINT_LIGHT },
  { id: 'tech-grid', name: 'Tech Grid', builtin: true, colors: TECH_GRID },
  { id: 'tech-grid-magenta', name: 'Tech Grid — Magenta', builtin: true, colors: TECH_GRID_MAGENTA },
];

const CUSTOM_KEY = 'lz-theme-presets-custom';

export function loadCustomPresets(): ThemePreset[] {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveCustomPreset(name: string, colors: ThemeColors): ThemePreset {
  const preset: ThemePreset = {
    id: `custom-${Date.now().toString(36)}`,
    name,
    colors,
  };
  const all = [...loadCustomPresets(), preset];
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(all));
  return preset;
}

export function deleteCustomPreset(id: string): void {
  const all = loadCustomPresets().filter((p) => p.id !== id);
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(all));
}
