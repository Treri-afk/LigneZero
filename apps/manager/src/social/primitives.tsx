import type { CSSProperties, ReactNode } from 'react';
import { studioBrand } from './brand';

/**
 * Primitives visuelles PARTAGÉES par tous les templates du studio réseaux.
 * Garder la DA cohérente (béton brutalist + rouge signal, ombres dures,
 * chanfreins, équerres HUD) : tout template compose ces briques plutôt que
 * de réinventer ses couleurs / bordures.
 *
 * Toutes les dimensions sont exprimées en unités `u` (= min(w,h)/100) pour
 * rester proportionnelles quel que soit le format d'export.
 */

export const C = {
  base900: '#121013',
  base800: '#1a1715',
  base700: '#242019',
  accent: '#f23127',
  concrete: '#cfcabb',
  paper: '#e8e4da',
  ink: '#0d0d0b',
  text: '#ece7dd',
  dim: '#948c7d',
  mute: '#635b4d',
  line: 'rgba(205,196,178,0.28)',
};

export const DISPLAY = "'Chakra Petch', sans-serif";
export const MONO = "'JetBrains Mono', monospace";

/** Unité de base d'un visuel (proportionnelle au plus petit côté). */
export const unit = (w: number, h: number) => Math.min(w, h) / 100;

/** Polygone chanfreiné (coins biseautés) — pas de border-radius dans la DA. */
export const CHAMFER = (r: number) =>
  `polygon(0 0, calc(100% - ${r}px) 0, 100% ${r}px, 100% 100%, ${r}px 100%, 0 calc(100% - ${r}px))`;

/** Mélange couleur → variante sombre (extrusion / fond). */
export const shade = (col: string, pct = 52) => `color-mix(in srgb, ${col} ${pct}%, #0a0a0c)`;
/** Mélange couleur → variante claire (highlight). */
export const tint = (col: string, pct = 72) => `color-mix(in srgb, ${col} ${pct}%, #ffffff)`;

/**
 * Silhouette générique (aucune photo). Retravaillée : dégradé vertical
 * clair→couleur, socle lumineux, liseré, pour ne plus faire « placeholder plat ».
 */
export function Silhouette({ color }: { color: string }) {
  const id = 'sil-' + color.replace(/[^a-z0-9]/gi, '');
  return (
    <svg viewBox="0 0 100 130" style={{ height: '100%', width: '100%' }} aria-hidden preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.55" stopColor={color} stopOpacity="0.9" />
          <stop offset="1" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
        <radialGradient id={`${id}-p`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* socle lumineux */}
      <ellipse cx="50" cy="122" rx="42" ry="8" fill={`url(#${id}-p)`} />
      {/* corps + tête avec liseré clair */}
      <path
        d="M12 130 Q14 76 50 74 Q86 76 88 130 Z"
        fill={`url(#${id}-g)`}
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="0.8"
      />
      <circle cx="50" cy="34" r="19" fill={`url(#${id}-g)`} stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
      {/* highlight de bord */}
      <path d="M12 130 Q14 76 50 74" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.4" />
    </svg>
  );
}

/**
 * Image (photo, logo, vignette) avec fallback. Pour l'export PNG, préférer une
 * image uploadée (dataURL) : les URLs distantes peuvent bloquer la capture
 * (CORS). Rendu `contain` par défaut.
 */
export function Photo({
  src,
  fallback,
  style,
  fit = 'contain',
  position = 'center',
}: {
  src?: string;
  fallback?: ReactNode;
  style?: CSSProperties;
  fit?: CSSProperties['objectFit'];
  position?: CSSProperties['objectPosition'];
}) {
  if (!src) return <>{fallback ?? null}</>;
  // eslint-disable-next-line jsx-a11y/alt-text
  return <img src={src} style={{ objectFit: fit, objectPosition: position, ...style }} />;
}

/** Pastille logo/monogramme : image si dispo, sinon initiales sur fond chanfreiné. */
export function LogoBadge({ u, src, name, size = 7, color = C.line }: { u: number; src?: string; name: string; size?: number; color?: string }) {
  const initials = name.replace(/[^a-zA-Z0-9]/g, ' ').trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div
      style={{
        width: u * size,
        height: u * size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.06)',
        border: `${u * 0.22}px solid ${color}`,
        clipPath: CHAMFER(u * 1),
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {src ? (
        <Photo src={src} fit="contain" style={{ width: '80%', height: '80%' }} />
      ) : (
        <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * size * 0.42, color: C.text }}>{initials || '—'}</span>
      )}
    </div>
  );
}

