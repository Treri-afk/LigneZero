import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { db } from '@/lib/supabase';
import { Button, Panel, Spinner } from '@/components/ui';
import { FORMATS, type FormatId } from '@/social/formats';
import { setStudioBrand } from '@/social/brand';
import {
  EMPTY_DATA,
  GROUP_LABELS,
  type FieldDef,
  type Selection,
  type StudioData,
  type TemplateDef,
} from '@/social/types';
import { groupedTemplates, templateById } from '@/social';
import { weekOptions } from '@/social/week';
import {
  type BrandKit,
  type Draft,
  type Platform,
  applyPlatform,
  loadDrafts,
  loadKit,
  saveDrafts,
  saveKit,
} from '@/social/brandKit';
import { dataUrlToBytes, makeZip } from '@/social/zip';

/** Attend N frames que React commit + le layout se stabilise avant capture. */
function waitFrames(n: number): Promise<void> {
  return new Promise((resolve) => {
    let i = 0;
    const tick = () => (++i >= n ? resolve() : requestAnimationFrame(tick));
    requestAnimationFrame(tick);
  });
}

function triggerDownload(href: string, name: string) {
  const a = document.createElement('a');
  a.download = name;
  a.href = href;
  a.click();
}

type Content = Record<string, unknown>;

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: 'generic', label: 'Générique' },
  { id: 'x', label: 'X' },
  { id: 'instagram', label: 'Instagram' },
];

