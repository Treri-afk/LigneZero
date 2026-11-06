import type {
  MatchTicket,
  TicketField,
  TicketLayout,
  TicketDoc,
  TicketPanel,
  TicketEl,
  TicketFont,
  TicketCorners,
  TicketFoil,
  TicketShapeEl,
  TicketShapeVariant,
  TicketPathPoint,
} from '@lignezero/types';
// Valeur (pas un type) : nom de repli quand l'appelant n'en fournit pas.
import { DEFAULT_BRAND } from '@lignezero/types';
import QRCode from 'qrcode';

export type { MatchTicket, TicketField, TicketLayout, TicketDoc, TicketPanel, TicketEl, TicketCorners, TicketFoil, TicketShapeEl, TicketPathPoint };

/** Données minimales d'un match nécessaires au rendu du ticket. */
export interface TicketMatch {
  id: string;
  opponentName: string;
  dateISO: string;
  competition: string;
  status: 'upcoming' | 'live' | 'finished';
  score?: { us: number; them: number } | null;
  streamUrl?: string;
  vodUrl?: string;
}

export const TICKET_W = 360;
export const TICKET_H = 168;
export const SEAM = 12; // largeur totale de la césure (2 × 6px)

const DEFAULTS = {
  layout: 'classic' as TicketLayout,
  bodyColor: '#e9e5db',
  stubColor: '#f23127',
  inkColor: '#0d0d0b',
  stubInkColor: '#f4f0e6',
  stubText: 'ADMIT ONE',
  showBarcode: true,
};

export interface ResolvedTicket {
  layout: TicketLayout;
  bodyColor: string;
  stubColor: string;
  accentColor: string;
  inkColor: string;
  stubInkColor: string;
  stubText: string;
  showBarcode: boolean;
  showQr: boolean;
  showChecker: boolean;
  holo: boolean;
  background?: string;
  edition?: string;
  bigText?: string;
  fields?: TicketField[];
  serial?: string;
  stamp?: string;
}

export function resolveTicket(t?: MatchTicket): ResolvedTicket {
  const stub = t?.stubColor || DEFAULTS.stubColor;
  return {
    layout: t?.layout || DEFAULTS.layout,
    bodyColor: t?.bodyColor || DEFAULTS.bodyColor,
    stubColor: stub,
    accentColor: t?.accentColor || stub,
    inkColor: t?.inkColor || DEFAULTS.inkColor,
    stubInkColor: t?.stubInkColor || DEFAULTS.stubInkColor,
    stubText: t?.stubText || DEFAULTS.stubText,
    showBarcode: t?.showBarcode ?? DEFAULTS.showBarcode,
    showQr: t?.showQr ?? false,
    showChecker: t?.showChecker ?? false,
    holo: t?.holo ?? false,
    background: t?.background,
    edition: t?.edition,
    bigText: t?.bigText,
    fields: t?.fields,
    serial: t?.serial,
    stamp: t?.stamp,
  };
}

const MONO = "'JetBrains Mono', monospace";
const DISPLAY = "'Chakra Petch', sans-serif";
const SANS = "Inter, system-ui, sans-serif";
const FONT: Record<TicketFont, string> = { display: DISPLAY, mono: MONO, sans: SANS };

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }).toUpperCase();
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

function access(m: TicketMatch): string {
  if (m.status === 'live') return 'ENTRÉE LIVE';
  if (m.status === 'finished') return 'REPLAY';
  return 'À VENIR';
}
const serialOf = (m: TicketMatch, serial?: string) => serial || `#${m.id.replace(/\D/g, '').padStart(4, '0')}`;

// ── Tokens dynamiques ──────────────────────────────────────────────
export interface TicketCtx {
  brand: string;
  gameTag: string;
  opponent: string;
  date: string;
  time: string;
  datetime: string;
  competition: string;
  score: string;
  access: string;
  serial: string;
}
export function buildCtx(m: TicketMatch, gameTag: string, brand = DEFAULT_BRAND.name, serial?: string): TicketCtx {
  return {
    brand,
    gameTag,
    opponent: m.opponentName,
    date: fmtDate(m.dateISO),
    time: fmtTime(m.dateISO),
    datetime: `${fmtDate(m.dateISO)} · ${fmtTime(m.dateISO)}`,
    competition: m.competition,
    score: m.score ? `${m.score.us}-${m.score.them}` : '',
    access: access(m),
    serial: serialOf(m, serial),
  };
}
const TOKENS = ['brand', 'gameTag', 'opponent', 'date', 'time', 'datetime', 'competition', 'score', 'access', 'serial'] as const;
export const TICKET_TOKENS = TOKENS as readonly string[];
export function fillTokens(text: string, ctx: TicketCtx): string {
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in ctx ? String((ctx as unknown as Record<string, string>)[k]) : m));
}

