import { useEffect, useState } from 'react';
import type { AbilityCategory, AbilityShape, AgentClass, ValorantAbility, ValorantAgent } from '@lignezero/types';
import { db } from '@/lib/supabase';
import { Badge, Button, Modal, Panel, Spinner } from '@/components/ui';
import { ImageField } from '@/components/ImageField';
import { uid } from '@/lib/id';
import { ALL_CATEGORIES, CATEGORY_LABEL } from '@/lib/abilityCategories';

const CLASS_LABEL: Record<AgentClass, string> = { duelist: 'Duelist', initiator: 'Initiator', controller: 'Controller', sentinel: 'Sentinel' };
const SHAPE_LABEL: Record<AbilityShape, string> = { circle: 'Cercle', rect: 'Rectangle', line: 'Ligne', cone: 'Cône' };
const SLOTS: ValorantAbility['slot'][] = ['C', 'Q', 'E', 'X'];

const EMPTY_AGENT: ValorantAgent = { id: '', name: '', cls: 'duelist', image: '', createdAt: '' };
const emptyAbility = (agentId: string): ValorantAbility => ({
  id: '', agentId, slot: 'C', name: '', category: 'other', shape: 'circle', radius: 16, width: 16, length: 16, image: '', createdAt: '',
});

/**
 * Agents + compétences en vue imbriquée (dossier/sous-dossier) : on clique un
 * agent, ses compétences apparaissent en dessous. Remplace l'ancienne page
 * "Compétences" séparée — tout se gère depuis l'agent parent.
 */