export function SocialStudioPage() {
  const [data, setData] = useState<StudioData>(EMPTY_DATA);
  const [loaded, setLoaded] = useState(false);
  const [templateId, setTemplateId] = useState<string>('matchday');
  const [sel, setSel] = useState<Selection>({});
  const [content, setContent] = useState<Content | null>(null);
  const [format, setFormat] = useState<FormatId>('x');
  const [captureFormat, setCaptureFormat] = useState<FormatId>('x');
  const [hi, setHi] = useState(false); // export @2x
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [platform, setPlatform] = useState<Platform>('generic');
  const [kit, setKit] = useState<BrandKit>(() => loadKit());
  const [drafts, setDrafts] = useState<Draft[]>(() => loadDrafts());

  const groups = useMemo(() => groupedTemplates(), []);
  const template = templateById(templateId) as TemplateDef<Content> | undefined;
  const allowedFormats = useMemo(
    () => (template?.formats ? FORMATS.filter((f) => template.formats!.includes(f.id)) : FORMATS),
    [template],
  );
  const weeks = useMemo(() => weekOptions(data.matches), [data.matches]);

  const regen = useCallback((tid: string, s: Selection, d: StudioData) => {
    const t = templateById(tid);
    setContent(t ? (t.fromData(d, s) as Content | null) : null);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [games, players, matches, sponsors, clips, creators, products, brand, announcements] = await Promise.all([
          db.listGames(),
          db.listPlayers(),
          db.listMatches(),
          db.listSponsors().catch(() => []),
          db.listClips().catch(() => []),
          db.listCreators().catch(() => []),
          db.listProducts().catch(() => []),
          db.getBrandSettings(),
          db.listAnnouncements().catch(() => []),
        ]);
        // Les templates et les primitives lisent la marque via ce singleton
        // (voir social/brand.ts) plutôt que de la recevoir en cascade.
        setStudioBrand(brand);
        const d: StudioData = { games, players, matches, staff: [], sponsors, clips, creators, products, brand, announcements };
        setData(d);
        const initial: Selection = {
          matchId: matches[0]?.id,
          playerId: players[0]?.id,
          gameId: games[0]?.id,
          sponsorId: sponsors[0]?.id,
          clipId: clips[0]?.id,
          creatorId: creators[0]?.id,
          productId: products[0]?.id,
          weekStart: weekOptions(matches)[0]?.start,
        };
        setSel(initial);
        regen(templateId, initial, d);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
      } finally {
        setLoaded(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sélection ────────────────────────────────────────────────
  function rosterFirst(matchId?: string): string | undefined {
    const m = data.matches.find((x) => x.id === matchId);
    return data.players.find((p) => p.gameId === m?.gameId)?.id ?? data.players[0]?.id;
  }

  function pickTemplate(tid: string) {
    setTemplateId(tid);
    const t = templateById(tid);
    if (t?.formats && !t.formats.includes(format)) {
      setFormat(t.formats[0]);
      setCaptureFormat(t.formats[0]);
    }
    regen(tid, sel, data);
  }

  function patchSel(patch: Partial<Selection>) {
    const next = { ...sel, ...patch };
    setSel(next);
    regen(templateId, next, data);
  }

  function pickFormat(id: FormatId) {
    setFormat(id);
    setCaptureFormat(id);
  }

  function resetContent() {
    regen(templateId, sel, data);
  }

  function setField(key: string, value: string) {
    setContent((c) => (c ? { ...c, [key]: value } : c));
  }

  // ── Export ───────────────────────────────────────────────────
  const captureRef = useRef<HTMLDivElement>(null);
  const capFmt = useMemo(() => FORMATS.find((f) => f.id === captureFormat)!, [captureFormat]);

  async function renderFormat(id: FormatId): Promise<string | null> {
    const f = FORMATS.find((x) => x.id === id)!;
    setCaptureFormat(id);
    await waitFrames(2);
    const el = captureRef.current;
    if (!el) return null;
    return toPng(el, { width: f.w, height: f.h, pixelRatio: hi ? 2 : 1, cacheBust: true });
  }

  function exportError(e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // Erreur typique de canvas « tainted » par une image distante sans CORS.
    if (/taint|secur|cross-?origin/i.test(msg)) {
      setError('Export bloqué : une image distante refuse le partage (CORS). Uploade-la via le champ image plutôt que de coller une URL.');
    } else {
      setError(`Échec de l'export : ${msg}`);
    }
  }

  async function downloadSingle() {
    if (!content || !template) return;
    setBusy(true);
    setError(null);
    try {
      await document.fonts.ready; // évite les PNG en police de secours
      const url = await renderFormat(format);
      if (url) triggerDownload(url, `lignezero_${template.id}_${format}${hi ? '@2x' : ''}.png`);
    } catch (e) {
      exportError(e);
    } finally {
      setBusy(false);
      setCaptureFormat(format);
    }
  }

  async function downloadZip() {
    if (!content || !template) return;
    setBusy(true);
    setError(null);
    try {
      await document.fonts.ready;
      const files: { name: string; bytes: Uint8Array }[] = [];
      for (const f of allowedFormats) {
        const url = await renderFormat(f.id);
        if (url) files.push({ name: `${template.id}_${f.id}${hi ? '@2x' : ''}.png`, bytes: dataUrlToBytes(url) });
        await waitFrames(1);
      }
      const blob = makeZip(files);
      const href = URL.createObjectURL(blob);
      triggerDownload(href, `lignezero_${template.id}.zip`);
      URL.revokeObjectURL(href);
    } catch (e) {
      exportError(e);
    } finally {
      setBusy(false);
      setCaptureFormat(format);
    }
  }

  // ── Légende ──────────────────────────────────────────────────
  const finalCaption = useMemo(
    () => (content && template ? applyPlatform(template.caption(content), platform, kit) : ''),
    [content, template, platform, kit],
  );

  async function copyCaption() {
    if (finalCaption) await navigator.clipboard.writeText(finalCaption);
  }

  // ── Brand kit ────────────────────────────────────────────────
  function updateKit(patch: Partial<BrandKit>) {
    const next = { ...kit, ...patch };
    setKit(next);
    saveKit(next);
  }

  // ── Brouillons ───────────────────────────────────────────────
  function saveDraft() {
    if (!content || !template) return;
    const draft: Draft = {
      id: `${Date.now()}`,
      label: `${template.label} · ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      templateId,
      format,
      content,
      savedAt: Date.now(),
    };
    const next = [draft, ...drafts].slice(0, 40);
    setDrafts(next);
    saveDrafts(next);
  }

  function loadDraft(d: Draft) {
    setTemplateId(d.templateId);
    setFormat(d.format);
    setCaptureFormat(d.format);
    setContent(d.content);
  }

  function deleteDraft(id: string) {
    const next = drafts.filter((d) => d.id !== id);
    setDrafts(next);
    saveDrafts(next);
  }

  // ── Aperçu (scale responsive) ────────────────────────────────
  const fmt = useMemo(() => FORMATS.find((f) => f.id === format)!, [format]);
  const [boxW, setBoxW] = useState(0);
  const roRef = useRef<ResizeObserver | null>(null);
  const setBoxRef = useCallback((el: HTMLDivElement | null) => {
    roRef.current?.disconnect();
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBoxW(e.contentRect.width));
    ro.observe(el);
    roRef.current = ro;
  }, []);
  const scale = boxW ? Math.min(boxW / fmt.w, 620 / fmt.h) : 0;

  if (error && !content && !loaded) {
    return <p className="border border-[color:var(--accent)] px-3 py-2 font-mono text-xs text-accent">{error}</p>;
  }
  if (!loaded || !template) return <Spinner label="Chargement…" />;

  const Visual = template.Visual;
  const showPlayerSecondary = template.secondary?.includes('player') && template.source !== 'player';
  const templateCount = groups.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <div>
      <header className="mb-6">
        <p className="hud-label text-[11px]">SOC // Studio réseaux</p>
        <h1 className="font-display text-3xl font-bold uppercase tracking-hud">Studio réseaux</h1>
        <p className="mt-1 font-mono text-xs text-[color:var(--text-dim)]">
          &gt; {templateCount} templates · export PNG multi-format (ZIP) + légende par plateforme.
        </p>
      </header>

      {error && (
        <p className="mb-4 border border-[color:var(--accent)] px-3 py-2 font-mono text-xs text-accent">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        {/* ── Contrôles ── */}
        <div className="space-y-5">
          <Panel title="Template">
            <div className="space-y-3">
              {groups.map((g) => (
                <div key={g.group}>
                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)]">
                    {GROUP_LABELS[g.group]}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {g.items.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => pickTemplate(t.id)}
                        className={`border px-3 py-1.5 font-mono text-[11px] uppercase tracking-hud transition-colors ${
                          templateId === t.id
                            ? 'border-accent bg-accent text-ink'
                            : 'border-line-strong text-[color:var(--text-dim)] hover:border-line-bright'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Source">
            <SourcePicker
              template={template}
              data={data}
              sel={sel}
              weeks={weeks}
              onMatch={(id) => patchSel({ matchId: id, playerId: rosterFirst(id) })}
              onPlayer={(id) => patchSel({ playerId: id })}
              onWeek={(start) => patchSel({ weekStart: start })}
              onEntity={(patch) => patchSel(patch)}
            />
            {showPlayerSecondary && (
              <div className="mt-3">
                <label className="label">Joueur mis en avant</label>
                <select className="field" value={sel.playerId ?? ''} onChange={(e) => patchSel({ playerId: e.target.value })}>
                  {playersForMatch(data, sel.matchId).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.pseudo} · {p.role}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {template.hint && (
              <p className="mt-2 font-mono text-[10px] text-[color:var(--text-mute)]">&gt; {template.hint}</p>
            )}
          </Panel>

          <Panel title="Format">
            <div className="flex flex-wrap gap-2">
              {allowedFormats.map((f) => (
                <button
                  key={f.id}
                  onClick={() => pickFormat(f.id)}
                  className={`border px-3 py-1.5 font-mono text-[11px] uppercase tracking-hud transition-colors ${
                    format === f.id
                      ? 'border-accent bg-accent text-ink'
                      : 'border-line-strong text-[color:var(--text-dim)] hover:border-line-bright'
                  }`}
                >
                  {f.label} <span className="opacity-60">{f.note}</span>
                </button>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-2 font-mono text-[11px] text-[color:var(--text-dim)]">
              <input type="checkbox" checked={hi} onChange={(e) => setHi(e.target.checked)} />
              Export @2x (haute résolution)
            </label>
          </Panel>

          {content && template.fields.length > 0 && (
            <Panel
              title="Contenu (éditable)"
              right={
                <button onClick={resetContent} className="font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)] hover:text-accent">
                  ↺ reset
                </button>
              }
            >
              <div className="grid grid-cols-2 gap-3">
                {template.fields.map((f) => (
                  <FieldInput key={f.key} def={f} value={String(content[f.key] ?? '')} onChange={(v) => setField(f.key, v)} />
                ))}
              </div>
            </Panel>
          )}

          <Panel title="Brand kit">
            <label className="label">Hashtags par défaut (séparés par une virgule)</label>
            <input
              className="field mb-3"
              placeholder="teamLZ, esport, LFL"
              value={kit.hashtags.join(', ')}
              onChange={(e) => updateKit({ hashtags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
            />
            <label className="label">Mention en pied de légende</label>
            <input className="field mb-3" placeholder="@lignezero" value={kit.mention} onChange={(e) => updateKit({ mention: e.target.value })} />
            <p className="font-mono text-[10px] text-[color:var(--text-mute)]">&gt; Appliqué aux légendes. Sauvegardé sur ce poste.</p>
          </Panel>

          <Panel title="Brouillons" right={<Button variant="ghost" onClick={saveDraft}>+ Sauver</Button>}>
            {drafts.length === 0 ? (
              <p className="font-mono text-[11px] text-[color:var(--text-mute)]">&gt; Aucun brouillon. « Sauver » enregistre le visuel courant.</p>
            ) : (
              <ul className="space-y-1.5">
                {drafts.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 border border-line-strong px-2 py-1.5">
                    <button onClick={() => loadDraft(d)} className="min-w-0 flex-1 truncate text-left font-mono text-[11px] text-[color:var(--text-dim)] hover:text-accent">
                      {d.label}
                    </button>
                    <button onClick={() => deleteDraft(d.id)} className="font-mono text-[11px] text-[color:var(--text-mute)] hover:text-accent">
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {/* ── Aperçu + export ── */}
        <div className="space-y-4">
          <Panel
            title={`Aperçu · ${fmt.w}×${fmt.h}${hi ? ' @2x' : ''}`}
            right={
              <div className="flex gap-2">
                <Button variant="ghost" onClick={downloadZip} disabled={busy}>ZIP tous formats</Button>
                <Button onClick={downloadSingle} disabled={busy}>{busy ? 'Export…' : '↓ PNG'}</Button>
              </div>
            }
          >
            <div ref={setBoxRef} className="flex justify-center bg-base-900 p-4">
              {content ? (
                <div style={{ width: fmt.w * scale, height: fmt.h * scale, overflow: 'hidden' }}>
                  <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                    <div style={{ width: fmt.w, height: fmt.h, position: 'relative', overflow: 'hidden' }}>
                      <Visual content={content} w={fmt.w} h={fmt.h} />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="py-16 font-mono text-xs text-[color:var(--text-mute)]">
                  &gt; Sélection incomplète pour ce template.
                </p>
              )}
            </div>
          </Panel>

          <Panel
            title="Légende générée"
            right={
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPlatform(p.id)}
                      className={`border px-2 py-1 font-mono text-[10px] uppercase tracking-hud transition-colors ${
                        platform === p.id ? 'border-accent bg-accent text-ink' : 'border-line-strong text-[color:var(--text-dim)] hover:border-line-bright'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <Button variant="ghost" onClick={copyCaption}>Copier</Button>
              </div>
            }
          >
            <textarea className="field h-40" readOnly value={finalCaption} />
          </Panel>
        </div>
      </div>

      {/* Nœud de capture off-screen (taille native, jamais scalé). */}
      <div style={{ position: 'fixed', left: -100000, top: 0, pointerEvents: 'none' }} aria-hidden>
        <div ref={captureRef} style={{ width: capFmt.w, height: capFmt.h, position: 'relative', overflow: 'hidden' }}>
          {content && <Visual content={content} w={capFmt.w} h={capFmt.h} />}
        </div>
      </div>
    </div>
  );
}

/** Liste des joueurs pertinents pour un match (roster du jeu, sinon tous). */
function playersForMatch(data: StudioData, matchId?: string) {
  const m = data.matches.find((x) => x.id === matchId);
  const roster = m ? data.players.filter((p) => p.gameId === m.gameId) : [];
  return roster.length ? roster : data.players;
}

/** Sélecteur de source adapté au SourceKind du template. */
function SourcePicker({
  template,
  data,
  sel,
  weeks,
  onMatch,
  onPlayer,
  onWeek,
  onEntity,
}: {
  template: TemplateDef<Content>;
  data: StudioData;
  sel: Selection;
  weeks: { start: string; label: string; count: number }[];
  onMatch: (id: string) => void;
  onPlayer: (id: string) => void;
  onWeek: (start: string) => void;
  onEntity: (patch: Partial<Selection>) => void;
}) {
  switch (template.source) {
    case 'match':
      return (
        <>
          <label className="label">Match</label>
          <select className="field" value={sel.matchId ?? ''} onChange={(e) => onMatch(e.target.value)}>
            {data.matches.map((m) => (
              <option key={m.id} value={m.id}>
                {new Date(m.dateISO).toLocaleDateString('fr-FR')} · vs {m.opponent.name} ({m.status})
              </option>
            ))}
          </select>
        </>
      );
    case 'matchWeek':
      return (
        <>
          <label className="label">Semaine</label>
          <select className="field" value={sel.weekStart ?? ''} onChange={(e) => onWeek(e.target.value)}>
            {weeks.length === 0 && <option value="">— aucun match —</option>}
            {weeks.map((wk) => (
              <option key={wk.start} value={wk.start}>
                {wk.label} · {wk.count} match{wk.count > 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </>
      );
    case 'player':
      return (
        <>
          <label className="label">Joueur</label>
          <select className="field" value={sel.playerId ?? ''} onChange={(e) => onPlayer(e.target.value)}>
            {data.players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.pseudo} · {p.role}
              </option>
            ))}
          </select>
        </>
      );
    case 'game':
      return <EntitySelect label="Jeu" items={data.games.map((g) => ({ id: g.id, label: g.name }))} value={sel.gameId} onChange={(id) => onEntity({ gameId: id })} />;
    case 'sponsor':
      return <EntitySelect label="Sponsor" items={data.sponsors.map((s) => ({ id: s.id, label: s.name }))} value={sel.sponsorId} onChange={(id) => onEntity({ sponsorId: id })} />;
    case 'clip':
      return <EntitySelect label="Clip" items={data.clips.map((c) => ({ id: c.id, label: c.title }))} value={sel.clipId} onChange={(id) => onEntity({ clipId: id })} />;
    case 'creator':
      return <EntitySelect label="Créateur" items={data.creators.map((c) => ({ id: c.id, label: c.name }))} value={sel.creatorId} onChange={(id) => onEntity({ creatorId: id })} />;
    case 'product':
      return <EntitySelect label="Produit" items={data.products.map((p) => ({ id: p.id, label: p.name }))} value={sel.productId} onChange={(id) => onEntity({ productId: id })} />;
    case 'none':
    default:
      return <p className="font-mono text-[11px] text-[color:var(--text-mute)]">&gt; Contenu libre — édite les champs ci-dessous.</p>;
  }
}

function EntitySelect({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: { id: string; label: string }[];
  value?: string;
  onChange: (id: string) => void;
}) {
  return (
    <>
      <label className="label">{label}</label>
      <select className="field" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {items.length === 0 && <option value="">— aucun —</option>}
        {items.map((it) => (
          <option key={it.id} value={it.id}>
            {it.label}
          </option>
        ))}
      </select>
    </>
  );
}

function FieldInput({ def, value, onChange }: { def: FieldDef<Content>; value: string; onChange: (v: string) => void }) {
  const span = def.span === 2 ? 'col-span-2' : '';

  if (def.type === 'color') {
    return (
      <div className={span}>
        <label className="label">{def.label}</label>
        <div className="flex gap-2">
          <input type="color" className="h-9 w-10 shrink-0 border border-line-strong bg-transparent" value={value || '#f23127'} onChange={(e) => onChange(e.target.value)} />
          <input className="field" value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
      </div>
    );
  }

  if (def.type === 'image') {
    return <ImageField label={def.label} span={span} value={value} onChange={onChange} />;
  }

  if (def.type === 'textarea') {
    return (
      <div className={span}>
        <label className="label">{def.label}</label>
        <textarea className="field h-20" placeholder={def.placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }

  return (
    <div className={span}>
      <label className="label">{def.label}</label>
      <input className="field" placeholder={def.placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** Champ image : URL + upload fichier (→ dataURL, contourne les soucis CORS). */
function ImageField({ label, span, value, onChange }: { label: string; span: string; value: string; onChange: (v: string) => void }) {
  const [drag, setDrag] = useState(false);

  function readFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result));
    reader.readAsDataURL(file);
  }

  const isData = value.startsWith('data:');
  return (
    <div className={`col-span-2 ${span}`}>
      <label className="label">{label}</label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          readFile(e.dataTransfer.files[0]);
        }}
        className={`flex items-center gap-2 border p-2 ${drag ? 'border-accent' : 'border-line-strong'}`}
      >
        {value ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <img src={value} className="h-10 w-10 shrink-0 border border-line-strong object-contain" />
        ) : (
          <span className="grid h-10 w-10 shrink-0 place-items-center border border-line-strong font-mono text-[9px] text-[color:var(--text-mute)]">IMG</span>
        )}
        <div className="min-w-0 flex-1">
          <input
            className="field"
            placeholder="URL ou glisse une image ici"
            value={isData ? '' : value}
            onChange={(e) => onChange(e.target.value)}
          />
          {isData && <p className="mt-1 font-mono text-[9px] text-[color:var(--signal-ok,#4fd08a)]">image uploadée ✓</p>}
        </div>
        <label className="shrink-0 cursor-pointer border border-line-strong px-2 py-1 font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-dim)] hover:border-line-bright">
          Upload
          <input type="file" accept="image/*" className="hidden" onChange={(e) => readFile(e.target.files?.[0])} />
        </label>
        {value && (
          <button onClick={() => onChange('')} className="shrink-0 font-mono text-[11px] text-[color:var(--text-mute)] hover:text-accent">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
