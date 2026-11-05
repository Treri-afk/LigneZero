import type { Config } from 'tailwindcss';

/**
 * Design tokens — source unique pour le styling utilitaire.
 * Les COULEURS pointent vers des CSS vars (theme/tokens.css) pour un re-skin
 * sans rebuild : change la valeur dans tokens.css, tout suit.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          900: 'var(--base-900)', // near-black
          800: 'var(--base-800)',
          700: 'var(--base-700)', // anthracite
          600: 'var(--base-600)', // facettes/biseaux
        },
        accent: {
          DEFAULT: 'var(--accent)',
          2: 'var(--accent-2)',
        },
        concrete: {
          DEFAULT: 'var(--concrete)',
          2: 'var(--concrete-2)',
        },
        paper: 'var(--paper)',
        ink: 'var(--ink)',
        signal: {
          live: 'var(--signal-live)',
          ok: 'var(--signal-ok)',
          warn: 'var(--signal-warn)',
        },
        line: {
          DEFAULT: 'var(--line)', // panel lining, gris froid translucide
          strong: 'var(--line-strong)',
          bright: 'var(--line-bright)',
        },
      },
      fontFamily: {
        display: ['Anton', 'Impact', 'sans-serif'], // titres massifs
        mono: ['"JetBrains Mono"', 'monospace'], // data / labels
        sans: ['Inter', 'system-ui', 'sans-serif'], // corps
      },
      letterSpacing: {
        hud: '0.18em',
        wide2: '0.32em',
      },
      boxShadow: {
        // BRUTALIST : ombres DURES (offset solide, profondeur sans glow)
        ink: '7px 7px 0 0 var(--base-900)',
        'ink-sm': '4px 4px 0 0 var(--base-900)',
        'ink-red': '7px 7px 0 0 var(--accent)',
        // surépaisseur de panneau : facette claire + ombre dure
        panel: 'inset 0 1px 0 0 var(--line-strong), 6px 6px 0 -1px rgba(0,0,0,0.55)',
        keycap: 'inset 0 1px 0 0 var(--line-strong), 0 6px 0 -1px var(--base-900)',
        'keycap-press': 'inset 0 1px 0 0 var(--line-strong), 0 2px 0 -1px var(--base-900)',
      },
      transitionDuration: {
        snap: '90ms', // feedback "clac" keycap
        ui: '220ms',
        boot: '600ms',
      },
      transitionTimingFunction: {
        mech: 'cubic-bezier(0.16, 1, 0.3, 1)', // décélération mécanique
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '92%': { opacity: '1' },
          '94%': { opacity: '0.7' },
          '96%': { opacity: '1' },
        },
        blink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        pulseLive: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 var(--accent-2)' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        scanline: 'scanline 6s linear infinite',
        flicker: 'flicker 4s linear infinite',
        blink: 'blink 1.1s step-end infinite',
        live: 'pulseLive 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