// ── Éléments graphiques réutilisables ──────────────────────────────
const CHECKER = (c: string): React.CSSProperties => ({
  backgroundImage: `linear-gradient(45deg, ${c} 25%, transparent 25%), linear-gradient(-45deg, ${c} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${c} 75%), linear-gradient(-45deg, transparent 75%, ${c} 75%)`,
  backgroundSize: '8px 8px',
  backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
});

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function QrArt({ seed, size, color }: { seed: string; size: number; color: string }) {
  const n = 13;
  let h = hash(seed) || 1;
  const rnd = () => ((h = (h * 1103515245 + 12345) & 0x7fffffff), h / 0x7fffffff);
  const rects: JSX.Element[] = [];
  const finder = (ox: number, oy: number) => {
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) rects.push(<rect key={`f${ox}${oy}${x}${y}`} x={ox + x} y={oy + y} width={1} height={1} fill={color} />);
  };
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      if ((x < 3 && y < 3) || (x > n - 4 && y < 3) || (x < 3 && y > n - 4)) continue;
      if (rnd() > 0.5) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} />);
    }
  finder(0, 0);
  finder(n - 3, 0);
  finder(0, n - 3);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges" aria-hidden>
      {rects}
    </svg>
  );
}
function barcodeBg(color: string): string {
  return `repeating-linear-gradient(90deg, ${color} 0 2px, transparent 2px 3px, ${color} 3px 4px, transparent 4px 7px, ${color} 7px 9px, transparent 9px 11px)`;
}

/** Vrai QR code (scannable) rendu en SVG vectoriel crisp. */
function QrReal({ text, size, color }: { text: string; size: number; color: string }) {
  let matrix: { size: number; data: Uint8Array } | null = null;
  try {
    matrix = QRCode.create(text || '—', { errorCorrectionLevel: 'M' }).modules as { size: number; data: Uint8Array };
  } catch {
    return <QrArt seed={text} size={size} color={color} />;
  }
  const n = matrix.size;
  const rects: JSX.Element[] = [];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      if (matrix.data[y * n + x]) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} />);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges" aria-hidden>
      {rects}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════
//  MODE DOCUMENT (éditeur canvas) : panneau d'éléments positionnés
// ══════════════════════════════════════════════════════════════════

export interface DocLayout {
  bodyW: number;
  stubW: number;
  height: number;
  radius: number;
  seam: number;
}
export function docLayout(d: TicketDoc): DocLayout {
  return {
    bodyW: Math.max(0, d.width - d.stubWidth - SEAM),
    stubW: d.stubWidth,
    height: d.height,
    radius: d.radius,
    seam: SEAM,
  };
}

const dropShadow = (s?: { x: number; y: number; blur: number; color: string }) => (s ? `${s.x}px ${s.y}px ${s.blur}px ${s.color}` : undefined);
const insetBorder = (b?: { width: number; color: string }) => (b ? `inset 0 0 0 ${b.width}px ${b.color}` : undefined);
const joinShadow = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(', ') || undefined;

/** borderRadius CSS pour un élément : par angle (`radii`) sinon uniforme (`radius`). */
function cornerCss(radius?: number, radii?: TicketCorners): string | number | undefined {
  if (radii) return `${radii.tl}px ${radii.tr}px ${radii.br}px ${radii.bl}px`;
  return radius || undefined;
}

/** Rayons effectifs des 4 angles d'un panneau (par angle > uniforme > côté extérieur). */
export function panelCorners(panel: TicketPanel, round: 'left' | 'right', radius: number): TicketCorners {
  if (panel.radii) return panel.radii;
  const r = panel.radius ?? radius;
  return round === 'left' ? { tl: r, tr: 0, br: 0, bl: r } : { tl: 0, tr: r, br: r, bl: 0 };
}

// ── Foil (reflet métallique par élément) ──────────────────────────
const FOIL_STOPS: Record<string, string[]> = {
  holo: ['#ff2d78', '#ff9a3d', '#ffe14d', '#4dff88', '#4dd2ff', '#b14dff', '#ff2d78'],
  rainbow: ['#ff2d78', '#ff9a3d', '#ffe14d', '#4dff88', '#4dd2ff', '#b14dff', '#ff2d78'],
  gold: ['#7a5a12', '#f9e08a', '#d4af37', '#fff3c4', '#b8860b', '#f9e08a'],
  silver: ['#6b6b6b', '#e8e8e8', '#b0b0b0', '#ffffff', '#8a8a8a', '#e0e0e0'],
  chrome: ['#1f2a36', '#9fb4c8', '#dfe9f2', '#6d8199', '#cfe0ee', '#2a3a4a'],
};
const foilColors = (foil: TicketFoil) => (foil.type === 'gradient' ? [foil.from ?? '#ff2d78', foil.to ?? '#4dd2ff'] : FOIL_STOPS[foil.type] ?? FOIL_STOPS.holo);