/** Équerre d'angle HUD (accent). */
export function Corner({ u, pos }: { u: number; pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const s = u * 5;
  const t = Math.max(2, u * 0.4);
  const style: CSSProperties = { position: 'absolute', width: s, height: s };
  if (pos.includes('t')) style.top = u * 3;
  else style.bottom = u * 3;
  if (pos.includes('l')) style.left = u * 3;
  else style.right = u * 3;
  const b = `${t}px solid ${C.accent}`;
  return (
    <div
      aria-hidden
      style={{
        ...style,
        borderTop: pos.includes('t') ? b : undefined,
        borderBottom: pos.includes('b') ? b : undefined,
        borderLeft: pos.includes('l') ? b : undefined,
        borderRight: pos.includes('r') ? b : undefined,
      }}
    />
  );
}

/** Les 4 équerres d'un coup. */
export function Corners({ u }: { u: number }) {
  return (
    <>
      <Corner u={u} pos="tl" />
      <Corner u={u} pos="tr" />
      <Corner u={u} pos="bl" />
      <Corner u={u} pos="br" />
    </>
  );
}

/** Trame dot-grid béton (fond). */
export function DotGrid({ u, opacity = 0.4 }: { u: number; opacity?: number }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `radial-gradient(${C.line} ${u * 0.16}px, transparent ${u * 0.16}px)`,
        backgroundSize: `${u * 4}px ${u * 4}px`,
        opacity,
      }}
    />
  );
}

/** Bande de danger diagonale (hazard). */
export function HazardBand({
  u,
  w,
  h,
  color = C.accent,
  top = 0.64,
}: {
  u: number;
  w: number;
  h: number;
  color?: string;
  top?: number;
}) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: h * top,
        left: -w * 0.1,
        width: w * 1.2,
        height: u * 1.6,
        transform: 'rotate(-6deg)',
        background: `repeating-linear-gradient(45deg, ${color} 0 ${u * 2}px, transparent ${u * 2}px ${u * 4}px)`,
        opacity: 0.22,
      }}
    />
  );
}

/** Chip data foil (papier chanfreiné, valeur en couleur, ombre dure). */
export function FoilChip({ u, color, value, label }: { u: number; color: string; value: string; label: string }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: u * 1.2,
        background: C.paper,
        border: `${u * 0.28}px solid rgba(255,255,255,0.85)`,
        padding: `${u * 0.9}px ${u * 1.8}px`,
        boxShadow: `${u * 0.7}px ${u * 0.7}px 0 ${C.base900}`,
        clipPath: CHAMFER(u * 1.1),
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: u * 4.4,
          lineHeight: 1,
          color: shade(color, 62),
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: MONO,
          fontSize: u * 1.5,
          textTransform: 'uppercase',
          letterSpacing: u * 0.1,
          color: 'rgba(13,13,11,0.72)',
        }}
      >
        {label}
      </span>
    </div>
  );
}

/** Titre 3D double couleur + cône (face claire, extrusion, fuite droite). */
export function ConeHeadline({ text, u, depth }: { text: string; u: number; depth: string }) {
  const size = u * (text.length <= 4 ? 26 : text.length <= 6 ? 18 : 12.5);
  const steps = Math.max(6, Math.round(size * 0.07));
  const shadow = Array.from({ length: steps }, (_, i) => `-${i + 1}px ${i + 1}px 0 ${depth}`).join(',');
  return (
    <div style={{ perspective: u * 55 }}>
      <div
        style={{
          transformOrigin: 'left center',
          transform: 'rotateY(38deg)',
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: size,
          lineHeight: 0.82,
          letterSpacing: u * 0.2,
          color: '#f6f2e8',
          textShadow: shadow,
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </div>
    </div>
  );
}

/** Halo radial coloré (derrière un sujet). */
export function Glow({
  color,
  x,
  y,
  size,
  opacity = 0.28,
}: {
  color: string;
  x: number;
  y: number;
  size: number;
  opacity?: number;
}) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        transform: 'translate(-50%,-50%)',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color} 0%, transparent 62%)`,
        opacity,
      }}
    />
  );
}

/** En-tête brand + sigle (haut du visuel). */
export function BrandHeader({ u, brand, tag }: { u: number; brand: string; tag?: string }) {
  // Logo réglé dans le manager (page Identité). Absent → le nom en typo display,
  // comme avant : un visuel n'est jamais bloqué par un logo manquant.
  const logo = studioBrand().logoUrl;
  return (
    <div
      style={{
        position: 'absolute',
        top: u * 6,
        left: u * 8,
        right: u * 8,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      {logo ? (
        <img src={logo} alt={brand} crossOrigin="anonymous" style={{ height: u * 6.5, width: 'auto', objectFit: 'contain' }} />
      ) : (
        <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: u * 4.6, letterSpacing: u * 0.2 }}>{brand}</span>
      )}
      {tag && (
        <span
          style={{
            fontFamily: MONO,
            fontWeight: 700,
            fontSize: u * 2.4,
            letterSpacing: u * 0.25,
            background: C.accent,
            color: C.ink,
            padding: `${u * 0.7}px ${u * 1.6}px`,
          }}
        >
          {tag}
        </span>
      )}
    </div>
  );
}

/**
 * Grain film (bruit fractal SVG en data-URI → capturé de façon fiable par
 * html-to-image, contrairement à un filtre SVG live). Casse l'aspect « aplat
 * digital » et donne la matière béton/print de la DA.
 */
const GRAIN_URI =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'>" +
      "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/>" +
      "<feColorMatrix type='saturate' values='0'/></filter>" +
      "<rect width='100%' height='100%' filter='url(%23n)'/></svg>",
  );

export function Grain({ u, opacity = 0.14 }: { u: number; opacity?: number }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url("${GRAIN_URI}")`,
        backgroundSize: `${u * 34}px ${u * 34}px`,
        mixBlendMode: 'overlay',
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
}

