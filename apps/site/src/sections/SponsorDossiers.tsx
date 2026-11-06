import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import type { Sponsor } from '@/types';
import { useData, useBrand } from '@/data/DataProvider';

// react-pageflip a des types laxistes → alias permissif.
const FlipBook = HTMLFlipBook as unknown as React.FC<Record<string, unknown>>;

const Sheet = forwardRef<HTMLDivElement, { children: React.ReactNode; hard?: boolean; className?: string }>(
  ({ children, hard, className = '' }, ref) => (
    <div ref={ref} data-density={hard ? 'hard' : 'soft'} className={`h-full w-full overflow-hidden ${className}`}>
      {children}
    </div>
  ),
);
Sheet.displayName = 'Sheet';

// Feuille intérieure : plus PETITE que le dossier → la couleur du dossier
// dépasse tout autour (haut/bas/côtés) pour la profondeur.
const FOLDER_C = 'linear-gradient(158deg, #26262d 0%, #1c1c22 48%, #141418 100%)';
const Leaf = forwardRef<HTMLDivElement, { children: React.ReactNode }>(({ children }, ref) => (
  <div ref={ref} data-density="soft" className="h-full w-full px-2.5 pt-4 pb-5" style={{ background: FOLDER_C }}>
    <div className="flex h-full w-full flex-col overflow-hidden border-2 border-line-strong bg-base-900 p-3.5 text-[color:var(--text)] shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
      {children}
    </div>
  </div>
));
Leaf.displayName = 'Leaf';

const FW = 250;
const FH = 332; // portrait, format dossier
const FOLDER = 'linear-gradient(158deg, #26262d 0%, #1c1c22 48%, #141418 100%)';
const caseNo = (s: Sponsor, i: number) => `LZ-${String(i + 1).padStart(3, '0')}-${s.tier[0].toUpperCase()}`;

const TIER_LABEL: Record<Sponsor['tier'], string> = {
  principal: 'TITRE',
  officiel: 'OFFICIEL',
  technique: 'TECHNIQUE',
};

/* ── Couverture du dossier (sombre) ─────────────────────────── */
function Cover({ s, i, sealed = true }: { s: Sponsor; i: number; sealed?: boolean }) {
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: FOLDER, color: 'var(--text)' }}>
      <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.05), transparent 20%)' }} />
      <div className="hazard pointer-events-none absolute inset-y-0 left-0 w-1.5 opacity-50" aria-hidden />

      {/* étiquette */}
      <div className="absolute left-4 right-4 top-5 border-2 border-line-strong bg-base-900/85 px-3 py-2">
        <p className="font-mono text-[8px] font-bold uppercase tracking-hud text-[color:var(--text-mute)]">DOSSIER · {caseNo(s, i)}</p>
        <p className="hud-title text-lg font-bold leading-none">{s.name}</p>
        <p className="font-mono text-[8px] uppercase tracking-hud text-[color:var(--text-mute)]">PARTENAIRE {TIER_LABEL[s.tier]}</p>
      </div>

      {/* tampon CONFIDENTIEL */}
      <span className="stamp absolute right-3 top-[36%] rotate-[8deg] px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wide2">Confidentiel</span>

      {/* nom fantôme au centre */}
      <span aria-hidden className="absolute inset-x-0 top-[44%] select-none text-center font-display text-3xl font-bold uppercase tracking-tighter" style={{ color: 'transparent', WebkitTextStroke: '1px var(--line-strong)' }}>
        {s.name}
      </span>

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-line px-3 py-1.5">
        <span className="font-mono text-[8px] font-bold uppercase tracking-hud text-[color:var(--text-mute)]">{sealed ? 'SCELLÉ' : 'OUVERT'}</span>
        <span className="ticket-barcode h-4 w-16 text-[color:var(--text-dim)]" />
      </div>
    </div>
  );
}