/** Fond CSS d'un foil (pour texte métallique et overlays). */
export function foilBackground(foil: TicketFoil): React.CSSProperties {
  const a = foil.angle ?? 115;
  const grad = `linear-gradient(${a}deg, ${foilColors(foil).join(', ')})`;
  if (foil.type === 'holo') {
    return {
      backgroundImage: [`linear-gradient(${a}deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 25%, rgba(255,255,255,0) 75%, rgba(255,255,255,0.7) 100%)`, grad].join(', '),
      backgroundSize: '200% 200%, 300% 300%',
      backgroundBlendMode: 'overlay, normal',
    };
  }
  return { backgroundImage: grad, backgroundSize: foil.type === 'gradient' ? undefined : '200% 200%' };
}

/** Overlay foil clipé à la forme de l'élément (rect/image/barcode/qr). */
function FoilOverlay({ foil }: { foil?: TicketFoil }) {
  if (!foil) return null;
  return (
    <span aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none', mixBlendMode: foil.blend ?? 'overlay', opacity: foil.opacity ?? 0.9, ...foilBackground(foil) }} />
  );
}

// ── Formes vectorielles (SVG) ──────────────────────────────────────
function polygonPoints(cx: number, cy: number, rx: number, ry: number, n: number, rot: number): string {
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = rot + (i * 2 * Math.PI) / n;
    pts.push(`${(cx + rx * Math.cos(a)).toFixed(2)},${(cy + ry * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}
function starPoints(cx: number, cy: number, rOut: number, rIn: number, n: number, rot: number): string {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? rOut : rIn;
    const a = rot + (i * Math.PI) / n;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

/** Convertit une forme prédéfinie en points de tracé normalisés (0–1), éditables. */
export function shapeToPoints(variant: TicketShapeVariant, points?: number): TicketPathPoint[] {
  const top = -Math.PI / 2;
  const poly = (n: number): TicketPathPoint[] => Array.from({ length: n }, (_, i) => {
    const a = top + (i * 2 * Math.PI) / n;
    return { x: 0.5 + 0.5 * Math.cos(a), y: 0.5 + 0.5 * Math.sin(a) };
  });
  switch (variant) {
    case 'rect': return [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];
    case 'triangle': return poly(3);
    case 'diamond': return poly(4);
    case 'pentagon': return poly(5);
    case 'hexagon': return poly(6);
    case 'polygon': return poly(Math.max(3, points ?? 6));
    case 'ellipse': return poly(24);
    case 'line': return [{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }];
    case 'star': {
      const n = Math.max(3, points ?? 5);
      const out: TicketPathPoint[] = [];
      for (let i = 0; i < n * 2; i++) {
        const r = i % 2 === 0 ? 0.5 : 0.225;
        const a = top + (i * Math.PI) / n;
        out.push({ x: 0.5 + r * Math.cos(a), y: 0.5 + r * Math.sin(a) });
      }
      return out;
    }
    default: return [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];
  }
}

type PathPx = { x: number; y: number; r: number; cIn?: { x: number; y: number }; cOut?: { x: number; y: number } };
const f2 = (n: number) => n.toFixed(2);

/**
 * Construit un `d` SVG depuis des points px. Si au moins un point porte des
 * poignées bézier (cIn/cOut) → mode courbe (cubiques). Sinon → mode coins
 * (arrondi par point via `r`).
 */
export function buildPathD(pts: PathPx[], closed: boolean): string {
  const n = pts.length;
  if (n < 2) return '';
  const smooth = pts.some((p) => p.cIn || p.cOut);

  if (smooth) {
    let d = `M ${f2(pts[0].x)} ${f2(pts[0].y)}`;
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      const c1 = a.cOut ?? { x: a.x, y: a.y };
      const c2 = b.cIn ?? { x: b.x, y: b.y };
      d += a.cOut || b.cIn ? ` C ${f2(c1.x)} ${f2(c1.y)} ${f2(c2.x)} ${f2(c2.y)} ${f2(b.x)} ${f2(b.y)}` : ` L ${f2(b.x)} ${f2(b.y)}`;
    }
    return closed ? d + ' Z' : d;
  }

  if (!closed || n === 2) {
    let d = `M ${f2(pts[0].x)} ${f2(pts[0].y)}`;
    for (let i = 1; i < n; i++) d += ` L ${f2(pts[i].x)} ${f2(pts[i].y)}`;
    return d;
  }
  const len = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(b.x - a.x, b.y - a.y);
  const unit = (a: { x: number; y: number }, b: { x: number; y: number }) => { const l = len(a, b) || 1; return { x: (b.x - a.x) / l, y: (b.y - a.y) / l }; };
  let d = '';
  for (let i = 0; i < n; i++) {
    const p = pts[i], prev = pts[(i - 1 + n) % n], next = pts[(i + 1) % n];
    const t = p.r && p.r > 0 ? Math.min(p.r, len(prev, p) / 2, len(next, p) / 2) : 0;
    const v1 = unit(p, prev), v2 = unit(p, next);
    const a = { x: p.x + v1.x * t, y: p.y + v1.y * t };
    const b = { x: p.x + v2.x * t, y: p.y + v2.y * t };
    d += i === 0 ? `M ${f2(a.x)} ${f2(a.y)}` : ` L ${f2(a.x)} ${f2(a.y)}`;
    if (t > 0) d += ` Q ${f2(p.x)} ${f2(p.y)} ${f2(b.x)} ${f2(b.y)}`;
  }
  return d + ' Z';
}

/** Rendu vectoriel d'une forme (pleine ou contour, avec foil éventuel). */
export function ShapeSvg({ el }: { el: TicketShapeEl }) {
  const w = el.w, h = el.h;
  const sw = el.stroke?.width ?? 0;
  const m = sw / 2 + 0.5; // marge pour ne pas couper le contour
  const cx = w / 2, cy = h / 2;
  const rx = Math.max(0, w / 2 - m), ry = Math.max(0, h / 2 - m);
  const n = Math.max(3, el.points ?? (el.variant === 'star' ? 5 : 6));
  const top = -Math.PI / 2;

  const fillId = `foil-${el.id}`;
  const filled = !!el.fill;
  const fillPaint = el.foil ? (filled ? `url(#${fillId})` : 'none') : (el.fill || 'none');
  const strokePaint = el.stroke ? (el.foil && !filled ? `url(#${fillId})` : el.stroke.color) : 'none';
  const common = { fill: fillPaint, stroke: strokePaint, strokeWidth: sw, fillOpacity: el.foil && filled ? el.foil.opacity ?? 1 : undefined, vectorEffect: 'non-scaling-stroke' as const };

  let shape: JSX.Element;
  switch (el.variant) {
    case 'ellipse': shape = <ellipse cx={cx} cy={cy} rx={rx} ry={ry} {...common} />; break;
    case 'line': shape = <line x1={m} y1={cy} x2={w - m} y2={cy} stroke={el.foil ? `url(#${fillId})` : el.stroke?.color ?? '#000'} strokeWidth={sw || 2} strokeLinecap="round" />; break;
    case 'triangle': shape = <polygon points={polygonPoints(cx, cy, rx, ry, 3, top)} {...common} />; break;
    case 'diamond': shape = <polygon points={polygonPoints(cx, cy, rx, ry, 4, top)} {...common} />; break;
    case 'pentagon': shape = <polygon points={polygonPoints(cx, cy, rx, ry, 5, top)} {...common} />; break;
    case 'hexagon': shape = <polygon points={polygonPoints(cx, cy, rx, ry, 6, top)} {...common} />; break;
    case 'polygon': shape = <polygon points={polygonPoints(cx, cy, rx, ry, n, top)} {...common} />; break;
    case 'star': shape = <polygon points={starPoints(cx, cy, rx, ry * 0.45, n, top)} {...common} />; break;
    case 'path': {
      const src = el.path && el.path.length >= 2 ? el.path : shapeToPoints('rect');
      const cvt = (p: { x: number; y: number }) => ({ x: m + p.x * (w - sw), y: m + p.y * (h - sw) });
      const px = src.map((p) => ({ ...cvt(p), r: p.r ?? 0, cIn: p.cIn ? cvt(p.cIn) : undefined, cOut: p.cOut ? cvt(p.cOut) : undefined }));
      shape = <path d={buildPathD(px, el.closed ?? true)} {...common} strokeLinejoin="round" strokeLinecap="round" />;
      break;
    }
    default: shape = <rect x={m} y={m} width={Math.max(0, w - sw)} height={Math.max(0, h - sw)} rx={el.radius ?? 0} {...common} />;
  }

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible', display: 'block', filter: el.shadow ? `drop-shadow(${dropShadow(el.shadow)})` : undefined }} aria-hidden>
      {el.foil && (
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="1" y2="0" gradientTransform={`rotate(${el.foil.angle ?? 115} 0.5 0.5)`}>
            {foilColors(el.foil).map((c, i, arr) => <stop key={i} offset={`${(i / (arr.length - 1)) * 100}%`} stopColor={c} />)}
          </linearGradient>
        </defs>
      )}
      {shape}
    </svg>
  );
}

/** Rend un élément unique (coordonnées relatives au panneau). */
function ElementView({ el, ctx }: { el: TicketEl; ctx: TicketCtx }) {
  const base: React.CSSProperties = {
    position: 'absolute',
    left: el.x,
    top: el.y,
    width: el.w,
    height: el.h,
    transform: el.rotate ? `rotate(${el.rotate}deg)` : undefined,
    transformOrigin: 'center',
    opacity: el.opacity ?? undefined,
    borderRadius: cornerCss(el.radius, el.radii),
  };
  if (el.type === 'text') {
    const foilStyle: React.CSSProperties = el.foil
      ? { color: 'transparent', WebkitTextFillColor: 'transparent', WebkitBackgroundClip: 'text', backgroundClip: 'text', ...foilBackground(el.foil) }
      : { color: el.color };
    return (
      <div
        style={{
          ...base,
          fontFamily: FONT[el.font],
          fontSize: el.size,
          fontWeight: el.weight,
          textAlign: el.align,
          fontStyle: el.italic ? 'italic' : undefined,
          letterSpacing: el.tracking,
          textTransform: el.uppercase ? 'uppercase' : undefined,
          lineHeight: el.lineHeight ?? 1.05,
          background: el.foil ? foilBackground(el.foil).backgroundImage : el.bg,
          backgroundSize: el.foil ? foilBackground(el.foil).backgroundSize : undefined,
          padding: el.bg && !el.foil ? el.padding ?? 4 : undefined,
          boxSizing: 'border-box',
          WebkitTextStroke: el.stroke ? `${el.stroke.width}px ${el.stroke.color}` : undefined,
          textShadow: dropShadow(el.shadow),
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          ...foilStyle,
        }}
      >
        {fillTokens(el.text, ctx)}
      </div>
    );
  }
  if (el.type === 'shape') return <div style={base}><ShapeSvg el={el} /></div>;
  if (el.type === 'rect')
    return (
      <div style={{ ...base, background: el.color, boxShadow: joinShadow(dropShadow(el.shadow), insetBorder(el.border)) }}>
        <FoilOverlay foil={el.foil} />
      </div>
    );
  if (el.type === 'image')
    return (
      <div style={{ ...base, overflow: 'hidden', boxShadow: joinShadow(dropShadow(el.shadow), insetBorder(el.border)) }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <img src={el.url} style={{ width: '100%', height: '100%', objectFit: el.fit ?? 'cover', display: 'block' }} />
        <FoilOverlay foil={el.foil} />
      </div>
    );
  if (el.type === 'barcode')
    return (
      <div style={{ ...base, background: barcodeBg(el.color), boxShadow: dropShadow(el.shadow) }}>
        <FoilOverlay foil={el.foil} />
      </div>
    );
  // qr — encode des vraies données (scannable) : el.data (tokens) sinon le serial
  const qrText = el.data ? fillTokens(el.data, ctx) : ctx.serial;
  return (
    <div style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: el.shadow ? `drop-shadow(${dropShadow(el.shadow)})` : undefined }}>
      <QrReal text={qrText} size={Math.min(el.w, el.h)} color={el.color} />
      <FoilOverlay foil={el.foil} />
    </div>
  );
}

