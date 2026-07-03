import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Arrow, Circle, Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text, Wedge } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Strat, StratBoardObject, StratKeyframe, StratToolKind, ValorantAgent, ValorantAbility, ValorantMap } from '@lignezero/types';
import { db } from '@/lib/supabase';
import { uid } from '@/lib/id';
import { Button, Panel, Spinner } from '@/components/ui';
import { CATEGORY_COLOR } from '@/lib/abilityCategories';
import { AbilityGlyphHtml, AbilityGlyphKonva } from '@/components/stratboard/AbilityIcons';

const STAGE_SIZE = 760;
const SWATCHES = ['#e8e6df', '#facc15', '#37c26d'];

type PlacementTool = Exclude<StratToolKind, 'arrow' | 'line'>;
type Tool = 'select' | StratToolKind;

/** Charge une image et renvoie l'élément HTMLImageElement une fois prêt. */
function useHtmlImage(url: string | undefined): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!url) {
      setImg(null);
      return;
    }
    const el = new window.Image();
    el.crossOrigin = 'anonymous';
    el.src = url;
    el.onload = () => setImg(el);
    return () => {
      el.onload = null;
    };
  }, [url]);
  return img;
}

/** Précharge un ensemble d'images (portraits agents, icônes compétences). */
function useImageCache(urls: (string | undefined)[]): Record<string, HTMLImageElement> {
  const key = urls.filter(Boolean).join('|');
  const [cache, setCache] = useState<Record<string, HTMLImageElement>>({});
  useEffect(() => {
    key.split('|').filter(Boolean).forEach((url) => {
      setCache((c) => {
        if (c[url]) return c;
        const el = new window.Image();
        el.crossOrigin = 'anonymous';
        el.src = url;
        el.onload = () => setCache((c2) => ({ ...c2, [url]: el }));
        return c;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return cache;
}

/** Position interpolée d'un objet à l'instant `t` (s). Retourne `points` si pas de trajectoire. */
function valueAt(o: StratBoardObject, t: number): number[] {
  const kfs = o.keyframes;
  if (!kfs || kfs.length === 0) return o.points;
  if (kfs.length === 1 || t <= kfs[0].t) return kfs[0].points;
  const last = kfs[kfs.length - 1];
  if (t >= last.t) return last.points;
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i];
    const b = kfs[i + 1];
    if (t >= a.t && t <= b.t) {
      const f = (t - a.t) / (b.t - a.t || 1);
      return a.points.map((p, idx) => p + ((b.points[idx] ?? p) - p) * f);
    }
  }
  return o.points;
}

const fmt = (s: number) => `${s.toFixed(1)}s`;

export function StratBoardPage() {
  const { stratId } = useParams<{ stratId: string }>();
  const [strat, setStrat] = useState<Strat | null | undefined>(undefined);
  const [maps, setMaps] = useState<ValorantMap[]>([]);
  const [agents, setAgents] = useState<ValorantAgent[]>([]);
  const [abilities, setAbilities] = useState<ValorantAbility[]>([]);
  const [objects, setObjects] = useState<StratBoardObject[]>([]);
  const [history, setHistory] = useState<StratBoardObject[][]>([]);
  const [tool, setTool] = useState<Tool>('select');
  const [color, setColor] = useState(SWATCHES[0]);
  const [side, setSide] = useState<'attack' | 'defense'>('attack');
  const [armedAgentId, setArmedAgentId] = useState<string | null>(null);
  const [armedAbilityId, setArmedAbilityId] = useState<string | null>(null);
  const [hoveredAgentId, setHoveredAgentId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<number[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Timeline / animation ──
  const [duration, setDuration] = useState(10);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [recArmed, setRecArmed] = useState(false);

  const stageRef = useRef<Konva.Stage>(null);

  const selectedMap = useMemo(() => maps.find((m) => m.name === strat?.map), [maps, strat?.map]);
  const mapImage = useHtmlImage(selectedMap?.image);
  const imageCache = useImageCache([...agents.map((a) => a.image), ...abilities.map((a) => a.image)]);
  const selected = useMemo(() => objects.find((o) => o.id === selectedId) ?? null, [objects, selectedId]);
  const animatedCount = useMemo(() => objects.filter((o) => (o.keyframes?.length ?? 0) >= 2).length, [objects]);

  useEffect(() => {
    if (!stratId) return;
    Promise.all([db.listStrats(), db.listValorantMaps(), db.listValorantAgents(), db.listValorantAbilities()]).then(
      ([strats, mapsList, agentsList, abilitiesList]) => {
        const s = strats.find((x) => x.id === stratId) ?? null;
        setStrat(s);
        setObjects(s?.board ?? []);
        setMaps(mapsList);
        setAgents(agentsList);
        setAbilities(abilitiesList);
      },
    );
  }, [stratId]);

  // ── Boucle d'animation (rAF) ──
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setCurrentTime((t) => {
        const nt = t + dt;
        if (nt >= duration) {
          setPlaying(false);
          return duration;
        }
        return nt;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration]);

  function pushHistory() {
    setHistory((h) => [...h.slice(-49), objects]);
  }
  function undo() {
    setHistory((h) => {
      if (h.length === 0) return h;
      setObjects(h[h.length - 1]);
      return h.slice(0, -1);
    });
  }
  function addObject(o: StratBoardObject) {
    pushHistory();
    setObjects((list) => [...list, o]);
    setSelectedId(o.id);
  }
  function updateBase(id: string, points: number[]) {
    pushHistory();
    setObjects((list) => list.map((o) => (o.id === id ? { ...o, points } : o)));
  }
  /** Enregistre/écrase une keyframe à l'instant courant. Amorce t=0 si première keyframe posée plus tard. */
  const recordKeyframe = useCallback(
    (id: string, points: number[]) => {
      pushHistory();
      setObjects((list) =>
        list.map((o) => {
          if (o.id !== id) return o;
          let kfs: StratKeyframe[] = o.keyframes ? [...o.keyframes] : [];
          if (kfs.length === 0 && currentTime > 0.01) kfs.push({ t: 0, points: o.points });
          kfs = kfs.filter((k) => Math.abs(k.t - currentTime) > 0.02);
          kfs.push({ t: currentTime, points });
          kfs.sort((a, b) => a.t - b.t);
          return { ...o, keyframes: kfs, points: kfs[0].points };
        }),
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentTime, objects],
  );
  function commitPoints(o: StratBoardObject, points: number[]) {
    if (recArmed || (o.keyframes && o.keyframes.length > 0)) recordKeyframe(o.id, points);
    else updateBase(o.id, points);
  }
  function deleteKeyframeAtPlayhead() {
    if (!selected) return;
    pushHistory();
    setObjects((list) =>
      list.map((o) => {
        if (o.id !== selected.id || !o.keyframes) return o;
        const kfs = o.keyframes.filter((k) => Math.abs(k.t - currentTime) > 0.02);
        return { ...o, keyframes: kfs.length ? kfs : undefined };
      }),
    );
  }
  function clearAnimation() {
    if (!selected) return;
    pushHistory();
    setObjects((list) => list.map((o) => (o.id === selected.id ? { ...o, keyframes: undefined } : o)));
  }
  function rotateSelected(delta: number) {
    if (!selectedId) return;
    pushHistory();
    setObjects((list) => list.map((o) => (o.id === selectedId ? { ...o, rotation: (o.rotation ?? 0) + delta } : o)));
  }
  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    pushHistory();
    setObjects((list) => list.filter((o) => o.id !== selectedId));
    setSelectedId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, objects]);
  const duplicateSelected = useCallback(() => {
    if (!selected) return;
    pushHistory();
    const shift = (pts: number[]) => pts.map((p, i) => p + (i % 2 === 0 ? 24 : 24));
    const copy: StratBoardObject = {
      ...selected,
      id: uid(),
      points: shift(selected.points),
      keyframes: selected.keyframes?.map((k) => ({ ...k, points: shift(k.points) })),
    };
    setObjects((list) => [...list, copy]);
    setSelectedId(copy.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, objects]);
  function clearAll() {
    if (objects.length === 0 || !confirm('Effacer tous les éléments du plan ?')) return;
    pushHistory();
    setObjects([]);
    setSelectedId(null);
  }

  function armAgent(agentId: string) {
    setTool('agent');
    setArmedAgentId(agentId);
    setArmedAbilityId(null);
  }
  function armAbility(agentId: string, abilityId: string) {
    setTool('icon');
    setArmedAgentId(agentId);
    setArmedAbilityId(abilityId);
    setHoveredAgentId(null);
  }

  function stagePos(e: KonvaEventObject<MouseEvent>) {
    const pos = e.target.getStage()?.getPointerPosition();
    return pos ? [pos.x, pos.y] : [0, 0];
  }

  function handleStageMouseDown(e: KonvaEventObject<MouseEvent>) {
    if (playing) return;
    if (e.target !== e.target.getStage()) return;
    setSelectedId(null);
    const [x, y] = stagePos(e);

    if (tool === 'arrow' || tool === 'line') {
      setDraft([x, y, x, y]);
      return;
    }
    if (tool === 'select') return;

    const placement = tool as PlacementTool;
    if (placement === 'text') {
      const label = window.prompt('Texte à afficher :');
      if (!label) return;
      addObject({ id: uid(), kind: 'text', points: [x, y], color, label });
    } else if (placement === 'circle') {
      addObject({ id: uid(), kind: 'circle', points: [x, y], color, radius: 34 });
    } else if (placement === 'rect') {
      addObject({ id: uid(), kind: 'rect', points: [x, y], color, width: 90, height: 55 });
    } else if (placement === 'agent') {
      if (!armedAgentId) return;
      addObject({ id: uid(), kind: 'agent', points: [x, y], color: side === 'attack' ? '#38bdf8' : '#f23127', side, agentId: armedAgentId });
    } else if (placement === 'icon') {
      if (!armedAgentId || !armedAbilityId) return;
      const ability = abilities.find((a) => a.id === armedAbilityId);
      addObject({ id: uid(), kind: 'icon', points: [x, y], color: CATEGORY_COLOR[ability?.category ?? 'other'], agentId: armedAgentId, abilityId: armedAbilityId });
    }
  }

  function handleStageMouseMove(e: KonvaEventObject<MouseEvent>) {
    if (!draft) return;
    const [x, y] = stagePos(e);
    setDraft([draft[0], draft[1], x, y]);
  }
  function handleStageMouseUp() {
    if (!draft) return;
    const [x1, y1, x2, y2] = draft;
    setDraft(null);
    if (Math.hypot(x2 - x1, y2 - y1) < 8) return;
    if (tool === 'arrow') addObject({ id: uid(), kind: 'arrow', points: [x1, y1, x2, y2], color });
    else if (tool === 'line') addObject({ id: uid(), kind: 'line', points: [x1, y1, x2, y2], color });
  }

  // Drag d'un objet ancré ([x,y]) — agent/icon/circle/rect/text.
  function onAnchorDragEnd(o: StratBoardObject, e: KonvaEventObject<DragEvent>) {
    commitPoints(o, [e.target.x(), e.target.y()]);
  }
  // Drag d'une flèche/ligne : le nœud porte un offset, on décale tous les points puis on remet l'offset à 0.
  function onPolyDragEnd(o: StratBoardObject, rendered: number[], e: KonvaEventObject<DragEvent>) {
    const dx = e.target.x();
    const dy = e.target.y();
    e.target.position({ x: 0, y: 0 });
    commitPoints(o, rendered.map((p, i) => p + (i % 2 === 0 ? dx : dy)));
  }

  async function chooseMap(mapName: string) {
    if (!strat) return;
    setError(null);
    try {
      const next = { ...strat, map: mapName };
      await db.upsertStrat(next);
      setStrat(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  }

  async function save() {
    if (!strat) return;
    setSaving(true);
    setError(null);
    try {
      const next = { ...strat, board: objects };
      await db.upsertStrat(next);
      setStrat(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  }

  function exportPng() {
    const stage = stageRef.current;
    if (!stage) return;
    const url = stage.toDataURL({ pixelRatio: 2 });
    const a = document.createElement('a');
    a.href = url;
    a.download = `${strat?.id ?? 'strat'}-plan.png`;
    a.click();
  }

  // ── Raccourcis clavier ──
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          e.preventDefault();
          deleteSelected();
        }
      } else if (e.key === 'Escape') {
        setSelectedId(null);
        setTool('select');
        setArmedAgentId(null);
        setArmedAbilityId(null);
      } else if ((e.key === 'd' || e.key === 'D') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        duplicateSelected();
      } else if (e.key === ' ') {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, deleteSelected, duplicateSelected]);

  if (strat === undefined) return <Spinner label="Chargement…" />;
  if (strat === null) {
    return (
      <Panel>
        <p className="font-mono text-sm text-[color:var(--text-dim)]">Strat introuvable.</p>
        <Link to="/strats" className="mt-2 inline-block font-mono text-xs text-accent">← retour aux strats</Link>
      </Panel>
    );
  }

  const editable = tool === 'select' && !playing;

  return (
    <div>
      <header className="mb-4">
        <Link to="/strats" className="font-mono text-xs text-[color:var(--text-dim)] hover:text-accent">← strats</Link>
        <p className="hud-label mt-2 text-[11px]">PLAN TACTIQUE // {strat.map ?? 'map non renseignée'}</p>
        <h1 className="font-display text-2xl font-bold uppercase tracking-hud">{strat.title}</h1>
      </header>

      {error && <p className="mb-4 border border-[color:var(--accent)] px-3 py-2 font-mono text-xs text-accent">{error}</p>}

      {!selectedMap?.image ? (
        <Panel title="Choisis une map">
          {maps.length === 0 ? (
            <p className="font-mono text-xs text-[color:var(--text-dim)]">
              Aucune map configurée. Ajoutes-en depuis <Link to="/parametres/maps" className="text-accent hover:underline">Paramètres → Maps</Link>.
            </p>
          ) : (
            <>
              <select className="field" value={strat.map ?? ''} onChange={(e) => chooseMap(e.target.value)}>
                <option value="">— choisir —</option>
                {maps.map((m) => (
                  <option key={m.id} value={m.name}>{m.name}{!m.image ? ' (image manquante)' : ''}</option>
                ))}
              </select>
              {selectedMap && !selectedMap.image && (
                <p className="mt-2 font-mono text-[10px] text-[color:var(--text-mute)]">
                  Cette map n'a pas encore d'image — ajoute-la depuis <Link to="/parametres/maps" className="text-accent hover:underline">Paramètres → Maps</Link>.
                </p>
              )}
            </>
          )}
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
          <div>
            {/* ── Barre d'agents façon Valoplant ── */}
            <div className="panel mb-3 overflow-visible p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="hud-label text-[10px]">AGENTS</p>
                <select className="field w-40" value={strat.map ?? ''} onChange={(e) => chooseMap(e.target.value)}>
                  {maps.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              </div>
              {agents.length === 0 ? (
                <p className="font-mono text-xs text-[color:var(--text-dim)]">
                  Aucun agent configuré. Ajoutes-en depuis <Link to="/parametres/agents" className="text-accent hover:underline">Paramètres → Agents</Link>.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {agents.map((a) => {
                    const abs = abilities.filter((x) => x.agentId === a.id);
                    const armed = armedAgentId === a.id;
                    return (
                      <div
                        key={a.id}
                        className="relative"
                        onMouseEnter={() => setHoveredAgentId(a.id)}
                        onMouseLeave={() => setHoveredAgentId((h) => (h === a.id ? null : h))}
                      >
                        <button
                          onClick={() => armAgent(a.id)}
                          title={`Placer ${a.name}`}
                          className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2"
                          style={{ borderColor: armed && tool === 'agent' ? 'var(--accent)' : 'var(--line-strong)' }}
                        >
                          {a.image ? (
                            <img src={a.image} alt={a.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="font-mono text-[10px] text-[color:var(--text-mute)]">{a.name.slice(0, 2).toUpperCase()}</span>
                          )}
                        </button>

                        {hoveredAgentId === a.id && abs.length > 0 && (
                          <div className="absolute bottom-full left-1/2 z-20 mb-2 flex -translate-x-1/2 gap-1 border border-line-strong bg-base-800 p-2 shadow-ink-sm">
                            {abs.map((ab) => (
                              <button
                                key={ab.id}
                                onClick={() => armAbility(a.id, ab.id)}
                                title={`${ab.slot} · ${ab.name}`}
                                className="flex h-9 w-9 items-center justify-center border"
                                style={{ borderColor: armedAbilityId === ab.id ? 'var(--accent)' : 'var(--line-strong)' }}
                              >
                                {ab.image ? <img src={ab.image} alt={ab.name} className="h-6 w-6 object-cover" /> : <AbilityGlyphHtml category={ab.category} size={16} />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {tool === 'agent' && (
                <div className="mt-2 flex gap-2">
                  <button onClick={() => setSide('attack')} className="flex-1 border px-2 py-1 font-mono text-[10px] uppercase tracking-hud" style={{ borderColor: side === 'attack' ? '#38bdf8' : 'var(--line-strong)', color: side === 'attack' ? '#38bdf8' : 'var(--text-dim)' }}>Attaque</button>
                  <button onClick={() => setSide('defense')} className="flex-1 border px-2 py-1 font-mono text-[10px] uppercase tracking-hud" style={{ borderColor: side === 'defense' ? '#f23127' : 'var(--line-strong)', color: side === 'defense' ? '#f23127' : 'var(--text-dim)' }}>Défense</button>
                </div>
              )}
              {tool === 'icon' && armedAbilityId && (
                <p className="mt-2 font-mono text-[10px] text-[color:var(--text-mute)]">
                  Compétence armée : {abilities.find((a) => a.id === armedAbilityId)?.name}. Clique sur le plan pour la poser.
                </p>
              )}
            </div>

            <Panel className="overflow-auto">
              <Stage
                ref={stageRef}
                width={STAGE_SIZE}
                height={STAGE_SIZE}
                onMouseDown={handleStageMouseDown}
                onMouseMove={handleStageMouseMove}
                onMouseUp={handleStageMouseUp}
                className="mx-auto"
              >
                <Layer>
                  {mapImage && <KonvaImage image={mapImage} width={STAGE_SIZE} height={STAGE_SIZE} listening={false} />}

                  {objects.map((o) => {
                    const isSel = selectedId === o.id;
                    const select = () => editable && setSelectedId(o.id);
                    const pts = valueAt(o, currentTime);
                    const animated = (o.keyframes?.length ?? 0) >= 2;
                    const drag = {
                      draggable: editable,
                      onClick: select,
                      onTap: select,
                    };

                    if (o.kind === 'arrow' || o.kind === 'line') {
                      const Comp = o.kind === 'arrow' ? Arrow : Line;
                      return (
                        <Comp
                          key={o.id}
                          {...drag}
                          points={pts}
                          stroke={o.color}
                          fill={o.color}
                          strokeWidth={3}
                          lineCap="round"
                          tension={o.kind === 'line' ? 0.4 : 0}
                          pointerLength={10}
                          pointerWidth={10}
                          hitStrokeWidth={16}
                          opacity={isSel ? 1 : 0.9}
                          dash={isSel ? [10, 4] : undefined}
                          onDragEnd={(e) => onPolyDragEnd(o, pts, e)}
                        />
                      );
                    }
                    if (o.kind === 'circle') {
                      return <Circle key={o.id} {...drag} x={pts[0]} y={pts[1]} radius={o.radius ?? 34} stroke={o.color} strokeWidth={isSel ? 3 : 2} dash={[6, 4]} onDragEnd={(e) => onAnchorDragEnd(o, e)} />;
                    }
                    if (o.kind === 'rect') {
                      return <Rect key={o.id} {...drag} x={pts[0]} y={pts[1]} width={o.width ?? 90} height={o.height ?? 55} stroke={o.color} strokeWidth={isSel ? 3 : 2} onDragEnd={(e) => onAnchorDragEnd(o, e)} />;
                    }
                    if (o.kind === 'text') {
                      return <Text key={o.id} {...drag} x={pts[0]} y={pts[1]} text={o.label ?? ''} fill={o.color} fontSize={16} fontStyle="bold" onDragEnd={(e) => onAnchorDragEnd(o, e)} />;
                    }
                    if (o.kind === 'agent') {
                      const ag = agents.find((x) => x.id === o.agentId);
                      const img = ag?.image ? imageCache[ag.image] : undefined;
                      const R = 18;
                      return (
                        <Group key={o.id} {...drag} x={pts[0]} y={pts[1]} onDragEnd={(e) => onAnchorDragEnd(o, e)}>
                          {animated && <Circle radius={R + 4} stroke={o.side === 'attack' ? '#38bdf8' : '#f23127'} strokeWidth={1} dash={[3, 3]} opacity={0.6} />}
                          <Circle radius={R} fill={o.side === 'attack' ? '#38bdf8' : '#f23127'} stroke={isSel ? '#fff' : undefined} strokeWidth={2} />
                          {img ? (
                            <KonvaImage image={img} width={R * 1.7} height={R * 1.7} offsetX={R * 0.85} offsetY={R * 0.85} />
                          ) : (
                            <Text text={ag?.name.slice(0, 2).toUpperCase() ?? '?'} fontSize={11} fontStyle="bold" fill="#0d0d0b" width={R * 2} align="center" offsetX={R} offsetY={5} />
                          )}
                        </Group>
                      );
                    }
                    // icon (compétence)
                    const ability = abilities.find((x) => x.id === o.abilityId);
                    if (!ability) return null;
                    const img = ability.image ? imageCache[ability.image] : undefined;
                    const strokeColor = isSel ? '#fff' : CATEGORY_COLOR[ability.category];
                    const rotation = o.rotation ?? 0;

                    if (ability.shape === 'rect') {
                      return (
                        <Group key={o.id} {...drag} x={pts[0]} y={pts[1]} rotation={rotation} onDragEnd={(e) => onAnchorDragEnd(o, e)}>
                          {img ? (
                            <KonvaImage image={img} width={ability.width} height={ability.length} offsetX={ability.width / 2} offsetY={ability.length / 2} />
                          ) : (
                            <Rect width={ability.width} height={ability.length} offsetX={ability.width / 2} offsetY={ability.length / 2} fill={CATEGORY_COLOR[ability.category]} opacity={0.45} stroke={strokeColor} strokeWidth={2} />
                          )}
                        </Group>
                      );
                    }
                    if (ability.shape === 'line') {
                      return (
                        <Group key={o.id} {...drag} x={pts[0]} y={pts[1]} rotation={rotation} onDragEnd={(e) => onAnchorDragEnd(o, e)}>
                          <Line points={[0, 0, ability.length, 0]} stroke={CATEGORY_COLOR[ability.category]} strokeWidth={Math.max(ability.width, 3)} lineCap="round" />
                          {isSel && <Circle radius={4} fill="#fff" />}
                        </Group>
                      );
                    }
                    if (ability.shape === 'cone') {
                      return (
                        <Group key={o.id} {...drag} x={pts[0]} y={pts[1]} rotation={rotation - ability.width / 2} onDragEnd={(e) => onAnchorDragEnd(o, e)}>
                          <Wedge radius={ability.length} angle={ability.width} fill={CATEGORY_COLOR[ability.category]} opacity={0.35} stroke={strokeColor} strokeWidth={2} />
                        </Group>
                      );
                    }
                    const r = ability.radius;
                    return (
                      <Group key={o.id} {...drag} x={pts[0]} y={pts[1]} rotation={rotation} onDragEnd={(e) => onAnchorDragEnd(o, e)}>
                        <Circle radius={r + 6} fill="#161310" stroke={strokeColor} strokeWidth={2} />
                        {img ? (
                          <KonvaImage image={img} width={r * 2} height={r * 2} offsetX={r} offsetY={r} />
                        ) : (
                          <AbilityGlyphKonva category={ability.category} x={0} y={0} radius={r} />
                        )}
                      </Group>
                    );
                  })}

                  {draft && (tool === 'arrow' ? (
                    <Arrow points={draft} stroke={color} fill={color} strokeWidth={3} pointerLength={10} pointerWidth={10} opacity={0.6} />
                  ) : tool === 'line' ? (
                    <Line points={draft} stroke={color} strokeWidth={3} opacity={0.6} />
                  ) : null)}
                </Layer>
              </Stage>
            </Panel>

            {/* ── Timeline ── */}
            <div className="panel mt-3 p-3">
              <div className="mb-2 flex items-center gap-3">
                <Button variant={playing ? 'danger' : 'solid'} onClick={() => setPlaying((p) => !p)}>
                  {playing ? '❚❚ Pause' : '▶ Jouer'}
                </Button>
                <Button variant="ghost" onClick={() => { setPlaying(false); setCurrentTime(0); }}>⏮ Début</Button>
                <span className="font-mono text-xs text-[color:var(--text-dim)]">{fmt(currentTime)} / {fmt(duration)}</span>
                <label className="ml-auto flex items-center gap-2 font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)]">
                  durée
                  <input
                    type="number"
                    min={1}
                    max={120}
                    step={1}
                    className="field w-16"
                    value={duration}
                    onChange={(e) => setDuration(Math.max(1, Number(e.target.value) || 10))}
                  />
                </label>
                <button
                  onClick={() => setRecArmed((r) => !r)}
                  title="Quand actif, déplacer un objet enregistre sa position à l'instant courant"
                  className="border px-3 py-1.5 font-mono text-[10px] uppercase tracking-hud"
                  style={recArmed ? { borderColor: '#f23127', background: '#f23127', color: '#0d0d0b' } : { borderColor: 'var(--line-strong)', color: 'var(--text-dim)' }}
                >
                  ● Rec keyframe
                </button>
              </div>

              {/* Scrubber + marqueurs de keyframes de l'objet sélectionné */}
              <div className="relative">
                <input
                  type="range"
                  min={0}
                  max={duration}
                  step={0.1}
                  value={Math.min(currentTime, duration)}
                  onChange={(e) => { setPlaying(false); setCurrentTime(Number(e.target.value)); }}
                  className="w-full accent-[var(--accent)]"
                />
                {selected?.keyframes && (
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-2">
                    {selected.keyframes.map((k) => (
                      <span
                        key={k.t}
                        className="absolute top-0 h-2 w-0.5 bg-[color:var(--signal-warn)]"
                        style={{ left: `${(k.t / duration) * 100}%` }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <p className="mt-2 font-mono text-[10px] text-[color:var(--text-mute)]">
                {animatedCount > 0 ? `${animatedCount} objet(s) animé(s). ` : ''}
                Astuce : arme « Rec keyframe », place la tête de lecture sur un temps, puis déplace un objet — sa position à cet instant est enregistrée. ≥2 keyframes = il se déplace pendant la lecture.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Panel title="Outils">
              <div className="grid grid-cols-2 gap-2">
                {([
                  ['select', 'Sélection'],
                  ['arrow', 'Flèche'],
                  ['line', 'Ligne'],
                  ['circle', 'Cercle'],
                  ['rect', 'Rectangle'],
                  ['text', 'Texte'],
                ] as [Tool, string][]).map(([t, label]) => (
                  <button
                    key={t}
                    onClick={() => setTool(t)}
                    className="border px-2 py-1.5 font-mono text-[10px] uppercase tracking-hud"
                    style={tool === t ? { borderColor: 'var(--accent)', background: 'var(--accent)', color: '#0d0d0b' } : { borderColor: 'var(--line-strong)', color: 'var(--text-dim)' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-2 font-mono text-[10px] text-[color:var(--text-mute)]">
                Agents/compétences depuis la barre au-dessus du plan. Suppr = supprimer · Ctrl+D = dupliquer · Échap = désélectionner · Espace = jouer.
              </p>
            </Panel>

            {(tool === 'arrow' || tool === 'line' || tool === 'circle' || tool === 'rect' || tool === 'text') && (
              <Panel title="Couleur">
                <div className="flex gap-2">
                  {SWATCHES.map((sw) => (
                    <button key={sw} onClick={() => setColor(sw)} className="h-7 w-7 border-2" style={{ background: sw, borderColor: color === sw ? '#fff' : 'transparent' }} />
                  ))}
                </div>
              </Panel>
            )}

            {selected && (
              <Panel title="Sélection">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => rotateSelected(-15)}>↺ 15°</Button>
                    <Button variant="ghost" onClick={() => rotateSelected(15)}>↻ 15°</Button>
                  </div>
                  <Button variant="ghost" onClick={duplicateSelected}>⧉ Dupliquer</Button>
                  <Button variant="ghost" onClick={deleteSelected}>Supprimer</Button>
                  <div className="mt-1 border-t border-line pt-2">
                    <p className="hud-label mb-1 text-[10px]">ANIMATION</p>
                    <Button onClick={() => recordKeyframe(selected.id, valueAt(selected, currentTime))}>
                      ● Keyframe à {fmt(currentTime)}
                    </Button>
                    {selected.keyframes && selected.keyframes.length > 0 && (
                      <>
                        <p className="mt-2 font-mono text-[10px] text-[color:var(--text-dim)]">
                          {selected.keyframes.length} keyframe(s) : {selected.keyframes.map((k) => fmt(k.t)).join(', ')}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <Button variant="ghost" onClick={deleteKeyframeAtPlayhead}>Suppr. keyframe ({fmt(currentTime)})</Button>
                        </div>
                        <button onClick={clearAnimation} className="mt-1 font-mono text-[10px] text-[color:var(--text-mute)] hover:text-accent">effacer l'animation</button>
                      </>
                    )}
                  </div>
                </div>
              </Panel>
            )}

            <Panel title="Actions">
              <div className="flex flex-col gap-2">
                <Button variant="ghost" onClick={undo} disabled={history.length === 0}>↺ Annuler</Button>
                <Button variant="danger" onClick={clearAll}>Tout effacer</Button>
                <Button variant="ghost" onClick={exportPng}>Exporter en PNG</Button>
                <Button onClick={save} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer le plan'}</Button>
              </div>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
