import { useEffect, useState } from 'react';
import type { Objective, ObjectiveScope, ObjectiveStatus, Player } from '@lignezero/types';
import { db } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import { Badge, Button, Modal, Panel, Spinner } from '@/components/ui';

const STATUS: ObjectiveStatus[] = ['todo', 'doing', 'done'];
const tone = (s: ObjectiveStatus): 'ok' | 'warn' | 'mute' => (s === 'done' ? 'ok' : s === 'doing' ? 'warn' : 'mute');

export function ObjectivesPage() {
  const { isPerf } = useAuth();
  const [items, setItems] = useState<Objective[] | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [editing, setEditing] = useState<Partial<Objective> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const [os, ps] = await Promise.all([db.listObjectives(), db.listPlayers()]);
      setItems(os);
      setPlayers(ps);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  }
  useEffect(() => {
    refresh();
  }, []);

  const pName = (id?: string) => players.find((p) => p.id === id)?.pseudo ?? '—';

  async function cycle(o: Objective) {
    if (!isPerf) return;
    const next = STATUS[(STATUS.indexOf(o.status) + 1) % STATUS.length];
    await db.setObjectiveStatus(o.id, next);
    refresh();
  }
  async function remove(o: Objective) {
    if (!confirm(`Supprimer « ${o.title} » ?`)) return;
    await db.removeObjective(o.id);
    refresh();
  }

  if (!items) return <Spinner label="Chargement…" />;

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <p className="hud-label text-[11px]">OBJ // Objectifs</p>
          <h1 className="font-display text-3xl font-bold uppercase tracking-hud">Objectifs</h1>
        </div>
        {isPerf && <Button onClick={() => setEditing({ scope: 'team', status: 'todo' })}>+ Nouvel objectif</Button>}
      </header>

      {error && <p className="mb-4 border border-[color:var(--accent)] px-3 py-2 font-mono text-xs text-accent">{error}</p>}

      {items.length === 0 ? (
        <Panel><p className="font-mono text-sm text-[color:var(--text-mute)]">Aucun objectif.</p></Panel>
      ) : (
        <div className="space-y-3">
          {items.map((o) => (
            <div key={o.id} className="panel flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="font-display text-lg font-bold uppercase">
                  {o.scope === 'team' ? <span className="text-accent">[ÉQUIPE] </span> : <span className="text-[color:var(--text-dim)]">[{pName(o.playerId)}] </span>}
                  {o.title}
                </p>
                {o.detail && <p className="font-mono text-xs text-[color:var(--text-dim)]">{o.detail}</p>}
                {o.week && <p className="font-mono text-[10px] text-[color:var(--text-mute)]">semaine du {o.week}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <button onClick={() => cycle(o)} disabled={!isPerf} className={isPerf ? 'cursor-pointer' : 'cursor-default'} title={isPerf ? 'Changer le statut' : ''}>
                  <Badge tone={tone(o.status)}>{o.status}</Badge>
                </button>
                {isPerf && (
                  <>
                    <button onClick={() => setEditing(o)} className="font-mono text-xs text-[color:var(--text-dim)] hover:text-accent">éditer</button>
                    <button onClick={() => remove(o)} className="font-mono text-xs text-[color:var(--text-mute)] hover:text-accent">suppr.</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ObjectiveForm
          draft={editing}
          players={players}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
        />
      )}
    </div>
  );
}

function ObjectiveForm({ draft, players, onClose, onSaved }: { draft: Partial<Objective>; players: Player[]; onClose: () => void; onSaved: () => void }) {
  const [o, setO] = useState<Partial<Objective>>(draft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Objective>(k: K, v: Objective[K]) => setO((x) => ({ ...x, [k]: v }));

  async function save() {
    if (!o.title?.trim()) { setError('Titre requis.'); return; }
    if (o.scope === 'player' && !o.playerId) { setError('Choisis un joueur.'); return; }
    setBusy(true);
    try {
      await db.upsertObjective(o);
      if (!o.id && o.scope === 'player' && o.playerId) {
        await db.notifyPlayer(o.playerId, 'objective', 'Nouvel objectif', o.title!.slice(0, 300));
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={o.id ? 'Éditer objectif' : 'Nouvel objectif'}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Portée</label>
          <select className="field" value={o.scope ?? 'team'} onChange={(e) => set('scope', e.target.value as ObjectiveScope)}>
            <option value="team">Équipe</option>
            <option value="player">Joueur</option>
          </select>
        </div>
        <div>
          <label className="label">Joueur (si portée joueur)</label>
          <select className="field" value={o.playerId ?? ''} onChange={(e) => set('playerId', e.target.value)} disabled={o.scope !== 'player'}>
            <option value="">—</option>
            {players.map((p) => <option key={p.id} value={p.id}>{p.pseudo}</option>)}
          </select>
        </div>
        <div><label className="label">Semaine (date)</label><input type="date" className="field" value={o.week ?? ''} onChange={(e) => set('week', e.target.value)} /></div>
        <div>
          <label className="label">Statut</label>
          <select className="field" value={o.status ?? 'todo'} onChange={(e) => set('status', e.target.value as ObjectiveStatus)}>
            {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-span-2"><label className="label">Titre</label><input className="field" value={o.title ?? ''} onChange={(e) => set('title', e.target.value)} /></div>
        <div className="col-span-2"><label className="label">Détail</label><textarea className="field h-24" value={o.detail ?? ''} onChange={(e) => set('detail', e.target.value)} /></div>
      </div>
      {error && <p className="mt-4 border border-[color:var(--accent)] px-3 py-2 font-mono text-xs text-accent">{error}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button onClick={save} disabled={busy}>{busy ? '…' : 'Enregistrer'}</Button>
      </div>
    </Modal>
  );
}