/** Fond d'un panneau (couleur, dégradé ou image). */
export function panelBackground(panel: TicketPanel): string {
  if (panel.bgImage) return `${panel.bg} url(${panel.bgImage}) center/cover`;
  if (panel.gradient) return `linear-gradient(${panel.gradient.angle}deg, ${panel.gradient.from}, ${panel.gradient.to})`;
  return panel.bg;
}

/** Style de l'overlay motif d'un panneau. `angle` pilote la DIRECTION (foil/holo/hazard). */
export function patternStyle(pattern: string, color: string, angle?: number): React.CSSProperties {
  const a = angle ?? 115;
  switch (pattern) {
    case 'checker':
      return CHECKER(color);
    case 'dots':
      return { backgroundImage: `radial-gradient(${color} 1.2px, transparent 1.4px)`, backgroundSize: '10px 10px' };
    case 'hazard':
      return { backgroundImage: `repeating-linear-gradient(${angle ?? 45}deg, ${color} 0 8px, transparent 8px 16px)` };
    case 'holo':
      // Iridescence FORTE mais DIRECTIONNELLE (plus de point central conique) :
      // dégradé arc-en-ciel linéaire orienté `angle` + micro-bandes spectrales
      // + sheen brillant le long du même axe, fondu 'screen' (éclat métallique).
      return {
        backgroundImage: [
          `linear-gradient(${a}deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 22%, rgba(255,255,255,0) 78%, rgba(255,255,255,0.65) 100%)`,
          `repeating-linear-gradient(${a - 43}deg, rgba(255,45,120,0.55) 0 7px, rgba(255,214,77,0.55) 7px 14px, rgba(77,255,136,0.55) 14px 21px, rgba(77,210,255,0.55) 21px 28px, rgba(177,77,255,0.55) 28px 35px)`,
          `linear-gradient(${a}deg, #ff2d78, #ff9a3d, #ffe14d, #4dff88, #4dd2ff, #b14dff, #ff2d78)`,
        ].join(', '),
        backgroundSize: '200% 200%, auto, 260% 260%',
        backgroundBlendMode: 'screen, overlay, normal',
        mixBlendMode: 'screen',
      };
    default:
      return {};
  }
}

