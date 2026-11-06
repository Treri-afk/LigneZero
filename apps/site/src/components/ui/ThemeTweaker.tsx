import { useEffect, useState } from 'react';
import {
  BUILTIN_PRESETS,
  deleteCustomPreset,
  loadCustomPresets,
  saveCustomPreset,
  type ThemeColors,
  type ThemePreset,
} from '@/theme/presets';

/** Variables couleur tweakables (toutes définies dans theme/tokens.css). */
const GROUPS: { title: string; vars: { v: string; label: string }[] }[] = [
  {
    title: 'Accents',
    vars: [
      { v: '--accent', label: 'Accent' },
      { v: '--accent-2', label: 'Accent 2' },
    ],
  },
  {
    title: 'Fonds',
    vars: [
      { v: '--base-900', label: 'Fond 900' },
      { v: '--base-800', label: 'Fond 800' },
      { v: '--base-700', label: 'Fond 700' },
      { v: '--base-600', label: 'Fond 600' },
    ],
  },
  {
    title: 'Texte',
    vars: [
      { v: '--text', label: 'Texte' },
      { v: '--text-dim', label: 'Texte dim' },
      { v: '--text-mute', label: 'Texte mute' },
    ],
  },
  {
    title: 'Surfaces claires',
    vars: [
      { v: '--concrete', label: 'Béton' },
      { v: '--paper', label: 'Papier' },
      { v: '--ink', label: 'Encre' },
    ],
  },
  {
    title: 'Statuts',
    vars: [
      { v: '--signal-live', label: 'Live' },
      { v: '--signal-ok', label: 'OK' },
      { v: '--signal-warn', label: 'Warn' },
    ],
  },
];

const KEY = 'lz-theme-overrides';
const ALL = GROUPS.flatMap((g) => g.vars.map((x) => x.v));