/** Vignettage doux : concentre le regard, ajoute de la profondeur. */
export function Vignette({ strength = 0.55 }: { strength?: number }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(120% 120% at 50% 42%, transparent 52%, rgba(0,0,0,${strength}) 100%)`,
        pointerEvents: 'none',
      }}
    />
  );
}

/** Scanlines fines (option cockpit / CRT). */
export function Scanlines({ u, opacity = 0.14 }: { u: number; opacity?: number }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `repeating-linear-gradient(to bottom, rgba(0,0,0,0.6) 0 ${u * 0.12}px, transparent ${u * 0.12}px ${u * 0.5}px)`,
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
}

/** Bloom coloré large et diffus (ambiance derrière le sujet principal). */
export function Bloom({ color, x, y, size, opacity = 0.5 }: { color: string; x: number; y: number; size: number; opacity?: number }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        transform: 'translate(-50%,-50%)',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color} 0%, transparent 62%)`,
        filter: `blur(${size * 0.06}px)`,
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
}

/**
 * Wordmark GÉANT en fond (remplit les vides, donne l'échelle). Texte display
 * très gros, faible opacité, éventuellement pivoté à la verticale (spine).
 */
export function BackdropWord({
  text,
  u,
  x,
  y,
  size,
  color = 'rgba(255,255,255,0.05)',
  vertical = false,
  align = 'left',
}: {
  text: string;
  u: number;
  x: number;
  y: number;
  size: number;
  color?: string;
  vertical?: boolean;
  align?: 'left' | 'center' | 'right';
}) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: vertical ? 'rotate(-90deg)' : undefined,
        transformOrigin: 'left top',
        fontFamily: DISPLAY,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 0.82,
        letterSpacing: u * 0.4,
        textTransform: 'uppercase',
        color,
        whiteSpace: 'nowrap',
        textAlign: align,
        pointerEvents: 'none',
      }}
    >
      {text}
    </div>
  );
}

/** Titre display avec split RGB (glitch chromatique) + extrusion optionnelle. */
export function GlitchTitle({
  text,
  u,
  size,
  color = C.text,
  extrude,
  split = 0.35,
}: {
  text: string;
  u: number;
  size: number;
  color?: string;
  extrude?: string;
  split?: number;
}) {
  const s = u * split;
  const shadow = [
    `${s}px 0 0 rgba(45,212,255,0.55)`,
    `-${s}px 0 0 rgba(242,49,39,0.55)`,
    extrude ? `${u * 0.5}px ${u * 0.6}px 0 ${extrude}` : '',
  ]
    .filter(Boolean)
    .join(',');
  return (
    <span
      style={{
        fontFamily: DISPLAY,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 0.86,
        textTransform: 'uppercase',
        color,
        textShadow: shadow,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );
}

/** Bande HUD data-readout (mono, ticks, segments) — bas ou haut de visuel. */
export function HudStrip({ u, items, top }: { u: number; items: string[]; top: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: u * 7,
        right: u * 7,
        top,
        display: 'flex',
        alignItems: 'center',
        gap: u * 1.4,
        fontFamily: MONO,
        fontSize: u * 1.5,
        letterSpacing: u * 0.16,
        color: C.dim,
        textTransform: 'uppercase',
      }}
    >
      <span style={{ width: u * 1.4, height: u * 1.4, background: C.accent, borderRadius: '50%', boxShadow: `0 0 ${u * 1.4}px ${C.accent}` }} />
      {items.map((it, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: u * 1.4 }}>
          {i > 0 && <span style={{ color: C.mute }}>//</span>}
          {it}
        </span>
      ))}
      <span style={{ flex: 1, height: u * 0.2, background: `repeating-linear-gradient(90deg, ${C.line} 0 ${u * 0.8}px, transparent ${u * 0.8}px ${u * 1.8}px)` }} />
    </div>
  );
}