/** Rend un panneau (corps ou talon) à dimensions fixées, entièrement stylable. */
export function PanelView({
  panel,
  w,
  h,
  ctx,
  round,
  radius,
}: {
  panel: TicketPanel;
  w: number;
  h: number;
  ctx: TicketCtx;
  round: 'left' | 'right';
  radius: number;
}) {
  const c = panelCorners(panel, round, radius);
  const hasPattern = panel.pattern && panel.pattern !== 'none';
  return (
    <div
      style={{
        position: 'relative',
        width: w,
        height: h,
        flexShrink: 0,
        overflow: 'hidden',
        background: panelBackground(panel),
        borderRadius: `${c.tl}px ${c.tr}px ${c.br}px ${c.bl}px`,
        boxShadow: panel.border ? `inset 0 0 0 ${panel.border.width}px ${panel.border.color}` : undefined,
      }}
    >
      {hasPattern && (
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: panel.patternOpacity ?? (panel.pattern === 'holo' ? 0.7 : 0.15), ...patternStyle(panel.pattern as string, panel.patternColor || '#0d0d0b', panel.patternAngle) }} />
      )}
      {panel.elements.filter((el) => !el.hidden).map((el) => (
        <ElementView key={el.id} el={el} ctx={ctx} />
      ))}
    </div>
  );
}