/* ── Dossier fermé posé sur la table ────────────────────────── */
function DossierFolder({ s, i }: { s: Sponsor; i: number }) {
  return (
    <div className="relative select-none" style={{ height: FH, width: FW }}>
      <div className="absolute -top-4 left-6 z-10 border-t-2 border-accent bg-base-700 px-4 py-1.5 font-mono text-[9px] font-bold uppercase tracking-hud text-[color:var(--text-dim)]">
        {s.name}
      </div>
      {/* épaisseur (feuilles sombres qui dépassent) */}
      <div className="absolute inset-x-2 bottom-2 top-3 bg-base-700" style={{ transform: 'translate(3px,3px)' }} />
      <div className="absolute inset-x-2 bottom-2 top-3 border-2 border-line-strong shadow-ink">
        <Cover s={s} i={i} sealed />
      </div>
    </div>
  );
}

/* ── Feuille intérieure NOIRE à onglets (lore) ──────────────── */
const PW = 300;
const PH = 412;

function Redacted({ w = '5rem' }: { w?: string }) {
  return <span className="mx-0.5 inline-block translate-y-0.5 select-none align-middle" style={{ background: 'var(--text-mute)', width: w, height: '0.8em' }} />;
}

/* Pages (droite) — lore façon SCP, généré depuis les données. */
/** Fonction pure (pas un composant) : le nom de la marque arrive en paramètre. */
function dossierPages(s: Sponsor, i: number, brandName: string) {
  const d = s.dossier ?? {};
  return [
    {
      tag: '§1 · CLASSIFICATION',
      node: (
        <div className="space-y-2.5 font-mono text-[10px] leading-relaxed text-[color:var(--text-dim)]">
          <p className="uppercase tracking-hud"><span className="font-bold text-[color:var(--text)]">ITEM #</span> : {caseNo(s, i)}</p>
          <p className="uppercase tracking-hud"><span className="font-bold text-[color:var(--text)]">CLASSE</span> : <span className="text-accent">{TIER_LABEL[s.tier]}</span></p>
          <p className="uppercase tracking-hud"><span className="font-bold text-[color:var(--text)]">CLEARANCE</span> : {d.classification ?? 'NIVEAU 1'}</p>
          <p className="uppercase tracking-hud"><span className="font-bold text-[color:var(--text)]">SECTEUR</span> : {s.sector ?? '—'}</p>
          <p className="uppercase tracking-hud"><span className="font-bold text-[color:var(--text)]">ACTIF DEPUIS</span> : {s.since ?? '—'}</p>
          <p className="uppercase tracking-hud"><span className="font-bold text-[color:var(--text)]">RÉF INTERNE</span> : <Redacted w="6rem" /></p>
          {s.tagline && <p className="mt-3 border-l-2 border-accent pl-2 italic text-[color:var(--text)]">« {s.tagline} »</p>}
        </div>
      ),
    },
    {
      tag: '§2 · PROCÉDURES',
      node: (
        <div className="space-y-2 font-mono text-[10px] leading-relaxed text-[color:var(--text-dim)]">
          <p className="font-bold uppercase tracking-hud text-[color:var(--text)]">Rôle dans la structure</p>
          <p>{s.contribution ?? '—'}. Le partenaire est intégré au fonctionnement quotidien de <span className="text-accent">{brandName}</span> et audité chaque saison.</p>
          <p>Niveau d'accès aux installations : {d.classification ?? 'NIVEAU 1'}. Contact opérationnel classé <Redacted w="4rem" />.</p>
        </div>
      ),
    },
    {
      tag: '§3 · HISTORIQUE',
      node: (
        <div className="space-y-2 font-mono text-[10px] leading-relaxed text-[color:var(--text-dim)]">
          <p>{d.story ?? s.description ?? 'Partenariat actif.'}</p>
          <p>Évaluation : <span className="text-accent">visibilité maximale</span> sur les diffusions. Renouvellement <Redacted w="3.5rem" /> recommandé.</p>
          <p className="pt-1 text-[color:var(--text-mute)]">— rapport de l'agent {d.agent ?? '████'}</p>
        </div>
      ),
    },
    {
      tag: '§4 · ACTIVATION',
      node: (
        <div className="space-y-2 font-mono text-[10px] leading-relaxed text-[color:var(--text-dim)]">
          <p className="font-bold uppercase tracking-hud text-[color:var(--text)]">Points de contact visibles</p>
          <ul className="space-y-1">
            {(d.activation ?? ['Maillot', 'Live', 'Réseaux']).map((a) => (
              <li key={a}><span className="text-accent">▣</span> {a}</li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      tag: '§5 · ADDENDA / INTEL',
      node: (
        <div className="space-y-2 font-mono text-[10px] leading-relaxed text-[color:var(--text-dim)]">
          <ul className="space-y-1">
            {(d.intel ?? ['Partenariat actif']).map((x) => (
              <li key={x}>— {x}</li>
            ))}
          </ul>
          <div className="flex items-center justify-between pt-3">
            <span className="stamp -rotate-6 px-2 py-0.5 font-display text-[11px] font-bold uppercase tracking-wide2" style={{ color: 'var(--signal-ok)' }}>Approuvé</span>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="border-2 border-accent px-2 py-1 font-mono text-[8px] font-bold uppercase tracking-hud text-accent transition-colors hover:bg-accent hover:text-[color:var(--paper)]">▸ Site ↗</a>
          </div>
        </div>
      ),
    },
  ];
}

/* ── Focus : le dossier s'ouvre comme un livre (page à gauche) ── */
function DossierFocus({ s, i, onClose }: { s: Sponsor; i: number; onClose: () => void }) {
  const brand = useBrand();
  const pages = dossierPages(s, i, brand.name);
  const [enter, setEnter] = useState(false);

  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => setEnter(true));
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => { cancelAnimationFrame(id); document.removeEventListener('keydown', onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const close = () => { setEnter(false); window.setTimeout(onClose, 300); };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" aria-label="Fermer" onClick={close} className={`absolute inset-0 bg-base-900/92 backdrop-blur-sm transition-opacity duration-300 ${enter ? 'opacity-100' : 'opacity-0'}`} />

      <div style={{ transform: enter ? 'scale(1)' : 'scale(0.85)', opacity: enter ? 1 : 0, transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.3s' }}>
        <p className="mb-3 text-center font-mono text-[9px] uppercase tracking-hud text-[color:var(--text-mute)]">tire le coin des pages pour feuilleter</p>
        <FlipBook
          width={PW}
          height={PH}
          size="fixed"
          minWidth={PW}
          maxWidth={PW}
          minHeight={PH}
          maxHeight={PH}
          showCover
          usePortrait={false}
          drawShadow
          maxShadowOpacity={0.5}
          flippingTime={800}
          mobileScrollSupport={false}
          className="dossier-book"
        >
          {/* COUVERTURE (rigide) — se tourne comme un livre */}
          <Sheet hard>
            <Cover s={s} i={i} sealed={false} />
          </Sheet>

          {/* INTÉRIEUR DE COUVERTURE — sommaire */}
          <Leaf>
            <p className="font-mono text-[8px] font-bold uppercase tracking-hud text-[color:var(--text-mute)]">PROPRIÉTÉ DE {brand.name} · CONFIDENTIEL</p>
            <div className="mt-3 flex items-center justify-center border-2 border-line-strong bg-base-800 py-8">
              <span className="stamp px-4 py-2 font-display text-2xl font-bold uppercase tracking-hud">{s.name}</span>
            </div>
            <div className="mt-4 space-y-1">
              <p className="font-mono text-[8px] uppercase tracking-hud text-[color:var(--text-mute)]">SOMMAIRE</p>
              {pages.map((pg) => (
                <p key={pg.tag} className="font-mono text-[9px] uppercase tracking-hud text-[color:var(--text-dim)]">· {pg.tag}</p>
              ))}
            </div>
            <p className="mt-auto font-mono text-[8px] uppercase tracking-hud text-[color:var(--text-mute)]">DOSSIER {caseNo(s, i)}</p>
          </Leaf>

          {/* PAGES LORE */}
          {pages.map((p) => (
            <Leaf key={p.tag}>
              <p className="mb-2 border-b border-line-strong pb-1 font-mono text-[9px] font-bold uppercase tracking-hud text-accent">{p.tag}</p>
              <div className="flex-1 overflow-hidden">{p.node}</div>
              <span className="ticket-barcode mt-2 h-3 w-16 self-end text-[color:var(--text-dim)]" />
            </Leaf>
          ))}

          {/* DOS (rigide) */}
          <Sheet hard>
            <div className="flex h-full w-full flex-col items-center justify-center gap-2" style={{ background: FOLDER, color: 'var(--text)' }}>
              <span className="stamp px-3 py-1 font-display text-lg font-bold uppercase tracking-hud">{brand.name}</span>
              <span className="font-mono text-[8px] uppercase tracking-hud text-[color:var(--text-mute)]">— fin du dossier —</span>
            </div>
          </Sheet>
        </FlipBook>
      </div>

      <button type="button" onClick={close} className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center border-2 border-accent bg-base-900 font-mono text-accent" aria-label="Fermer">×</button>
    </div>
  );
}

/* ── Table : dossiers scatter + drag + flottement ───────────── */
interface Pos { x: number; y: number; rot: number; z: number; }
interface Dyn { ox: number; oy: number; vx: number; vy: number; }

export function SponsorDossiers() {
  const { sponsors } = useData();
  const list = sponsors;
  const [focus, setFocus] = useState<{ s: Sponsor; i: number; rect: DOMRect } | null>(null);

  const tableRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const posRef = useRef<Record<string, Pos>>({});
  const dynRef = useRef<Record<string, Dyn>>({});
  const zc = useRef(1);
  const [, force] = useState(0);
  const dragId = useRef<string | null>(null);
  const dragInfo = useRef({ sx: 0, sy: 0, ox: 0, oy: 0, moved: false });

  useLayoutEffect(() => {
    const el = tableRef.current;
    if (!el) return;
    const W = el.clientWidth;
    const H = el.clientHeight;
    list.forEach((s, i) => {
      let seed = (i + 1) * 9301 + 49297;
      const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
      posRef.current[s.id] = { x: 16 + rnd() * Math.max(1, W - FW - 32), y: 16 + rnd() * Math.max(1, H - FH - 32), rot: (rnd() - 0.5) * 14, z: i + 1 };
      dynRef.current[s.id] = { ox: 0, oy: 0, vx: 0, vy: 0 };
    });
    zc.current = list.length + 1;
    force((n) => n + 1);
  }, [list]);

  useEffect(() => {
    const el = tableRef.current;
    if (!el || !window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let mx = -9999, my = -9999;
    let rect = el.getBoundingClientRect();
    const onMove = (e: PointerEvent) => ((mx = e.clientX), (my = e.clientY));
    const onScroll = () => (rect = el.getBoundingClientRect());
    let raf = 0, running = false;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      list.forEach((s, i) => {
        if (dragId.current === s.id) return;
        const base = posRef.current[s.id]; const d = dynRef.current[s.id]; const node = nodeRefs.current[s.id];
        if (!base || !d || !node) return;
        const cx = rect.left + base.x + FW / 2 + d.ox; const cy = rect.top + base.y + FH / 2 + d.oy;
        const dxp = cx - mx; const dyp = cy - my; const dist = Math.hypot(dxp, dyp) || 1;
        if (dist < 210) { const f = (1 - dist / 210) * 0.5; d.vx += (dxp / dist) * f; d.vy += (dyp / dist) * f; }
        d.vx += -0.025 * d.ox; d.vy += -0.025 * d.oy; d.vx *= 0.9; d.vy *= 0.9; d.ox += d.vx; d.oy += d.vy;
        const idleX = Math.sin(t * 0.7 + i) * 2.2; const idleY = Math.cos(t * 0.55 + i * 1.3) * 2.2;
        node.style.transform = `translate(${(base.x + d.ox + idleX).toFixed(1)}px, ${(base.y + d.oy + idleY).toFixed(1)}px) rotate(${(base.rot + d.ox * 0.05).toFixed(2)}deg)`;
        node.style.zIndex = String(base.z);
      });
      raf = requestAnimationFrame(tick);
    };
    const start = () => !running && ((running = true), (raf = requestAnimationFrame(tick)));
    const stop = () => ((running = false), cancelAnimationFrame(raf));
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0 });
    io.observe(el);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { io.disconnect(); stop(); window.removeEventListener('pointermove', onMove); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, [list]);

  const onPointerDown = (e: React.PointerEvent, id: string) => {
    const p = posRef.current[id]; const d = dynRef.current[id];
    if (!p || !d) return;
    dragId.current = id;
    dragInfo.current = { sx: e.clientX, sy: e.clientY, ox: p.x + d.ox, oy: p.y + d.oy, moved: false };
    p.z = ++zc.current;
    window.addEventListener('pointermove', onMoveDrag);
    window.addEventListener('pointerup', onUpDrag);
  };
  const onMoveDrag = (e: PointerEvent) => {
    const id = dragId.current; if (!id) return;
    const di = dragInfo.current; const dx = e.clientX - di.sx; const dy = e.clientY - di.sy;
    if (Math.hypot(dx, dy) > 5) di.moved = true;
    const p = posRef.current[id]; const d = dynRef.current[id];
    p.x = di.ox + dx; p.y = di.oy + dy; d.ox = 0; d.oy = 0; d.vx = 0; d.vy = 0;
    const node = nodeRefs.current[id];
    if (node) { node.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg)`; node.style.zIndex = String(p.z); }
  };
  const onUpDrag = () => {
    const id = dragId.current;
    window.removeEventListener('pointermove', onMoveDrag);
    window.removeEventListener('pointerup', onUpDrag);
    dragId.current = null;
    if (id && !dragInfo.current.moved) {
      const node = nodeRefs.current[id]; const i = list.findIndex((x) => x.id === id);
      if (node && i >= 0) setFocus({ s: list[i], i, rect: node.getBoundingClientRect() });
    }
  };

  return (
    <div className="mt-8">
      <p className="mb-4 font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)]">
        &gt; déplace les dossiers · clique pour en ouvrir un (scellé)
      </p>

      <div ref={tableRef} className="relative hidden h-[680px] w-full overflow-hidden border-2 border-line-strong bg-base-900/60 dot-grid md:block">
        {list.map((s, i) => {
          const p = posRef.current[s.id];
          return (
            <div
              key={s.id}
              ref={(el) => (nodeRefs.current[s.id] = el)}
              onPointerDown={(e) => onPointerDown(e, s.id)}
              className="absolute left-0 top-0 cursor-grab touch-none will-change-transform active:cursor-grabbing"
              style={{ transform: p ? `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg)` : undefined, zIndex: p?.z, opacity: focus?.s.id === s.id ? 0 : 1 }}
            >
              <DossierFolder s={s} i={i} />
            </div>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-10 md:hidden">
        {list.map((s, i) => (
          <div key={s.id} style={{ transform: `rotate(${(i % 5) - 2}deg)`, opacity: focus?.s.id === s.id ? 0 : 1 }} onClick={(e) => setFocus({ s, i, rect: e.currentTarget.getBoundingClientRect() })}>
            <DossierFolder s={s} i={i} />
          </div>
        ))}
      </div>

      {focus && <DossierFocus s={focus.s} i={focus.i} onClose={() => setFocus(null)} />}
    </div>
  );
}