export interface TextureOpts {
  grain?: number | false;
  vignette?: number | false;
  scanlines?: number | false;
  dotGrid?: number | false;
}

/** Titre de section : kicker mono accent + titre display extrudé. */
export function TitleBlock({
  u,
  kicker,
  title,
  size,
  depth = C.accent,
  color = C.text,
}: {
  u: number;
  kicker?: string;
  title: string;
  size?: number;
  depth?: string;
  color?: string;
}) {
  return (
    <>
      {kicker && (
        <div style={{ fontFamily: MONO, fontSize: u * 2.2, letterSpacing: u * 0.4, color: C.accent }}>{kicker}</div>
      )}
      <div
        style={{
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: size ?? u * 11,
          lineHeight: 0.9,
          textTransform: 'uppercase',
          color,
          textShadow: `${u * 0.5}px ${u * 0.6}px 0 ${depth}`,
        }}
      >
        {title}
      </div>
    </>
  );
}

/** Ticks d'angle blancs (détail cockpit) — à poser dans un conteneur relatif. */
export function CornerTicks({ u, size = 2.6, inset = 1.4, color = 'rgba(255,255,255,0.8)', weight = 0.35 }: { u: number; size?: number; inset?: number; color?: string; weight?: number }) {
  return (
    <>
      {(['tl', 'tr', 'bl', 'br'] as const).map((p) => (
        <div
          key={p}
          aria-hidden
          style={{
            position: 'absolute',
            width: u * size,
            height: u * size,
            top: p[0] === 't' ? u * inset : undefined,
            bottom: p[0] === 'b' ? u * inset : undefined,
            left: p[1] === 'l' ? u * inset : undefined,
            right: p[1] === 'r' ? u * inset : undefined,
            borderTop: p[0] === 't' ? `${u * weight}px solid ${color}` : undefined,
            borderBottom: p[0] === 'b' ? `${u * weight}px solid ${color}` : undefined,
            borderLeft: p[1] === 'l' ? `${u * weight}px solid ${color}` : undefined,
            borderRight: p[1] === 'r' ? `${u * weight}px solid ${color}` : undefined,
          }}
        />
      ))}
    </>
  );
}

/** Puce d'index façon HUD (ex. 01 / 05). */
export function IndexTag({ u, index, total, color = C.accent }: { u: number; index: number; total: number; color?: string }) {
  return (
    <span style={{ fontFamily: MONO, fontSize: u * 1.6, letterSpacing: u * 0.14, color }}>
      {`${index + 1}`.padStart(2, '0')}
      <span style={{ color: C.mute }}>/{`${total}`.padStart(2, '0')}</span>
    </span>
  );
}

/** Coquille commune : fond + texture + trame + équerres. Les templates y déposent leur contenu. */
export function Frame({
  w,
  h,
  bg,
  texture,
  children,
}: {
  w: number;
  h: number;
  bg?: string;
  texture?: TextureOpts;
  children: ReactNode;
}) {
  const u = unit(w, h);
  const t: Required<TextureOpts> = {
    grain: texture?.grain ?? 0.14,
    vignette: texture?.vignette ?? 0.55,
    scanlines: texture?.scanlines ?? false,
    dotGrid: texture?.dotGrid ?? 0.5,
  };
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bg ?? `radial-gradient(120% 90% at 50% 0%, ${C.base700} 0%, ${C.base900} 72%)`,
        color: C.text,
        fontFamily: MONO,
      }}
    >
      {t.dotGrid !== false && <DotGrid u={u} opacity={t.dotGrid} />}
      {children}
      {t.scanlines !== false && <Scanlines u={u} opacity={t.scanlines} />}
      {t.grain !== false && <Grain u={u} opacity={t.grain} />}
      {t.vignette !== false && <Vignette strength={t.vignette} />}
      <Corners u={u} />
    </div>
  );
}

/** Panneau béton chanfreiné réutilisable (fiche joueur/match dans les listes). */
export function ChamferPanel({
  u,
  children,
  style,
  accent,
}: {
  u: number;
  children: ReactNode;
  style?: CSSProperties;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: 'rgba(18,16,19,0.92)',
        border: `${u * 0.22}px solid ${C.line}`,
        borderLeft: accent ? `${u * 0.8}px solid ${accent}` : undefined,
        boxShadow: `${u * 0.7}px ${u * 0.7}px 0 rgba(0,0,0,0.55)`,
        clipPath: CHAMFER(u * 1.4),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