/** Rayons des angles INTÉRIEURS (côté césure) : body tr/br + stub tl/bl. */
export function innerRadii(doc: TicketDoc): { top: number; bottom: number } {
  const b = panelCorners(doc.body, 'left', doc.radius);
  const s = panelCorners(doc.stub, 'right', doc.radius);
  return { top: Math.max(b.tr, s.tl), bottom: Math.max(b.br, s.bl) };
}

/**
 * Pont reliant corps↔talon quand les angles intérieurs sont arrondis.
 * Placé DERRIÈRE les panneaux : ne transparaît qu'à travers les encoches
 * (angles arrondis) → relie visuellement les deux moitiés sans masquer le contenu.
 */
export function TicketBridge({ doc }: { doc: TicketDoc }) {
  const { top, bottom } = innerRadii(doc);
  const reach = Math.max(top, bottom);
  if (reach <= 0) return null;
  const l = docLayout(doc);
  const left = l.bodyW - reach;
  const width = reach + SEAM + reach;
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left,
        width,
        top: 0,
        bottom: 0,
        background: `linear-gradient(90deg, ${doc.body.bg}, ${doc.stub.bg})`,
        pointerEvents: 'none',
        zIndex: -1,
      }}
    />
  );
}

/** Document par défaut (point de départ de l'éditeur) reproduisant le ticket classique. */
export function defaultDoc(r: ResolvedTicket): TicketDoc {
  const width = TICKET_W;
  const height = TICKET_H;
  const stubWidth = 96;
  const bodyW = width - stubWidth - SEAM;
  let n = 0;
  const uid = () => `e${++n}`;
  return {
    width,
    height,
    radius: 0,
    stubWidth,
    seam: 'dots',
    body: {
      bg: r.bodyColor,
      elements: [
        { id: uid(), type: 'rect', x: 14, y: 14, w: 40, h: 16, color: r.accentColor },
        { id: uid(), type: 'text', x: 14, y: 14, w: 40, h: 16, text: '{gameTag}', font: 'mono', size: 9, weight: 700, color: r.stubInkColor, align: 'center', tracking: 1.5 },
        { id: uid(), type: 'text', x: bodyW - 120, y: 14, w: 108, h: 14, text: '{datetime}', font: 'mono', size: 10, weight: 700, color: r.inkColor, align: 'right', tracking: 1 },
        { id: uid(), type: 'text', x: 14, y: 54, w: bodyW - 24, h: 24, text: '{brand}', font: 'display', size: 20, weight: 700, color: r.inkColor, align: 'left', uppercase: true },
        { id: uid(), type: 'text', x: 14, y: 78, w: 60, h: 12, text: 'vs', font: 'mono', size: 10, weight: 400, color: r.inkColor, align: 'left', tracking: 1.5 },
        { id: uid(), type: 'text', x: 14, y: 92, w: bodyW - 24, h: 24, text: '{opponent}', font: 'display', size: 20, weight: 700, color: r.inkColor, align: 'left', uppercase: true },
        { id: uid(), type: 'text', x: 14, y: height - 30, w: bodyW - 110, h: 12, text: '{competition}', font: 'mono', size: 9, weight: 400, color: r.inkColor, align: 'left', tracking: 1.5 },
        { id: uid(), type: 'barcode', x: bodyW - 90, y: height - 32, w: 80, h: 22, color: r.inkColor },
      ],
    },
    stub: {
      bg: r.stubColor,
      elements: [
        { id: uid(), type: 'text', x: 6, y: 12, w: stubWidth - 12, h: 12, text: r.stubText, font: 'mono', size: 8, weight: 400, color: r.stubInkColor, align: 'center', tracking: 1.5, uppercase: true },
        { id: uid(), type: 'text', x: 0, y: 62, w: stubWidth, h: 28, text: '{score}', font: 'display', size: 24, weight: 700, color: r.stubInkColor, align: 'center' },
        { id: uid(), type: 'text', x: 6, y: 108, w: stubWidth - 12, h: 12, text: '{access}', font: 'mono', size: 8, weight: 700, color: r.stubInkColor, align: 'center', tracking: 1.5, uppercase: true },
        { id: uid(), type: 'text', x: 6, y: height - 22, w: stubWidth - 12, h: 10, text: '{serial}', font: 'mono', size: 8, weight: 400, color: r.stubInkColor, align: 'center' },
      ],
    },
  };
}

