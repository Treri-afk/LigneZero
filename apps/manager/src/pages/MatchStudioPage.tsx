import { useEffect, useMemo, useRef, useState } from 'react';
import { useBrand } from '@/lib/useBrand';
import type { Game, Match, TicketDoc, TicketEl, TicketFont, TicketAlign } from '@lignezero/types';
import { defaultDoc, resolveTicket, buildCtx, fillTokens, docLayout, panelBackground, patternStyle, panelCorners, innerRadii, foilBackground, ShapeSvg, shapeToPoints, SEAM, TICKET_TOKENS, type TicketMatch } from '@lignezero/ticket';
import type { TicketPanel, TicketPattern, TicketCorners, TicketFoil, TicketFoilType, TicketShapeVariant, TicketShapeEl, TicketPathPoint } from '@lignezero/types';
import { db } from '@/lib/supabase';
import { Button, Panel, Spinner } from '@/components/ui';
import { ImageField } from '@/components/ImageField';

/**
 * STUDIO MATCH — éditeur canvas du ticket. Deux panneaux distincts (corps |
 * talon) séparés par la césure = ligne d'arrachage conservée sur le calendrier.
 * Le document (TicketDoc) est enregistré sur le match et rendu à l'identique
 * partout via @lignezero/ticket.
 */

const FONT: Record<TicketFont, string> = {
  display: "'Chakra Petch', sans-serif",
  mono: "'JetBrains Mono', monospace",
  sans: 'Inter, system-ui, sans-serif',
};

type PanelKey = 'body' | 'stub';

const toTicketMatch = (m: Match): TicketMatch => ({
  id: m.id,
  opponentName: m.opponent.name,
  dateISO: m.dateISO,
  competition: m.competition,
  status: m.status,
  score: m.score,
  streamUrl: m.streamUrl,
  vodUrl: m.vodUrl,
});

const uid = () => 'e' + Math.random().toString(36).slice(2, 8);

function newElement(type: TicketEl['type'], ink: string): TicketEl {
  const base = { id: uid(), x: 12, y: 12, w: 80, h: 24 };
  switch (type) {
    case 'text':
      return { ...base, type: 'text', text: 'Texte {opponent}', font: 'display', size: 18, weight: 700, color: ink, align: 'left', uppercase: true };
    case 'rect':
      return { ...base, type: 'rect', w: 60, h: 20, color: ink };
    case 'image':
      return { ...base, type: 'image', w: 60, h: 60, url: '', fit: 'cover' };
    case 'barcode':
      return { ...base, type: 'barcode', w: 90, h: 22, color: ink };
    case 'qr':
      return { ...base, type: 'qr', w: 40, h: 40, color: ink };
    case 'shape':
      return { ...base, type: 'shape', w: 48, h: 48, variant: 'rect', fill: ink, points: 5 };
  }
}