export function AgentsSettingsPage() {
  const [agents, setAgents] = useState<ValorantAgent[] | null>(null);
  const [abilities, setAbilities] = useState<ValorantAbility[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editingAgent, setEditingAgent] = useState<ValorantAgent | null>(null);
  const [editingAbility, setEditingAbility] = useState<ValorantAbility | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    try {
      const [ag, ab] = await Promise.all([db.listValorantAgents(), db.listValorantAbilities()]);
      setAgents(ag);
      setAbilities(ab);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  }
  useEffect(() => {
    refresh();
  }, []);

  async function removeAgent(a: ValorantAgent) {
    if (!confirm(`Supprimer ${a.name} et toutes ses compétences ?`)) return;
    try {
      await db.removeValorantAgent(a.id);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  }
  async function removeAbility(a: ValorantAbility) {
    if (!confirm(`Supprimer ${a.name} ?`)) return;
    try {
      await db.removeValorantAbility(a.id);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  }

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <p className="hud-label text-[11px]">AGT // Agents &amp; compétences</p>
          <h1 className="font-display text-3xl font-bold uppercase tracking-hud">Agents &amp; compétences</h1>
          <p className="mt-1 font-mono text-xs text-[color:var(--text-dim)]">
            &gt; Clique un agent pour voir/éditer ses compétences.
          </p>
        </div>
        <Button onClick={() => setEditingAgent({ ...EMPTY_AGENT, id: uid() })}>+ Nouvel agent</Button>
      </header>

      {error && <p className="mb-4 border border-[color:var(--accent)] px-3 py-2 font-mono text-xs text-accent">{error}</p>}

      {!agents ? (
        <Spinner label="Chargement…" />
      ) : agents.length === 0 ? (
        <Panel><p className="font-mono text-sm text-[color:var(--text-dim)]">Aucun agent. Crée-en un avec « + Nouvel agent ».</p></Panel>
      ) : (
        <div className="space-y-2">
          {agents.map((a) => {
            const open = expanded === a.id;
            const abs = abilities.filter((x) => x.agentId === a.id);
            return (
              <div key={a.id} className="panel overflow-hidden">
                <button
                  onClick={() => setExpanded(open ? null : a.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-base-700/50"
                >
                  <span className="font-mono text-xs text-[color:var(--text-mute)]">{open ? '▾' : '▸'}</span>
                  {a.image ? (
                    <img src={a.image} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong font-mono text-xs text-[color:var(--text-mute)]">
                      {a.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span className="font-display text-sm font-bold uppercase tracking-hud text-[color:var(--text)]">{a.name}</span>
                  <Badge>{CLASS_LABEL[a.cls]}</Badge>
                  <span className="font-mono text-[10px] text-[color:var(--text-mute)]">{abs.length} compétence(s)</span>
                  <span className="ml-auto flex gap-3">
                    <span
                      role="button"
                      onClick={(e) => { e.stopPropagation(); setEditingAgent(a); }}
                      className="font-mono text-xs text-[color:var(--text-dim)] hover:text-accent"
                    >
                      éditer
                    </span>
                    <span
                      role="button"
                      onClick={(e) => { e.stopPropagation(); removeAgent(a); }}
                      className="font-mono text-xs text-[color:var(--text-mute)] hover:text-accent"
                    >
                      suppr.
                    </span>
                  </span>
                </button>

                {open && (
                  <div className="border-t border-line-strong px-4 py-3">
                    {abs.length === 0 ? (
                      <p className="mb-3 font-mono text-xs text-[color:var(--text-dim)]">Aucune compétence pour cet agent.</p>
                    ) : (
                      <table className="mb-3 w-full text-left">
                        <thead>
                          <tr className="hud-label text-[10px]">
                            <th className="py-1 pr-3">Icône</th>
                            <th className="py-1 pr-3">Slot</th>
                            <th className="py-1 pr-3">Nom</th>
                            <th className="py-1 pr-3">Catégorie</th>
                            <th className="py-1 pr-3">Forme</th>
                            <th className="py-1 pr-3">Dimensions (px)</th>
                            <th className="py-1 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="font-mono text-xs">
                          {abs.map((ab) => (
                            <tr key={ab.id} className="border-t border-line">
                              <td className="py-1.5 pr-3">
                                {ab.image ? <img src={ab.image} alt="" className="h-6 w-6 object-cover" /> : <span className="text-[color:var(--text-mute)]">—</span>}
                              </td>
                              <td className="py-1.5 pr-3"><Badge>{ab.slot}</Badge></td>
                              <td className="py-1.5 pr-3 text-[color:var(--text)]">{ab.name}</td>
                              <td className="py-1.5 pr-3 text-[color:var(--text-dim)]">{CATEGORY_LABEL[ab.category]}</td>
                              <td className="py-1.5 pr-3 text-[color:var(--text-dim)]">{SHAPE_LABEL[ab.shape]}</td>
                              <td className="py-1.5 pr-3 text-[color:var(--text-dim)]">
                                {ab.shape === 'circle' ? `r=${ab.radius}` : ab.shape === 'line' ? `L=${ab.length} · ép=${ab.width}` : ab.shape === 'cone' ? `portée=${ab.length} · ${ab.width}°` : `${ab.width}×${ab.length}`}
                              </td>
                              <td className="py-1.5 text-right">
                                <button onClick={() => setEditingAbility(ab)} className="mr-3 text-[color:var(--text-dim)] hover:text-accent">éditer</button>
                                <button onClick={() => removeAbility(ab)} className="text-[color:var(--text-mute)] hover:text-accent">suppr.</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    <Button variant="ghost" onClick={() => setEditingAbility(emptyAbility(a.id))}>+ Ajouter une compétence</Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editingAgent && (
        <AgentForm
          agent={editingAgent}
          onClose={() => setEditingAgent(null)}
          onSaved={() => { setEditingAgent(null); refresh(); }}
        />
      )}
      {editingAbility && (
        <AbilityForm
          ability={editingAbility}
          onClose={() => setEditingAbility(null)}
          onSaved={() => { setEditingAbility(null); refresh(); }}
        />
      )}
    </div>
  );
}

function AgentForm({ agent, onClose, onSaved }: { agent: ValorantAgent; onClose: () => void; onSaved: () => void }) {
  const isNew = !agent.createdAt;
  const [a, setA] = useState<ValorantAgent>(agent);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof ValorantAgent>(k: K, v: ValorantAgent[K]) => setA((x) => ({ ...x, [k]: v }));

  async function save() {
    if (!a.id.trim() || !a.name.trim()) {
      setError('ID et nom requis.');
      return;
    }
    setBusy(true);
    try {
      await db.upsertValorantAgent(a);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={isNew ? 'Nouvel agent' : `Éditer ${agent.name}`}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="label">ID (slug unique)</span>
          <input className="field" value={a.id} disabled={!isNew} onChange={(e) => set('id', e.target.value)} placeholder="ex. jett" />
        </div>
        <div>
          <span className="label">Nom</span>
          <input className="field" value={a.name} onChange={(e) => set('name', e.target.value)} placeholder="Jett" />
        </div>
        <div>
          <span className="label">Classe</span>
          <select className="field" value={a.cls} onChange={(e) => set('cls', e.target.value as AgentClass)}>
            {(Object.keys(CLASS_LABEL) as AgentClass[]).map((c) => (
              <option key={c} value={c}>{CLASS_LABEL[c]}</option>
            ))}
          </select>
        </div>
        <div>
          <span className="label">Portrait/icône (optionnel)</span>
          <ImageField value={a.image ?? ''} onChange={(url) => set('image', url)} folder="valorant-agents" />
        </div>
      </div>
      {error && <p className="mt-4 border border-[color:var(--accent)] px-3 py-2 font-mono text-xs text-accent">{error}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button onClick={save} disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</Button>
      </div>
    </Modal>
  );
}

function AbilityForm({ ability, onClose, onSaved }: { ability: ValorantAbility; onClose: () => void; onSaved: () => void }) {
  const isNew = !ability.createdAt;
  const [a, setA] = useState<ValorantAbility>(ability);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof ValorantAbility>(k: K, v: ValorantAbility[K]) => setA((x) => ({ ...x, [k]: v }));

  async function save() {
    if (!a.id.trim() || !a.name.trim()) {
      setError('ID et nom requis.');
      return;
    }
    setBusy(true);
    try {
      await db.upsertValorantAbility(a);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={isNew ? 'Nouvelle compétence' : `Éditer ${ability.name}`}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="label">ID (slug unique)</span>
          <input className="field" value={a.id} disabled={!isNew} onChange={(e) => set('id', e.target.value)} placeholder="ex. jett-cloudburst" />
        </div>
        <div>
          <span className="label">Slot</span>
          <select className="field" value={a.slot} onChange={(e) => set('slot', e.target.value as ValorantAbility['slot'])}>
            {SLOTS.map((s) => <option key={s} value={s}>{s}{s === 'X' ? ' (ultime)' : ''}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <span className="label">Nom</span>
          <input className="field" value={a.name} onChange={(e) => set('name', e.target.value)} placeholder="Cloudburst" />
        </div>
        <div>
          <span className="label">Catégorie (icône générique)</span>
          <select className="field" value={a.category} onChange={(e) => set('category', e.target.value as AbilityCategory)}>
            {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
          </select>
        </div>
        <div>
          <span className="label">Forme sur le plan</span>
          <select className="field" value={a.shape} onChange={(e) => set('shape', e.target.value as AbilityShape)}>
            {(Object.keys(SHAPE_LABEL) as AbilityShape[]).map((s) => <option key={s} value={s}>{SHAPE_LABEL[s]}</option>)}
          </select>
        </div>

        {a.shape === 'circle' && (
          <div>
            <span className="label">Rayon (px)</span>
            <input className="field" type="number" value={a.radius} onChange={(e) => set('radius', Number(e.target.value) || 0)} />
          </div>
        )}
        {a.shape === 'rect' && (
          <>
            <div>
              <span className="label">Largeur (px)</span>
              <input className="field" type="number" value={a.width} onChange={(e) => set('width', Number(e.target.value) || 0)} />
            </div>
            <div>
              <span className="label">Longueur (px)</span>
              <input className="field" type="number" value={a.length} onChange={(e) => set('length', Number(e.target.value) || 0)} />
            </div>
          </>
        )}
        {a.shape === 'line' && (
          <>
            <div>
              <span className="label">Longueur (px)</span>
              <input className="field" type="number" value={a.length} onChange={(e) => set('length', Number(e.target.value) || 0)} />
            </div>
            <div>
              <span className="label">Épaisseur (px)</span>
              <input className="field" type="number" value={a.width} onChange={(e) => set('width', Number(e.target.value) || 0)} />
            </div>
          </>
        )}
        {a.shape === 'cone' && (
          <>
            <div>
              <span className="label">Portée (px)</span>
              <input className="field" type="number" value={a.length} onChange={(e) => set('length', Number(e.target.value) || 0)} />
            </div>
            <div>
              <span className="label">Angle d'ouverture (°)</span>
              <input className="field" type="number" value={a.width} onChange={(e) => set('width', Number(e.target.value) || 0)} />
            </div>
          </>
        )}

        <div className="col-span-2">
          <span className="label">Icône (optionnel — remplace le glyphe générique si fournie)</span>
          <ImageField value={a.image ?? ''} onChange={(url) => set('image', url)} folder="valorant-abilities" />
        </div>
      </div>
      {error && <p className="mt-4 border border-[color:var(--accent)] px-3 py-2 font-mono text-xs text-accent">{error}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button onClick={save} disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</Button>
      </div>
    </Modal>
  );
}