function readVar(v: string): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  return raw.startsWith('#') ? (raw.length === 4 ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}` : raw) : '#000000';
}

/**
 * Tweaker de thème : overlay global qui modifie les variables couleur du site
 * en direct (roue chromatique native au clic), persisté en localStorage.
 */
export function ThemeTweaker() {
  const [open, setOpen] = useState(false);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [customPresets, setCustomPresets] = useState<ThemePreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [presetName, setPresetName] = useState('');

  const presets = [...BUILTIN_PRESETS, ...customPresets];

  // Bascule la classe `theme-light` selon la luminance du fond → permet à la
  // CSS de neutraliser les textures cockpit sombres (scanlines) en thème clair.
  const syncThemeMode = () => {
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--base-900').trim();
    const m = bg.match(/^#?([0-9a-fA-F]{6})$/);
    let light = false;
    if (m) {
      const n = parseInt(m[1], 16);
      light = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) > 150;
    }
    document.documentElement.classList.toggle('theme-light', light);
  };

  // charge les overrides sauvegardés (toutes vars, y compris hors panneau) + presets custom
  useEffect(() => {
    const saved: Record<string, string> = JSON.parse(localStorage.getItem(KEY) || '{}');
    for (const [v, val] of Object.entries(saved)) {
      document.documentElement.style.setProperty(v, val);
    }
    const init: Record<string, string> = {};
    for (const v of ALL) init[v] = saved[v] ?? readVar(v);
    setVals(init);
    setCustomPresets(loadCustomPresets());
    syncThemeMode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setColor = (v: string, val: string) => {
    document.documentElement.style.setProperty(v, val);
    const next = { ...vals, [v]: val };
    setVals(next);
    const overrides = { ...JSON.parse(localStorage.getItem(KEY) || '{}'), [v]: val };
    localStorage.setItem(KEY, JSON.stringify(overrides));
    setActivePresetId(null);
    syncThemeMode();
  };

  const reset = () => {
    for (const v of ALL) document.documentElement.style.removeProperty(v);
    localStorage.removeItem(KEY);
    const init: Record<string, string> = {};
    for (const v of ALL) init[v] = readVar(v);
    setVals(init);
    setActivePresetId(null);
    syncThemeMode();
  };

  const applyPreset = (preset: ThemePreset) => {
    const overrides = { ...JSON.parse(localStorage.getItem(KEY) || '{}'), ...preset.colors };
    for (const [v, val] of Object.entries(preset.colors)) {
      document.documentElement.style.setProperty(v, val as string);
    }
    localStorage.setItem(KEY, JSON.stringify(overrides));
    const init = { ...vals };
    for (const v of ALL) if (preset.colors[v as keyof ThemeColors]) init[v] = preset.colors[v as keyof ThemeColors]!;
    setVals(init);
    setActivePresetId(preset.id);
    syncThemeMode();
  };

  const saveAsPreset = () => {
    const name = presetName.trim();
    if (!name) return;
    const colors: ThemeColors = {};
    for (const v of ALL) colors[v as keyof ThemeColors] = vals[v];
    const preset = saveCustomPreset(name, colors);
    setCustomPresets(loadCustomPresets());
    setActivePresetId(preset.id);
    setPresetName('');
  };

  const removePreset = (id: string) => {
    deleteCustomPreset(id);
    setCustomPresets(loadCustomPresets());
    if (activePresetId === id) setActivePresetId(null);
  };

  const copy = () => {
    const css = ALL.map((v) => `  ${v}: ${vals[v]};`).join('\n');
    navigator.clipboard?.writeText(`:root {\n${css}\n}`);
  };

  return (
    <div className="theme-tweaker fixed bottom-4 left-4 z-[130]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-11 items-center justify-center border-2 border-accent bg-base-900 text-lg shadow-ink"
        aria-label="Tweaker de couleurs"
        title="Tweaker de couleurs"
      >
        🎨
      </button>

      {open && (
        <div className="mt-2 max-h-[70vh] w-64 overflow-y-auto border-2 border-line-strong bg-base-900/95 p-3 shadow-ink backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between">
            <p className="hud-label text-[10px]">[ THEME ]</p>
            <div className="flex gap-2">
              <button type="button" onClick={copy} className="font-mono text-[9px] uppercase tracking-hud text-[color:var(--text-dim)] hover:text-accent" title="Copier le CSS">CSS</button>
              <button type="button" onClick={reset} className="font-mono text-[9px] uppercase tracking-hud text-[color:var(--text-dim)] hover:text-accent">RESET</button>
            </div>
          </div>

          <div className="mb-3 border-b border-line pb-3">
            <p className="mb-1.5 font-mono text-[8px] uppercase tracking-hud text-[color:var(--text-mute)]">Presets</p>
            <div className="space-y-1">
              {presets.map((p) => (
                <div key={p.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`flex-1 truncate border px-1.5 py-1 text-left font-mono text-[9px] uppercase tracking-hud ${
                      activePresetId === p.id
                        ? 'border-accent text-accent'
                        : 'border-line-strong text-[color:var(--text-dim)] hover:border-accent hover:text-accent'
                    }`}
                    title={p.name}
                  >
                    {p.name}
                  </button>
                  {!p.builtin && (
                    <button
                      type="button"
                      onClick={() => removePreset(p.id)}
                      className="font-mono text-[9px] text-[color:var(--text-mute)] hover:text-accent"
                      title="Supprimer ce preset"
                      aria-label="Supprimer ce preset"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-1">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Nom du preset"
                className="min-w-0 flex-1 border border-line-strong bg-transparent px-1.5 py-1 font-mono text-[9px] text-[color:var(--text)] placeholder:text-[color:var(--text-mute)]"
              />
              <button
                type="button"
                onClick={saveAsPreset}
                disabled={!presetName.trim()}
                className="border border-line-strong px-1.5 py-1 font-mono text-[9px] uppercase tracking-hud text-[color:var(--text-dim)] hover:border-accent hover:text-accent disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>

          {GROUPS.map((g) => (
            <div key={g.title} className="mb-3">
              <p className="mb-1.5 font-mono text-[8px] uppercase tracking-hud text-[color:var(--text-mute)]">{g.title}</p>
              <div className="space-y-1.5">
                {g.vars.map(({ v, label }) => (
                  <label key={v} className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-dim)]">{label}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[9px] text-[color:var(--text-mute)]">{vals[v]}</span>
                      <input
                        type="color"
                        value={vals[v] ?? '#000000'}
                        onChange={(e) => setColor(v, e.target.value)}
                        className="h-6 w-8 cursor-pointer border border-line-strong bg-transparent p-0"
                      />
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