export function MatchStudioPage() {
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [matchId, setMatchId] = useState('');
  const [doc, setDoc] = useState<TicketDoc | null>(null);
  const [panel, setPanel] = useState<PanelKey>('body');
  const [selIds, setSelIds] = useState<string[]>([]);
  const [activePoint, setActivePoint] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const past = useRef<TicketDoc[]>([]);
  const future = useRef<TicketDoc[]>([]);
  const lastTag = useRef<{ tag?: string; t: number }>({ t: 0 });
  const [, forceHist] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [ms, gs] = await Promise.all([db.listMatches(), db.listGames()]);
        setMatches(ms);
        setGames(gs);
        if (ms.length) selectMatch(ms[0]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectMatch(m: Match) {
    setMatchId(m.id);
    setDoc(m.ticket?.doc ?? defaultDoc(resolveTicket(m.ticket)));
    setSelIds([]);
    setActivePoint(null);
    past.current = [];
    future.current = [];
    forceHist((x) => x + 1);
    setMsg(null);
  }

  const match = matches?.find((m) => m.id === matchId) ?? null;
  const gameTag = useMemo(() => games.find((g) => g.id === match?.gameId)?.tag ?? '—', [games, match]);
  const brand = useBrand();
  const ctx = useMemo(() => (match ? buildCtx(toTicketMatch(match), gameTag, brand.name) : null), [match, gameTag, brand.name]);

  const single = selIds.length === 1;
  const selEl = doc && single ? doc[panel].elements.find((e) => e.id === selIds[0]) ?? null : null;

  // ── Historique (undo/redo) ──
  function snapshot(tag?: string) {
    if (!doc) return;
    const now = Date.now();
    if (tag && lastTag.current.tag === tag && now - lastTag.current.t < 700) { lastTag.current = { tag, t: now }; return; }
    lastTag.current = { tag, t: now };
    past.current.push(structuredClone(doc));
    if (past.current.length > 60) past.current.shift();
    future.current = [];
    forceHist((x) => x + 1);
  }
  function undo() {
    if (!past.current.length || !doc) return;
    future.current.push(structuredClone(doc));
    setDoc(past.current.pop()!);
    setActivePoint(null);
    forceHist((x) => x + 1);
  }
  function redo() {
    if (!future.current.length || !doc) return;
    past.current.push(structuredClone(doc));
    setDoc(future.current.pop()!);
    setActivePoint(null);
    forceHist((x) => x + 1);
  }

  function select(id: string | null, additive = false) {
    setActivePoint(null);
    if (id == null) return setSelIds([]);
    if (additive) setSelIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    else setSelIds([id]);
  }

  function patchDoc(fn: (d: TicketDoc) => TicketDoc, tag?: string) {
    snapshot(tag);
    setDoc((d) => (d ? fn(structuredClone(d)) : d));
  }
  function patchEl(patch: Partial<TicketEl>, tag?: string) {
    if (!single) return;
    patchDoc((d) => {
      const arr = d[panel].elements;
      const i = arr.findIndex((e) => e.id === selIds[0]);
      if (i >= 0) arr[i] = { ...arr[i], ...patch } as TicketEl;
      return d;
    }, tag);
  }
  /** Déplacement multi (drag) sans historique — snapshot pris au pointerdown. */
  function moveMany(pk: PanelKey, updates: { id: string; x: number; y: number }[]) {
    setDoc((d) => {
      if (!d) return d;
      const nd = structuredClone(d);
      updates.forEach((u) => { const el = nd[pk].elements.find((e) => e.id === u.id); if (el) { el.x = u.x; el.y = u.y; } });
      return nd;
    });
  }
  function addEl(type: TicketEl['type']) {
    const el = newElement(type, panel === 'body' ? '#0d0d0b' : '#f4f0e6');
    patchDoc((d) => { d[panel].elements.push(el); return d; });
    setSelIds([el.id]);
  }
  function removeEl() {
    if (!selIds.length) return;
    patchDoc((d) => { d[panel].elements = d[panel].elements.filter((e) => !selIds.includes(e.id)); return d; });
    setSelIds([]);
  }
  function dupEl() {
    if (!selEl) return;
    const copy = { ...structuredClone(selEl), id: uid(), x: selEl.x + 8, y: selEl.y + 8 };
    patchDoc((d) => { d[panel].elements.push(copy); return d; });
    setSelIds([copy.id]);
  }
  function reorder(dir: 1 | -1) {
    if (!single) return;
    patchDoc((d) => {
      const arr = d[panel].elements;
      const i = arr.findIndex((e) => e.id === selIds[0]);
      const j = i + dir;
      if (i >= 0 && j >= 0 && j < arr.length) [arr[i], arr[j]] = [arr[j], arr[i]];
      return d;
    });
  }
  function applyTemplate(tplDoc: TicketDoc) {
    snapshot();
    setDoc(structuredClone(tplDoc));
    setSelIds([]);
    setActivePoint(null);
    setMsg('Template appliqué (pense à Enregistrer)');
  }
  function align(mode: 'left' | 'hcenter' | 'right' | 'top' | 'vmiddle' | 'bottom') {
    if (selIds.length < 2) return;
    patchDoc((d) => {
      const arr = d[panel].elements.filter((e) => selIds.includes(e.id));
      const minX = Math.min(...arr.map((e) => e.x)), maxX = Math.max(...arr.map((e) => e.x + e.w));
      const minY = Math.min(...arr.map((e) => e.y)), maxY = Math.max(...arr.map((e) => e.y + e.h));
      const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
      arr.forEach((e) => {
        if (mode === 'left') e.x = minX; else if (mode === 'right') e.x = maxX - e.w; else if (mode === 'hcenter') e.x = Math.round(cx - e.w / 2);
        else if (mode === 'top') e.y = minY; else if (mode === 'bottom') e.y = maxY - e.h; else if (mode === 'vmiddle') e.y = Math.round(cy - e.h / 2);
      });
      return d;
    });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (meta && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selIds.length) { e.preventDefault(); removeEl(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  async function save() {
    if (!match || !doc) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      await db.setMatchTicket(match.id, { doc });
      setMatches((ms) => ms?.map((m) => (m.id === match.id ? { ...m, ticket: { ...(m.ticket ?? {}), doc } } : m)) ?? ms);
      setMsg('Ticket enregistré ✓ (calendrier + inventaire à jour)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  if (error && !matches) return <p className="border border-[color:var(--accent)] px-3 py-2 font-mono text-xs text-accent">{error}</p>;
  if (!matches || !match || !doc || !ctx) {
    return matches && matches.length === 0 ? (
      <Panel title="Studio match"><p className="font-mono text-sm text-[color:var(--text-mute)]">Aucun match. Crée-en dans le Calendrier.</p></Panel>
    ) : (
      <Spinner label="Chargement…" />
    );
  }

  const l = docLayout(doc);
  const scale = Math.min(620 / doc.width, 360 / doc.height, 2.6);

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <p className="hud-label text-[11px]">MTK // Studio match</p>
          <h1 className="font-display text-3xl font-bold uppercase tracking-hud">Studio match</h1>
          <p className="mt-1 font-mono text-xs text-[color:var(--text-dim)]">&gt; Éditeur de ticket. Corps | talon = 2 panneaux (la césure reste la ligne d'arrachage).</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="field w-56"
            value={matchId}
            onChange={(e) => { const m = matches.find((x) => x.id === e.target.value); if (m) selectMatch(m); }}
          >
            {matches.map((m) => (
              <option key={m.id} value={m.id}>{new Date(m.dateISO).toLocaleDateString('fr-FR')} · vs {m.opponent.name}{m.ticket?.doc ? ' ✓' : ''}</option>
            ))}
          </select>
          <button onClick={undo} disabled={!past.current.length} title="Annuler (Ctrl+Z)" className="border border-line-strong px-2 py-1.5 font-mono text-xs text-[color:var(--text-dim)] disabled:opacity-40 hover:border-line-bright">↶</button>
          <button onClick={redo} disabled={!future.current.length} title="Rétablir (Ctrl+Shift+Z)" className="border border-line-strong px-2 py-1.5 font-mono text-xs text-[color:var(--text-dim)] disabled:opacity-40 hover:border-line-bright">↷</button>
          <Button variant="ghost" onClick={() => { snapshot(); setDoc(defaultDoc(resolveTicket(match.ticket))); setSelIds([]); }}>Réinit.</Button>
          <Button onClick={save} disabled={busy}>{busy ? '…' : 'Enregistrer'}</Button>
        </div>
      </header>

      {error && <p className="mb-4 border border-[color:var(--accent)] px-3 py-2 font-mono text-xs text-accent">{error}</p>}
      {msg && <p className="mb-4 border border-line-strong px-3 py-2 font-mono text-xs text-[color:var(--signal-ok)]">{msg}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* ── Canvas + outils ── */}
        <div className="space-y-4">
          {/* barre d'outils */}
          <div className="panel flex flex-wrap items-center gap-2 p-3">
            <span className="hud-label text-[10px]">Panneau</span>
            {(['body', 'stub'] as const).map((p) => (
              <button key={p} onClick={() => { setPanel(p); setSelIds([]); }} className={`border px-2.5 py-1 font-mono text-[11px] uppercase tracking-hud ${panel === p ? 'border-accent bg-accent text-ink' : 'border-line-strong text-[color:var(--text-dim)]'}`}>
                {p === 'body' ? 'Corps' : 'Talon'}
              </button>
            ))}
            <span className="mx-2 h-5 w-px bg-line-strong" />
            <span className="hud-label text-[10px]">+ Élément</span>
            {(['text', 'shape', 'rect', 'image', 'barcode', 'qr'] as const).map((t) => (
              <button key={t} onClick={() => addEl(t)} className="border border-line-strong px-2.5 py-1 font-mono text-[11px] uppercase tracking-hud text-[color:var(--text-dim)] hover:border-line-bright">
                {t === 'text' ? 'Texte' : t === 'shape' ? 'Forme' : t === 'rect' ? 'Bloc' : t === 'image' ? 'Image' : t === 'barcode' ? 'Code-barres' : 'QR'}
              </button>
            ))}
          </div>

          {/* scène */}
          <div className="panel overflow-auto p-8">
            <div className="relative mx-auto flex" style={{ width: doc.width * scale, height: doc.height * scale }} onPointerDown={() => { setSelIds([]); setActivePoint(null); }}>
              <BridgePreview doc={doc} l={l} scale={scale} />
              <EditPanel panelKey="body" doc={doc} ctx={ctx} w={l.bodyW} h={l.height} scale={scale} radius={doc.radius} round="left" active={panel === 'body'} selIds={selIds} activePoint={activePoint} onSelectPoint={setActivePoint} onSelect={(id, additive) => { setPanel('body'); select(id, additive); }} onDragStart={() => snapshot('drag')} onMoveMany={(u) => moveMany('body', u)} onPatch={(id, patch) => setDoc((d) => (d ? patchElIn(d, 'body', id, patch) : d))} />
              <Seam doc={doc} part="body" scale={scale} />
              <Seam doc={doc} part="stub" scale={scale} />
              <EditPanel panelKey="stub" doc={doc} ctx={ctx} w={l.stubW} h={l.height} scale={scale} radius={doc.radius} round="right" active={panel === 'stub'} selIds={selIds} activePoint={activePoint} onSelectPoint={setActivePoint} onSelect={(id, additive) => { setPanel('stub'); select(id, additive); }} onDragStart={() => snapshot('drag')} onMoveMany={(u) => moveMany('stub', u)} onPatch={(id, patch) => setDoc((d) => (d ? patchElIn(d, 'stub', id, patch) : d))} />
            </div>
            <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)]">
              {doc.width}×{doc.height} · corps {Math.round(l.bodyW)} · talon {l.stubW} · glisse un élément pour le déplacer
            </p>
          </div>

          {/* format global (structure) */}
          <Panel title="Format (global)">
            <div className="grid grid-cols-3 gap-3">
              <NumField label="Largeur" value={doc.width} onChange={(v) => patchDoc((d) => ((d.width = clamp(v, 120, 1200)), d))} />
              <NumField label="Hauteur" value={doc.height} onChange={(v) => patchDoc((d) => ((d.height = clamp(v, 80, 1200)), d))} />
              <NumField label="Angles" value={doc.radius} onChange={(v) => patchDoc((d) => ((d.radius = clamp(v, 0, 120)), d))} />
              <NumField label="Larg. talon" value={doc.stubWidth} onChange={(v) => patchDoc((d) => ((d.stubWidth = clamp(v, 0, d.width - SEAM - 20)), d))} />
              <div>
                <label className="label">Césure</label>
                <select className="field" value={doc.seam ?? 'dots'} onChange={(e) => patchDoc((d) => ((d.seam = e.target.value as 'dots' | 'none'), d))}>
                  <option value="dots">Perforée</option>
                  <option value="none">Aucune</option>
                </select>
              </div>
            </div>
          </Panel>

          {/* design INDÉPENDANT du panneau sélectionné */}
          <Panel
            title={`Design · ${panel === 'body' ? 'Corps' : 'Talon'}`}
            right={
              <div className="flex gap-1">
                {(['body', 'stub'] as const).map((p) => (
                  <button key={p} onClick={() => { setPanel(p); setSelIds([]); }} className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-hud ${panel === p ? 'border-accent bg-accent text-ink' : 'border-line-strong text-[color:var(--text-dim)]'}`}>{p === 'body' ? 'Corps' : 'Talon'}</button>
                ))}
              </div>
            }
          >
            <PanelDesign panel={doc[panel]} globalRadius={doc.radius} onPatch={(fn) => patchDoc((d) => (fn(d[panel]), d))} />
          </Panel>

          <TemplatesPanel doc={doc} onApply={applyTemplate} />
        </div>

        {/* ── Inspecteur ── */}
        <div className="space-y-4">
          <LayersPanel doc={doc} panel={panel} selIds={selIds} onSelect={(id, add) => { select(id, add); }} onPatchDoc={patchDoc} />
          {single && selEl ? (
            <Inspector el={selEl} onPatch={patchEl} onRemove={removeEl} onDup={dupEl} onReorder={reorder} activePoint={activePoint} onSelectPoint={setActivePoint} />
          ) : selIds.length > 1 ? (
            <MultiPanel count={selIds.length} onRemove={removeEl} onAlign={align} />
          ) : (
            <Panel title="Inspecteur"><p className="font-mono text-xs text-[color:var(--text-mute)]">Sélectionne un élément (Maj-clic = multi), ou ajoute-en un.</p></Panel>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Panneau de calques ──
function elLabel(el: TicketEl): string {
  if (el.type === 'text') return `Texte « ${el.text.slice(0, 14)} »`;
  if (el.type === 'shape') return `Forme ${el.variant}`;
  if (el.type === 'rect') return 'Bloc';
  if (el.type === 'image') return 'Image';
  if (el.type === 'barcode') return 'Code-barres';
  return 'QR';
}
function LayersPanel({ doc, panel, selIds, onSelect, onPatchDoc }: { doc: TicketDoc; panel: PanelKey; selIds: string[]; onSelect: (id: string, additive: boolean) => void; onPatchDoc: (fn: (d: TicketDoc) => TicketDoc) => void }) {
  const els = doc[panel].elements;
  const set = (id: string, patch: Partial<TicketEl>) => onPatchDoc((d) => { const e = d[panel].elements.find((x) => x.id === id); if (e) Object.assign(e, patch); return d; });
  const move = (id: string, dir: 1 | -1) => onPatchDoc((d) => { const a = d[panel].elements; const i = a.findIndex((x) => x.id === id); const j = i + dir; if (i >= 0 && j >= 0 && j < a.length) [a[i], a[j]] = [a[j], a[i]]; return d; });
  const del = (id: string) => onPatchDoc((d) => { d[panel].elements = d[panel].elements.filter((x) => x.id !== id); return d; });
  return (
    <Panel title={`Calques · ${panel === 'body' ? 'Corps' : 'Talon'}`}>
      <div className="max-h-64 space-y-1 overflow-auto">
        {els.length === 0 && <p className="font-mono text-xs text-[color:var(--text-mute)]">Aucun élément.</p>}
        {els.map((el, idx) => (
          <div key={el.id} className="flex items-center gap-1 border px-1 py-0.5" style={{ borderColor: selIds.includes(el.id) ? 'var(--accent)' : 'var(--line)' }}>
            <button onClick={() => set(el.id, { hidden: !el.hidden })} title="Masquer" className="px-0.5 text-xs">{el.hidden ? '🙈' : '👁'}</button>
            <button onClick={() => set(el.id, { locked: !el.locked })} title="Verrouiller" className="px-0.5 text-xs">{el.locked ? '🔒' : '🔓'}</button>
            <input className="field h-6 flex-1 py-0 text-[11px]" value={el.name ?? ''} placeholder={elLabel(el)} onChange={(e) => set(el.id, { name: e.target.value || undefined })} onClick={(e) => onSelect(el.id, e.shiftKey)} />
            <button onClick={() => move(el.id, 1)} disabled={idx === els.length - 1} title="Monter" className="px-0.5 text-xs text-[color:var(--text-mute)] disabled:opacity-30">↑</button>
            <button onClick={() => move(el.id, -1)} disabled={idx === 0} title="Descendre" className="px-0.5 text-xs text-[color:var(--text-mute)] disabled:opacity-30">↓</button>
            <button onClick={() => del(el.id)} title="Supprimer" className="px-0.5 text-xs text-accent">✕</button>
          </div>
        ))}
      </div>
      <p className="mt-1 font-mono text-[9px] text-[color:var(--text-mute)]">Haut de liste = premier plan. Maj-clic sur un nom = multi-sélection.</p>
    </Panel>
  );
}

// ── Multi-sélection : alignement + suppression ──
function MultiPanel({ count, onRemove, onAlign }: { count: number; onRemove: () => void; onAlign: (m: 'left' | 'hcenter' | 'right' | 'top' | 'vmiddle' | 'bottom') => void }) {
  const btns: [string, string][] = [['left', '⬅'], ['hcenter', '↔'], ['right', '➡'], ['top', '⬆'], ['vmiddle', '↕'], ['bottom', '⬇']];
  return (
    <Panel title={`${count} éléments sélectionnés`}>
      <p className="mb-2 font-mono text-[10px] text-[color:var(--text-mute)]">Aligner</p>
      <div className="grid grid-cols-6 gap-1">
        {btns.map(([m, ic]) => <button key={m} onClick={() => onAlign(m as 'left')} className="border border-line-strong py-1.5 font-mono text-sm text-[color:var(--text-dim)] hover:border-accent">{ic}</button>)}
      </div>
      <button onClick={onRemove} className="mt-3 w-full border border-[color:var(--accent)] py-1.5 font-mono text-xs uppercase tracking-hud text-accent">Supprimer la sélection</button>
    </Panel>
  );
}

// ── Bibliothèque de templates ──
function TemplatesPanel({ doc, onApply }: { doc: TicketDoc; onApply: (tplDoc: TicketDoc) => void }) {
  const [items, setItems] = useState<import('@lignezero/types').TicketTemplate[] | null>(null);
  const [name, setName] = useState('');
  const load = () => db.listTicketTemplates().then(setItems);
  useEffect(() => { load(); }, []);
  async function save() { if (!name.trim()) return; await db.saveTicketTemplate(name.trim(), doc); setName(''); load(); }
  async function remove(id: string) { await db.removeTicketTemplate(id); load(); }
  return (
    <Panel title="Templates">
      <div className="flex gap-2">
        <input className="field" value={name} placeholder="Nom du template…" onChange={(e) => setName(e.target.value)} />
        <Button variant="ghost" onClick={save}>Sauver</Button>
      </div>
      <div className="mt-3 max-h-48 space-y-1 overflow-auto">
        {items && items.length === 0 && <p className="font-mono text-xs text-[color:var(--text-mute)]">Aucun template. Sauve ton design pour le réutiliser.</p>}
        {items?.map((t) => (
          <div key={t.id} className="flex items-center gap-2 border border-line px-2 py-1 font-mono text-xs">
            <span className="flex-1 truncate text-[color:var(--text-dim)]">{t.name}</span>
            <button onClick={() => onApply(t.doc)} className="border border-line-strong px-1.5 text-[color:var(--text-dim)] hover:border-accent hover:text-accent">Appliquer</button>
            <button onClick={() => remove(t.id)} className="text-accent">✕</button>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function patchElIn(d: TicketDoc, panel: PanelKey, id: string, patch: Partial<TicketEl>): TicketDoc {
  const nd = structuredClone(d);
  const arr = nd[panel].elements;
  const i = arr.findIndex((e) => e.id === id);
  if (i >= 0) arr[i] = { ...arr[i], ...patch } as TicketEl;
  return nd;
}

/* ── Panneau éditable : rendu WYSIWYG + drag/resize ── */
function EditPanel({
  panelKey, doc, ctx, w, h, scale, radius, round, active, selIds, activePoint, onSelectPoint, onSelect, onDragStart, onMoveMany, onPatch,
}: {
  panelKey: PanelKey;
  doc: TicketDoc;
  ctx: ReturnType<typeof buildCtx>;
  w: number; h: number; scale: number; radius: number; round: 'left' | 'right';
  active: boolean; selIds: string[];
  activePoint: number | null;
  onSelectPoint: (i: number | null) => void;
  onSelect: (id: string, additive: boolean) => void;
  onDragStart: () => void;
  onMoveMany: (updates: { id: string; x: number; y: number }[]) => void;
  onPatch: (id: string, patch: Partial<TicketEl>) => void;
}) {
  const panel = doc[panelKey];
  const c = panelCorners(panel, round, radius);
  const hasPattern = panel.pattern && panel.pattern !== 'none';
  const dragRef = useRef<{ mode: 'move' | 'resize'; sx: number; sy: number; w: number; h: number; id: string; starts: { id: string; x: number; y: number }[] } | null>(null);
  const locked = (el: TicketEl) => !!el.locked;

  function onDown(e: React.PointerEvent, el: TicketEl, mode: 'move' | 'resize') {
    e.stopPropagation();
    if (locked(el)) return;
    const additive = e.shiftKey || e.metaKey || e.ctrlKey;
    onSelect(el.id, additive);
    onDragStart();
    // ensemble à déplacer : la sélection courante si l'élément en fait partie (clic simple), sinon lui seul
    const group = !additive && selIds.includes(el.id) ? selIds : [el.id];
    const starts = panel.elements.filter((x) => group.includes(x.id) && !x.locked).map((x) => ({ id: x.id, x: x.x, y: x.y }));
    dragRef.current = { mode, sx: e.clientX, sy: e.clientY, w: el.w, h: el.h, id: el.id, starts };
    const move = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = (ev.clientX - d.sx) / scale;
      const dy = (ev.clientY - d.sy) / scale;
      if (d.mode === 'move') onMoveMany(d.starts.map((s) => ({ id: s.id, x: Math.round(s.x + dx), y: Math.round(s.y + dy) })));
      else onPatch(d.id, { w: Math.max(6, Math.round(d.w + dx)), h: Math.max(6, Math.round(d.h + dy)) });
    };
    const up = () => { dragRef.current = null; window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  return (
    <div
      style={{
        position: 'relative', width: w * scale, height: h * scale, flexShrink: 0, overflow: 'hidden',
        background: panelBackground(panel),
        borderRadius: `${c.tl * scale}px ${c.tr * scale}px ${c.br * scale}px ${c.bl * scale}px`,
        boxShadow: panel.border ? `inset 0 0 0 ${panel.border.width * scale}px ${panel.border.color}` : undefined,
        outline: active ? '1px dashed rgba(242,49,39,0.5)' : 'none',
      }}
    >
      {hasPattern && <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: panel.patternOpacity ?? (panel.pattern === 'holo' ? 0.7 : 0.15), ...patternStyle(panel.pattern as string, panel.patternColor || '#0d0d0b', panel.patternAngle) }} />}
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${scale})`, transformOrigin: 'top left', width: w, height: h }}>
        {panel.elements.filter((el) => !el.hidden).map((el) => (
          <EditableEl key={el.id} el={el} ctx={ctx} selected={selIds.includes(el.id)} onDown={onDown} scale={scale} />
        ))}
        {(() => {
          const sel = selIds.length === 1 ? panel.elements.find((e) => e.id === selIds[0]) : undefined;
          if (sel && sel.type === 'shape' && sel.variant === 'path') {
            return <PathEditor el={sel} scale={scale} activePoint={activePoint} onSelectPoint={onSelectPoint} onPatch={(patch) => onPatch(sel.id, patch)} />;
          }
          return null;
        })()}
      </div>
    </div>
  );
}

/** Overlay d'édition d'un tracé : poignées draggables + insertion de points. */
function PathEditor({ el, scale, activePoint, onSelectPoint, onPatch }: { el: TicketShapeEl; scale: number; activePoint: number | null; onSelectPoint: (i: number | null) => void; onPatch: (patch: Partial<TicketEl>) => void }) {
  const pts = el.path && el.path.length >= 2 ? el.path : shapeToPoints('rect');
  const closed = el.closed ?? true;
  const s = 10 / scale;
  const abs = (p: TicketPathPoint) => ({ x: el.x + p.x * el.w, y: el.y + p.y * el.h });

  function dragPoint(e: React.PointerEvent, i: number) {
    e.stopPropagation();
    onSelectPoint(i);
    const sx = e.clientX, sy = e.clientY, ox = pts[i].x, oy = pts[i].y;
    const move = (ev: PointerEvent) => {
      const nx = Math.round(clamp(ox + (ev.clientX - sx) / scale / el.w, 0, 1) * 1000) / 1000;
      const ny = Math.round(clamp(oy + (ev.clientY - sy) / scale / el.h, 0, 1) * 1000) / 1000;
      onPatch({ path: pts.map((p, j) => (j === i ? { ...p, x: nx, y: ny } : p)) });
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }
  function insert(i: number) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    onPatch({ path: [...pts.slice(0, i + 1), mid, ...pts.slice(i + 1)] });
    onSelectPoint(i + 1);
  }
  function dragHandle(e: React.PointerEvent, i: number, which: 'cIn' | 'cOut') {
    e.stopPropagation();
    const h = pts[i][which];
    if (!h) return;
    const sx = e.clientX, sy = e.clientY, ox = h.x, oy = h.y;
    const move = (ev: PointerEvent) => {
      const nx = Math.round(clamp(ox + (ev.clientX - sx) / scale / el.w, 0, 1) * 1000) / 1000;
      const ny = Math.round(clamp(oy + (ev.clientY - sy) / scale / el.h, 0, 1) * 1000) / 1000;
      onPatch({ path: pts.map((p, j) => (j === i ? { ...p, [which]: { x: nx, y: ny } } : p)) });
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }
  const line = (a: { x: number; y: number }, b: { x: number; y: number }, key: string) => {
    const dx = b.x - a.x, dy = b.y - a.y;
    return <div key={key} style={{ position: 'absolute', left: a.x, top: a.y, width: Math.hypot(dx, dy), height: 1 / scale, background: '#4dd2ff', transform: `rotate(${Math.atan2(dy, dx)}rad)`, transformOrigin: '0 0', zIndex: 4, pointerEvents: 'none' }} />;
  };
  const edges = closed ? pts.length : pts.length - 1;
  const ap = activePoint != null ? pts[activePoint] : null;

  return (
    <>
      {Array.from({ length: edges }, (_, i) => {
        const a = abs(pts[i]), b = abs(pts[(i + 1) % pts.length]);
        return <div key={'m' + i} onPointerDown={(e) => { e.stopPropagation(); insert(i); }} title="Ajouter un point" style={{ position: 'absolute', left: (a.x + b.x) / 2, top: (a.y + b.y) / 2, width: s * 0.75, height: s * 0.75, transform: 'translate(-50%,-50%)', borderRadius: '50%', background: '#fff', border: `${1 / scale}px solid #4dd2ff`, cursor: 'copy', zIndex: 5 }} />;
      })}
      {/* poignées bézier du point actif */}
      {ap && activePoint != null && (ap.cIn || ap.cOut) && (() => {
        const a = abs(ap);
        const hDot = (h: { x: number; y: number }, which: 'cIn' | 'cOut') => {
          const hp = abs(h);
          return <div key={which} onPointerDown={(e) => dragHandle(e, activePoint, which)} style={{ position: 'absolute', left: hp.x, top: hp.y, width: s * 0.9, height: s * 0.9, transform: 'translate(-50%,-50%) rotate(45deg)', background: '#4dd2ff', border: `${1 / scale}px solid #0d0d0b`, cursor: 'grab', zIndex: 6 }} />;
        };
        return <>
          {ap.cIn && line(a, abs(ap.cIn), 'lin')}
          {ap.cOut && line(a, abs(ap.cOut), 'lout')}
          {ap.cIn && hDot(ap.cIn, 'cIn')}
          {ap.cOut && hDot(ap.cOut, 'cOut')}
        </>;
      })()}
      {pts.map((p, i) => {
        const a = abs(p);
        return <div key={'p' + i} onPointerDown={(e) => dragPoint(e, i)} style={{ position: 'absolute', left: a.x, top: a.y, width: s, height: s, transform: 'translate(-50%,-50%)', background: activePoint === i ? '#f23127' : '#fff', border: `${1.5 / scale}px solid #f23127`, borderRadius: (p.cIn || p.cOut) ? '50%' : 0, cursor: 'grab', zIndex: 6 }} />;
      })}
    </>
  );
}

function EditableEl({ el, ctx, selected, onDown, scale }: { el: TicketEl; ctx: ReturnType<typeof buildCtx>; selected: boolean; onDown: (e: React.PointerEvent, el: TicketEl, mode: 'move' | 'resize') => void; scale: number }) {
  const sh = el.shadow ? `${el.shadow.x}px ${el.shadow.y}px ${el.shadow.blur}px ${el.shadow.color}` : undefined;
  const bord = (b?: { width: number; color: string }) => (b ? `inset 0 0 0 ${b.width}px ${b.color}` : undefined);
  const box = (b?: { width: number; color: string }) => [sh, bord(b)].filter(Boolean).join(', ') || undefined;
  const base: React.CSSProperties = {
    position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h,
    transform: el.rotate ? `rotate(${el.rotate}deg)` : undefined, transformOrigin: 'center',
    opacity: el.opacity ?? undefined,
    borderRadius: cornerCss(el.radius, el.radii),
    cursor: 'move', outline: selected ? '1.5px solid #f23127' : '1px solid rgba(0,0,0,0.12)',
  };
  const foilOv = el.foil ? <span aria-hidden style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none', mixBlendMode: el.foil.blend ?? 'overlay', opacity: el.foil.opacity ?? 0.9, ...foilBackground(el.foil) }} /> : null;
  const foilText: React.CSSProperties = el.type === 'text' && el.foil
    ? { color: 'transparent', WebkitTextFillColor: 'transparent', WebkitBackgroundClip: 'text', backgroundClip: 'text', ...foilBackground(el.foil) }
    : {};
  let inner: React.ReactNode = null;
  if (el.type === 'text') inner = (
    <div style={{ width: '100%', height: '100%', fontFamily: FONT[el.font], fontSize: el.size, fontWeight: el.weight, color: el.color, textAlign: el.align, fontStyle: el.italic ? 'italic' : undefined, letterSpacing: el.tracking, textTransform: el.uppercase ? 'uppercase' : undefined, lineHeight: el.lineHeight ?? 1.05, background: el.foil ? foilBackground(el.foil).backgroundImage : el.bg, backgroundSize: el.foil ? foilBackground(el.foil).backgroundSize : undefined, padding: el.bg && !el.foil ? el.padding ?? 4 : undefined, boxSizing: 'border-box', WebkitTextStroke: el.stroke ? `${el.stroke.width}px ${el.stroke.color}` : undefined, textShadow: sh, whiteSpace: 'pre-wrap', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', ...foilText }}>{fillTokens(el.text, ctx)}</div>
  );
  else if (el.type === 'shape') inner = <ShapeSvg el={el} />;
  else if (el.type === 'rect') inner = <div style={{ position: 'relative', width: '100%', height: '100%', background: el.color, borderRadius: 'inherit', boxShadow: box(el.border) }}>{foilOv}</div>;
  else if (el.type === 'image') inner = el.url ? <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', borderRadius: 'inherit', boxShadow: box(el.border) }}><img src={el.url} alt="" style={{ width: '100%', height: '100%', objectFit: el.fit ?? 'cover' }} />{foilOv}</div> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.08)', fontFamily: FONT.mono, fontSize: 9, color: '#555' }}>IMG</div>;
  else if (el.type === 'barcode') inner = <div style={{ position: 'relative', width: '100%', height: '100%', background: `repeating-linear-gradient(90deg, ${el.color} 0 2px, transparent 2px 3px, ${el.color} 3px 4px, transparent 4px 7px)`, boxShadow: sh }}>{foilOv}</div>;
  else inner = <div style={{ position: 'relative', width: '100%', height: '100%', background: `conic-gradient(${el.color} 90deg, transparent 0 180deg, ${el.color} 0 270deg, transparent 0)`, backgroundSize: '25% 25%', filter: sh ? `drop-shadow(${sh})` : undefined }}>{foilOv}</div>;

  return (
    <div style={base} onPointerDown={(e) => onDown(e, el, 'move')}>
      {inner}
      {selected && (
        <span
          onPointerDown={(e) => onDown(e, el, 'resize')}
          style={{ position: 'absolute', right: -4 / scale, bottom: -4 / scale, width: 9 / scale, height: 9 / scale, background: '#f23127', cursor: 'nwse-resize' }}
        />
      )}
    </div>
  );
}

function Seam({ doc, part, scale }: { doc: TicketDoc; part: 'body' | 'stub'; scale: number }) {
  if (doc.seam === 'none') {
    return <div style={{ width: 6 * scale, flexShrink: 0, background: part === 'body' ? doc.body.bg : doc.stub.bg }} />;
  }
  const pos = part === 'body' ? 'right' : 'left';
  const bg = part === 'body' ? doc.body.bg : doc.stub.bg;
  return <div aria-hidden style={{ width: 6 * scale, flexShrink: 0, background: bg, backgroundImage: `radial-gradient(circle at ${pos} center, #0d0d0b 2.5px, transparent 2.9px)`, backgroundSize: `${6 * scale}px ${15 * scale}px`, backgroundRepeat: 'repeat-y' }} />;
}

/* ── Inspecteur d'élément ── */
function Inspector({ el, onPatch, onRemove, onDup, onReorder, activePoint, onSelectPoint }: { el: TicketEl; onPatch: (p: Partial<TicketEl>) => void; onRemove: () => void; onDup: () => void; onReorder: (d: 1 | -1) => void; activePoint: number | null; onSelectPoint: (i: number | null) => void }) {
  return (
    <Panel
      title={`Élément · ${el.type}`}
      right={
        <div className="flex gap-1">
          <button onClick={() => onReorder(1)} title="Avancer" className="border border-line-strong px-1.5 font-mono text-[11px] text-[color:var(--text-dim)] hover:border-line-bright">↑</button>
          <button onClick={() => onReorder(-1)} title="Reculer" className="border border-line-strong px-1.5 font-mono text-[11px] text-[color:var(--text-dim)] hover:border-line-bright">↓</button>
          <button onClick={onDup} title="Dupliquer" className="border border-line-strong px-1.5 font-mono text-[11px] text-[color:var(--text-dim)] hover:border-line-bright">⧉</button>
          <button onClick={onRemove} title="Supprimer" className="border border-[color:var(--accent)] px-1.5 font-mono text-[11px] text-accent">✕</button>
        </div>
      }
    >
      <div className="grid grid-cols-4 gap-2">
        <NumField label="X" value={el.x} onChange={(v) => onPatch({ x: v })} />
        <NumField label="Y" value={el.y} onChange={(v) => onPatch({ y: v })} />
        <NumField label="L" value={el.w} onChange={(v) => onPatch({ w: v })} />
        <NumField label="H" value={el.h} onChange={(v) => onPatch({ h: v })} />
        <NumField label="Rot°" value={el.rotate ?? 0} onChange={(v) => onPatch({ rotate: v })} />
      </div>

      {/* commun : opacité + ombre/lueur */}
      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3">
        <NumField label="Opacité %" value={Math.round((el.opacity ?? 1) * 100)} onChange={(v) => onPatch({ opacity: clamp(v, 0, 100) / 100 })} />
        <label className="flex items-end gap-2 pb-2 font-mono text-xs text-[color:var(--text-dim)]">
          <input type="checkbox" checked={!!el.shadow} onChange={(e) => onPatch({ shadow: e.target.checked ? { x: 3, y: 3, blur: 0, color: '#0d0d0b' } : undefined })} /> Ombre / lueur
        </label>
      </div>
      {el.shadow && (
        <div className="mt-2 grid grid-cols-4 gap-2">
          <NumField label="X" value={el.shadow.x} onChange={(v) => onPatch({ shadow: { ...el.shadow!, x: v } })} />
          <NumField label="Y" value={el.shadow.y} onChange={(v) => onPatch({ shadow: { ...el.shadow!, y: v } })} />
          <NumField label="Flou" value={el.shadow.blur} onChange={(v) => onPatch({ shadow: { ...el.shadow!, blur: v } })} />
          <ColorField label="Coul." value={el.shadow.color} onChange={(v) => onPatch({ shadow: { ...el.shadow!, color: v } })} />
        </div>
      )}

      {/* commun : rayon des angles (par coin) */}
      <div className="mt-3 border-t border-line pt-3">
        <CornerControl radius={el.radius} radii={el.radii} onChange={(p) => onPatch(p)} />
      </div>

      {/* commun : foil (reflet métallique) */}
      <div className="mt-3 border-t border-line pt-3">
        <FoilControl foil={el.foil} onChange={(foil) => onPatch({ foil })} />
      </div>

      {el.type === 'shape' && (
        <div className="mt-3 space-y-2">
          {el.variant !== 'path' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Forme</label>
                <select className="field" value={el.variant} onChange={(e) => onPatch({ variant: e.target.value as TicketShapeVariant })}>
                  <option value="rect">Rectangle</option><option value="ellipse">Ellipse</option><option value="triangle">Triangle</option><option value="diamond">Losange</option><option value="pentagon">Pentagone</option><option value="hexagon">Hexagone</option><option value="star">Étoile</option><option value="polygon">Polygone</option><option value="line">Trait</option>
                </select>
              </div>
              {(el.variant === 'star' || el.variant === 'polygon') && <NumField label={el.variant === 'star' ? 'Branches' : 'Côtés'} value={el.points ?? 5} onChange={(v) => onPatch({ points: clamp(v, 3, 20) })} />}
            </div>
          )}
          <label className="flex items-center gap-2 font-mono text-xs text-[color:var(--text-dim)]"><input type="checkbox" checked={!!el.fill} onChange={(e) => onPatch({ fill: e.target.checked ? '#f23127' : undefined })} /> Rempli (sinon contour seul)</label>
          <div className="grid grid-cols-2 gap-2">
            {el.fill && <ColorField label="Remplissage" value={el.fill} onChange={(v) => onPatch({ fill: v })} />}
            <NumField label="Bordure px" value={el.stroke?.width ?? 0} onChange={(v) => onPatch({ stroke: v > 0 ? { width: v, color: el.stroke?.color ?? '#0d0d0b' } : undefined })} />
            {el.stroke && <ColorField label="Coul. bordure" value={el.stroke.color} onChange={(v) => onPatch({ stroke: { width: el.stroke!.width, color: v } })} />}
          </div>

          {/* Tracé vectoriel éditable point par point */}
          {el.variant !== 'path' ? (
            <button onClick={() => onPatch({ variant: 'path', path: shapeToPoints(el.variant, el.points) })} className="w-full border border-line-strong px-2 py-1.5 font-mono text-[11px] uppercase tracking-hud text-[color:var(--text-dim)] hover:border-accent hover:text-accent">✎ Convertir en tracé éditable</button>
          ) : (
            <div className="space-y-2 border-t border-line pt-2">
              <div className="flex items-center justify-between">
                <span className="hud-label text-[10px]">Tracé · {el.path?.length ?? 0} points</span>
                <label className="flex items-center gap-1 font-mono text-[10px] text-[color:var(--text-dim)]"><input type="checkbox" checked={el.closed ?? true} onChange={(e) => onPatch({ closed: e.target.checked })} /> fermé</label>
              </div>
              <p className="font-mono text-[9px] leading-tight text-[color:var(--text-mute)]">Glisse les poignées rouges sur la forme. Clique un rond cyan (milieu d’arête) pour ajouter un point.</p>
              {activePoint != null && el.path && el.path[activePoint] ? (() => {
                const pt = el.path[activePoint];
                const curved = !!(pt.cIn || pt.cOut);
                const toggleCurve = () => {
                  const path = el.path!.map((p, i) => {
                    if (i !== activePoint) return p;
                    if (curved) { const { cIn, cOut, ...rest } = p; void cIn; void cOut; return rest; }
                    const prev = el.path![(activePoint - 1 + el.path!.length) % el.path!.length];
                    const next = el.path![(activePoint + 1) % el.path!.length];
                    const dx = next.x - prev.x, dy = next.y - prev.y;
                    const len = Math.hypot(dx, dy) || 1;
                    const ux = (dx / len) * 0.15, uy = (dy / len) * 0.15;
                    return { ...p, r: undefined, cOut: { x: clamp(p.x + ux, 0, 1), y: clamp(p.y + uy, 0, 1) }, cIn: { x: clamp(p.x - ux, 0, 1), y: clamp(p.y - uy, 0, 1) } };
                  });
                  onPatch({ path });
                };
                return (
                  <div className="border border-line p-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="hud-label text-[10px]">Point {activePoint + 1}</span>
                      <button onClick={() => { const np = el.path!.filter((_, i) => i !== activePoint); onPatch({ path: np.length >= 2 ? np : el.path }); onSelectPoint(null); }} className="border border-[color:var(--accent)] px-1.5 font-mono text-[10px] text-accent">supprimer</button>
                    </div>
                    <button onClick={toggleCurve} className="mb-2 w-full border border-line-strong px-2 py-1 font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-dim)] hover:border-accent hover:text-accent">{curved ? '◾ Rendre anguleux' : '⌇ Rendre courbe (bézier)'}</button>
                    {!curved && <>
                      <label className="label">Rayon du coin ({pt.r ?? 0}px)</label>
                      <input type="range" min={0} max={60} value={pt.r ?? 0} onChange={(e) => { const r = Number(e.target.value); onPatch({ path: el.path!.map((p, i) => (i === activePoint ? { ...p, r } : p)) }); }} className="w-full accent-[color:var(--accent)]" />
                    </>}
                    {curved && <p className="font-mono text-[9px] text-[color:var(--text-mute)]">Glisse les poignées cyan sur le canvas pour galber la courbe.</p>}
                  </div>
                );
              })() : (
                <p className="font-mono text-[9px] text-[color:var(--text-mute)]">Sélectionne un point pour régler son rayon / sa courbe.</p>
              )}
            </div>
          )}
        </div>
      )}

      {el.type === 'text' && (
        <div className="mt-3 space-y-3">
          <div>
            <label className="label">Texte</label>
            <textarea className="field h-16" value={el.text} onChange={(e) => onPatch({ text: e.target.value })} />
            <div className="mt-1 flex flex-wrap gap-1">
              {TICKET_TOKENS.map((tk) => (
                <button key={tk} onClick={() => onPatch({ text: `${el.text}{${tk}}` })} className="border border-line-strong px-1.5 py-0.5 font-mono text-[9px] text-[color:var(--text-mute)] hover:border-accent hover:text-accent">{`{${tk}}`}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Police</label>
              <select className="field" value={el.font} onChange={(e) => onPatch({ font: e.target.value as TicketFont })}>
                <option value="display">Display</option><option value="mono">Mono</option><option value="sans">Sans</option>
              </select>
            </div>
            <NumField label="Taille" value={el.size} onChange={(v) => onPatch({ size: v })} />
            <NumField label="Graisse" value={el.weight} onChange={(v) => onPatch({ weight: v })} />
            <NumField label="Interlettre" value={el.tracking ?? 0} onChange={(v) => onPatch({ tracking: v })} />
            <div>
              <label className="label">Align.</label>
              <select className="field" value={el.align} onChange={(e) => onPatch({ align: e.target.value as TicketAlign })}>
                <option value="left">Gauche</option><option value="center">Centre</option><option value="right">Droite</option>
              </select>
            </div>
            <ColorField label="Couleur" value={el.color} onChange={(v) => onPatch({ color: v })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">Interligne</label><input type="number" step="0.05" className="field" value={el.lineHeight ?? 1.05} onChange={(e) => onPatch({ lineHeight: Number(e.target.value) || 1 })} /></div>
            <NumField label="Contour px" value={el.stroke?.width ?? 0} onChange={(v) => onPatch({ stroke: v > 0 ? { width: v, color: el.stroke?.color ?? '#0d0d0b' } : undefined })} />
            {el.stroke && <ColorField label="Coul. contour" value={el.stroke.color} onChange={(v) => onPatch({ stroke: { width: el.stroke!.width, color: v } })} />}
          </div>
          <div className="flex gap-4 font-mono text-xs text-[color:var(--text-dim)]">
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!el.uppercase} onChange={(e) => onPatch({ uppercase: e.target.checked })} /> MAJ</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!el.italic} onChange={(e) => onPatch({ italic: e.target.checked })} /> Italique</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!el.bg} onChange={(e) => onPatch({ bg: e.target.checked ? '#f23127' : undefined })} /> Surlignage</label>
          </div>
          {el.bg && (
            <div className="grid grid-cols-2 gap-2">
              <ColorField label="Fond surlignage" value={el.bg} onChange={(v) => onPatch({ bg: v })} />
              <NumField label="Padding" value={el.padding ?? 4} onChange={(v) => onPatch({ padding: v })} />
            </div>
          )}
        </div>
      )}
      {el.type === 'rect' && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <ColorField label="Couleur" value={el.color} onChange={(v) => onPatch({ color: v })} />
          <NumField label="Bordure px" value={el.border?.width ?? 0} onChange={(v) => onPatch({ border: v > 0 ? { width: v, color: el.border?.color ?? '#0d0d0b' } : undefined })} />
          {el.border && <ColorField label="Coul. bordure" value={el.border.color} onChange={(v) => onPatch({ border: { width: el.border!.width, color: v } })} />}
        </div>
      )}
      {el.type === 'image' && (
        <div className="mt-3 space-y-2">
          <div><label className="label">Image</label><ImageField value={el.url} onChange={(url) => onPatch({ url })} folder="tickets" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">Ajustement</label><select className="field" value={el.fit ?? 'cover'} onChange={(e) => onPatch({ fit: e.target.value as 'cover' | 'contain' })}><option value="cover">Remplir</option><option value="contain">Contenir</option></select></div>
            <NumField label="Bordure px" value={el.border?.width ?? 0} onChange={(v) => onPatch({ border: v > 0 ? { width: v, color: el.border?.color ?? '#0d0d0b' } : undefined })} />
            {el.border && <ColorField label="Coul. bordure" value={el.border.color} onChange={(v) => onPatch({ border: { width: el.border!.width, color: v } })} />}
          </div>
        </div>
      )}
      {(el.type === 'barcode' || el.type === 'qr') && (
        <div className="mt-3 space-y-2">
          <ColorField label="Couleur" value={el.color} onChange={(v) => onPatch({ color: v })} />
          {el.type === 'qr' && (
            <div>
              <label className="label">Contenu encodé (scannable)</label>
              <input className="field" value={el.data ?? ''} placeholder="https://… ou {serial} (défaut : n° de série)" onChange={(e) => onPatch({ data: e.target.value || undefined })} />
              <div className="mt-1 flex flex-wrap gap-1">
                {TICKET_TOKENS.map((tk) => (
                  <button key={tk} onClick={() => onPatch({ data: `${el.data ?? ''}{${tk}}` })} className="border border-line-strong px-1.5 py-0.5 font-mono text-[9px] text-[color:var(--text-mute)] hover:border-accent hover:text-accent">{`{${tk}}`}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

const PATTERNS: { id: TicketPattern; label: string }[] = [
  { id: 'none', label: 'Aucun' },
  { id: 'checker', label: 'Damier' },
  { id: 'dots', label: 'Points' },
  { id: 'hazard', label: 'Rayures' },
  { id: 'holo', label: 'Holo' },
];

/** Design complet et INDÉPENDANT d'un panneau (corps ou talon). */
function PanelDesign({ panel, globalRadius, onPatch }: { panel: TicketPanel; globalRadius: number; onPatch: (fn: (p: TicketPanel) => void) => void }) {
  const grad = !!panel.gradient;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <ColorField label="Fond" value={panel.bg} onChange={(v) => onPatch((p) => { p.bg = v; })} />
        <CornerControl radius={panel.radius} radii={panel.radii} onChange={({ radius, radii }) => onPatch((p) => { p.radius = radius; p.radii = radii; })} />
      </div>
      <p className="font-mono text-[9px] text-[color:var(--text-mute)]">Défaut : angles extérieurs à {globalRadius}px. Passe en « libre » pour arrondir le côté césure → un pont relie automatiquement corps et talon.</p>

      {/* dégradé */}
      <label className="flex items-center gap-2 font-mono text-xs text-[color:var(--text-dim)]">
        <input type="checkbox" checked={grad} onChange={(e) => onPatch((p) => { p.gradient = e.target.checked ? { from: p.bg, to: '#0d0d0b', angle: 135 } : undefined; })} />
        Dégradé de fond
      </label>
      {grad && panel.gradient && (
        <div className="grid grid-cols-3 gap-2">
          <ColorField label="De" value={panel.gradient.from} onChange={(v) => onPatch((p) => { if (p.gradient) p.gradient.from = v; })} />
          <ColorField label="Vers" value={panel.gradient.to} onChange={(v) => onPatch((p) => { if (p.gradient) p.gradient.to = v; })} />
          <NumField label="Angle" value={panel.gradient.angle} onChange={(v) => onPatch((p) => { if (p.gradient) p.gradient.angle = v; })} />
        </div>
      )}

      {/* motif */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="label">Motif</label>
          <select className="field" value={panel.pattern ?? 'none'} onChange={(e) => onPatch((p) => { p.pattern = e.target.value as TicketPattern; })}>
            {PATTERNS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
        </div>
        <ColorField label="Coul. motif" value={panel.patternColor ?? '#0d0d0b'} onChange={(v) => onPatch((p) => { p.patternColor = v; })} />
        <NumField label="Opacité %" value={Math.round((panel.patternOpacity ?? 0.15) * 100)} onChange={(v) => onPatch((p) => { p.patternOpacity = clamp(v, 0, 100) / 100; })} />
      </div>
      {panel.pattern && panel.pattern !== 'none' && panel.pattern !== 'checker' && (
        <div>
          <label className="label">Direction du foil ({panel.patternAngle ?? (panel.pattern === 'hazard' ? 45 : 115)}°)</label>
          <input type="range" min={0} max={360} value={panel.patternAngle ?? (panel.pattern === 'hazard' ? 45 : 115)} onChange={(e) => onPatch((p) => { p.patternAngle = Number(e.target.value); })} className="w-full accent-[color:var(--accent)]" />
        </div>
      )}

      {/* bordure */}
      <div className="grid grid-cols-2 gap-2">
        <NumField label="Bordure (px)" value={panel.border?.width ?? 0} onChange={(v) => onPatch((p) => { p.border = v > 0 ? { width: v, color: p.border?.color ?? '#0d0d0b' } : undefined; })} />
        <ColorField label="Coul. bordure" value={panel.border?.color ?? '#0d0d0b'} onChange={(v) => onPatch((p) => { if (!p.border) p.border = { width: 2, color: v }; else p.border.color = v; })} />
      </div>

      <div><label className="label">Image de fond</label><ImageField value={panel.bgImage ?? ''} onChange={(url) => onPatch((p) => { p.bgImage = url || undefined; })} folder="tickets" /></div>
    </div>
  );
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/** Contrôle du foil (reflet métallique) commun à tous les éléments. */
function FoilControl({ foil, onChange }: { foil?: TicketFoil; onChange: (f: TicketFoil | undefined) => void }) {
  const on = !!foil;
  const f: TicketFoil = foil ?? { type: 'holo', angle: 115, opacity: 0.9, blend: 'overlay' };
  const set = (p: Partial<TicketFoil>) => onChange({ ...f, ...p });
  return (
    <div>
      <label className="flex items-center gap-2 font-mono text-xs text-[color:var(--text-dim)]">
        <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked ? { type: 'holo', angle: 115, opacity: 0.9, blend: 'overlay' } : undefined)} /> Foil (reflet métallique)
      </label>
      {on && (
        <div className="mt-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Type</label>
              <select className="field" value={f.type} onChange={(e) => set({ type: e.target.value as TicketFoilType })}>
                <option value="holo">Holo</option><option value="rainbow">Arc-en-ciel</option><option value="gold">Or</option><option value="silver">Argent</option><option value="chrome">Chrome</option><option value="gradient">Dégradé</option>
              </select>
            </div>
            <div>
              <label className="label">Fusion</label>
              <select className="field" value={f.blend ?? 'overlay'} onChange={(e) => set({ blend: e.target.value as TicketFoil['blend'] })}>
                <option value="normal">Normal</option><option value="overlay">Overlay</option><option value="screen">Screen</option><option value="color-dodge">Dodge</option><option value="soft-light">Soft</option><option value="hard-light">Hard</option>
              </select>
            </div>
          </div>
          {f.type === 'gradient' && (
            <div className="grid grid-cols-2 gap-2">
              <ColorField label="De" value={f.from ?? '#ff2d78'} onChange={(v) => set({ from: v })} />
              <ColorField label="Vers" value={f.to ?? '#4dd2ff'} onChange={(v) => set({ to: v })} />
            </div>
          )}
          <div>
            <label className="label">Direction ({f.angle ?? 115}°)</label>
            <input type="range" min={0} max={360} value={f.angle ?? 115} onChange={(e) => set({ angle: Number(e.target.value) })} className="w-full accent-[color:var(--accent)]" />
          </div>
          <NumField label="Opacité %" value={Math.round((f.opacity ?? 0.9) * 100)} onChange={(v) => set({ opacity: clamp(v, 0, 100) / 100 })} />
        </div>
      )}
    </div>
  );
}

/** borderRadius CSS : par angle (`radii`) sinon uniforme (`radius`). */
function cornerCss(radius?: number, radii?: TicketCorners): string | number | undefined {
  if (radii) return `${radii.tl}px ${radii.tr}px ${radii.br}px ${radii.bl}px`;
  return radius || undefined;
}

/** Pont d'aperçu reliant corps↔talon quand les angles intérieurs sont arrondis. */
function BridgePreview({ doc, l, scale }: { doc: TicketDoc; l: ReturnType<typeof docLayout>; scale: number }) {
  const { top, bottom } = innerRadii(doc);
  const reach = Math.max(top, bottom);
  if (reach <= 0) return null;
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left: (l.bodyW - reach) * scale,
        width: (reach + SEAM + reach) * scale,
        top: 0,
        bottom: 0,
        background: `linear-gradient(90deg, ${doc.body.bg}, ${doc.stub.bg})`,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

/** Contrôle rayon d'angles : lié (1 valeur) OU libre (4 coins indépendants). */
function CornerControl({ radius, radii, onChange }: { radius?: number; radii?: TicketCorners; onChange: (p: { radius?: number; radii?: TicketCorners }) => void }) {
  const linked = !radii;
  const uni = radius ?? 0;
  const r = radii ?? { tl: uni, tr: uni, br: uni, bl: uni };
  const setK = (k: keyof TicketCorners, v: number) => onChange({ radius: undefined, radii: { ...r, [k]: Math.max(0, Math.round(v || 0)) } });
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="label mb-0">Angles (px)</label>
        <button
          onClick={() => (linked ? onChange({ radius: undefined, radii: { tl: uni, tr: uni, br: uni, bl: uni } }) : onChange({ radii: undefined, radius: Math.max(r.tl, r.tr, r.br, r.bl) }))}
          className="border border-line-strong px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-hud text-[color:var(--text-mute)] hover:border-accent hover:text-accent"
        >
          {linked ? '⛓ lié' : '⛓ libre'}
        </button>
      </div>
      {linked ? (
        <input type="number" className="field" value={uni} onChange={(e) => onChange({ radius: Math.max(0, Math.round(Number(e.target.value) || 0)), radii: undefined })} />
      ) : (
        <div className="grid grid-cols-4 gap-1">
          {(['tl', 'tr', 'br', 'bl'] as const).map((k) => (
            <div key={k}>
              <span className="block text-center font-mono text-[8px] uppercase text-[color:var(--text-mute)]">{k}</span>
              <input type="number" className="field px-1 text-center" value={r[k]} onChange={(e) => setK(k, Number(e.target.value))} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type="number" className="field" value={Number.isFinite(value) ? value : 0} onChange={(e) => onChange(Math.round(Number(e.target.value) || 0))} />
    </div>
  );
}
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'} onChange={(e) => onChange(e.target.value)} className="h-9 w-9 shrink-0 cursor-pointer border border-line-strong bg-transparent" />
        <input className="field" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}