// ══════════════════════════════════════════════════════════════════
//  Parts du ticket (doc si présent, sinon rendu "params simples")
// ══════════════════════════════════════════════════════════════════

interface PartProps {
  match: TicketMatch;
  gameTag: string;
  ticket?: MatchTicket;
  brand?: string;
}

function FieldGrid({ fields }: { fields: TicketField[] }) {
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {fields.slice(0, 4).map((f, i) => (
        <div key={i} style={{ minWidth: 0 }}>
          <div style={{ fontFamily: MONO, fontSize: 6.5, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.55 }}>{f.label}</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 14, fontWeight: 700, lineHeight: 1, whiteSpace: 'nowrap' }}>{f.value}</div>
        </div>
      ))}
    </div>
  );
}

function Holo() {
  return <span aria-hidden style={{ position: 'absolute', inset: 0, background: 'conic-gradient(from 210deg, #ff5f6d, #ffc371, #47e5bc, #4facfe, #b16cea, #ff5f6d)', opacity: 0.42, mixBlendMode: 'overlay' }} />;
}

/** Corps (partie gardée à l'arrachage). */
export function TicketBody({ match: m, gameTag, ticket, brand = DEFAULT_BRAND.name }: PartProps) {
  const r = resolveTicket(ticket);
  if (ticket?.doc) {
    const l = docLayout(ticket.doc);
    return <PanelView panel={ticket.doc.body} w={l.bodyW} h={l.height} ctx={buildCtx(m, gameTag, brand, r.serial)} round="left" radius={l.radius} />;
  }
  // ── rendu "params simples" (legacy) ──
  const boarding = r.layout === 'boarding';
  const defaultFields: TicketField[] = [
    { label: 'DATE', value: fmtDate(m.dateISO) },
    { label: 'HEURE', value: fmtTime(m.dateISO) },
    ...(m.score ? [{ label: 'SCORE', value: `${m.score.us}-${m.score.them}` }] : []),
  ];
  const fields = r.fields && r.fields.length ? r.fields : defaultFields;
  return (
    <div style={{ position: 'relative', display: 'flex', minWidth: 0, flex: 1, flexDirection: 'column', justifyContent: 'space-between', padding: 14, color: r.inkColor, background: r.background ? `${r.bodyColor} url(${r.background}) center/cover` : r.bodyColor, overflow: 'hidden' }}>
      {r.background && <div aria-hidden style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${r.bodyColor}ee, ${r.bodyColor}aa)` }} />}
      {r.holo && <Holo />}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ background: r.accentColor, color: r.stubInkColor, padding: '1px 6px', fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: 1.5 }}>{gameTag}</span>
        <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: 1.5, opacity: 0.8 }}>{r.edition || `${fmtDate(m.dateISO)} · ${fmtTime(m.dateISO)}`}</span>
      </div>
      {boarding ? (
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: 2, opacity: 0.6 }}>{brand} <span style={{ color: r.accentColor }}>VS</span></div>
          <div style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 700, lineHeight: 0.95, textTransform: 'uppercase', letterSpacing: -0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.bigText || m.opponentName}</div>
          <div style={{ marginTop: 5 }}><FieldGrid fields={fields} /></div>
        </div>
      ) : (
        <div style={{ position: 'relative', margin: '6px 0' }}>
          <p style={{ margin: 0, fontFamily: DISPLAY, fontSize: 20, fontWeight: 700, lineHeight: 1, textTransform: 'uppercase' }}>{brand}</p>
          <p style={{ margin: 0, fontFamily: MONO, fontSize: 10, letterSpacing: 1.5, opacity: 0.55 }}>vs</p>
          <p style={{ margin: 0, fontFamily: DISPLAY, fontSize: 20, fontWeight: 700, lineHeight: 1, textTransform: 'uppercase' }}>{m.opponentName}</p>
        </div>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          {!boarding && <div style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: MONO, fontSize: 9, letterSpacing: 1.5, opacity: 0.6, marginBottom: 3 }}>{m.competition}</div>}
          {r.showChecker && <div aria-hidden style={{ height: 8, width: 54, ...CHECKER(r.inkColor) }} />}
          {r.showBarcode && !r.showChecker && <span aria-hidden style={{ display: 'inline-block', height: 20, width: boarding ? 96 : 80, background: barcodeBg(r.inkColor) }} />}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
          {r.showChecker && r.showBarcode && <span aria-hidden style={{ display: 'inline-block', height: 20, width: 54, background: barcodeBg(r.inkColor) }} />}
          {r.showQr && <div style={{ color: r.inkColor }}><QrArt seed={m.id} size={34} color={r.inkColor} /></div>}
        </div>
      </div>
      {r.stamp && <span aria-hidden style={{ position: 'absolute', right: -4, top: '40%', transform: 'rotate(-15deg)', border: `2px solid ${r.accentColor}`, color: r.accentColor, padding: '2px 10px', fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.85 }}>{r.stamp}</span>}
    </div>
  );
}

/** Perforation centrale. */
export function TicketSeam({ part, ticket }: { part: 'body' | 'stub'; ticket?: MatchTicket }) {
  const r = resolveTicket(ticket);
  if (ticket?.doc?.seam === 'none') {
    const bg = part === 'body' ? ticket.doc.body.bg : ticket.doc.stub.bg;
    return <div aria-hidden style={{ width: 6, flexShrink: 0, alignSelf: 'stretch', background: bg }} />;
  }
  const pos = part === 'body' ? 'right' : 'left';
  const bg = ticket?.doc ? panelBackground(part === 'body' ? ticket.doc.body : ticket.doc.stub) : part === 'body' ? r.bodyColor : r.stubColor;
  const ink = ticket?.doc ? DEFAULTS.inkColor : r.inkColor;
  return (
    <div aria-hidden style={{ width: 6, flexShrink: 0, alignSelf: 'stretch', background: bg, backgroundImage: `radial-gradient(circle at ${pos} center, ${ink} 2.5px, transparent 2.9px)`, backgroundSize: '6px 15px', backgroundRepeat: 'repeat-y' }} />
  );
}

/** Talon (partie arrachable). */
export function TicketStub({ match: m, gameTag = '—', ticket, brand = DEFAULT_BRAND.name }: { match: TicketMatch; gameTag?: string; ticket?: MatchTicket; brand?: string }) {
  const r = resolveTicket(ticket);
  if (ticket?.doc) {
    const l = docLayout(ticket.doc);
    return <PanelView panel={ticket.doc.stub} w={l.stubW} h={l.height} ctx={buildCtx(m, gameTag, brand, r.serial)} round="right" radius={l.radius} />;
  }
  return (
    <div style={{ position: 'relative', display: 'flex', height: '100%', width: 96, flexShrink: 0, flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', background: r.stubColor, color: r.stubInkColor, padding: 12, overflow: 'hidden' }}>
      <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.85 }}>{r.stubText}</span>
      {m.score ? <span style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 700, lineHeight: 1 }}>{m.score.us}-{m.score.them}</span> : <span style={{ fontFamily: MONO, fontSize: 24 }}>●</span>}
      <span style={{ textAlign: 'center', fontFamily: MONO, fontSize: 8, fontWeight: 700, lineHeight: 1.1, letterSpacing: 1.5, textTransform: 'uppercase' }}>{access(m)}</span>
      <span style={{ fontFamily: MONO, fontSize: 8, opacity: 0.75 }}>{serialOf(m, r.serial)}</span>
    </div>
  );
}

/** Dimensions totales du ticket (doc ou défaut). */
export function ticketDims(ticket?: MatchTicket): { width: number; height: number; radius: number } {
  if (ticket?.doc) return { width: ticket.doc.width, height: ticket.doc.height, radius: ticket.doc.radius };
  return { width: TICKET_W, height: TICKET_H, radius: 0 };
}

/** Ticket complet (aperçu studio, inventaire, mobile). */
export function MatchTicketCard({ match, gameTag, ticket, brand }: PartProps) {
  const d = ticketDims(ticket);
  // Mode doc : chaque panneau gère ses angles/bordures → pas de clip global,
  // ombre portée via drop-shadow (respecte les formes arrondies).
  const docMode = !!ticket?.doc;
  const outer: React.CSSProperties = docMode
    ? { position: 'relative', display: 'flex', height: d.height, width: d.width, userSelect: 'none', filter: 'drop-shadow(5px 5px 0 rgba(0,0,0,0.35))' }
    : { display: 'flex', height: d.height, width: d.width, userSelect: 'none', overflow: 'hidden', borderRadius: d.radius, border: '1px solid rgba(13,13,11,0.2)', boxShadow: '5px 5px 0 -1px rgba(0,0,0,0.35)' };
  return (
    <div style={outer}>
      {docMode && ticket?.doc && <TicketBridge doc={ticket.doc} />}
      <TicketBody match={match} gameTag={gameTag} ticket={ticket} brand={brand} />
      <TicketSeam part="body" ticket={ticket} />
      <TicketSeam part="stub" ticket={ticket} />
      <TicketStub match={match} gameTag={gameTag} ticket={ticket} brand={brand} />
    </div>
  );
}
