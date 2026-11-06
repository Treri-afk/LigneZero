import { useEffect, useState } from 'react';
import type { Game, RsvpStatus, Session, SessionKind, SessionRsvp } from '@lignezero/types';
import { db } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import { Badge, Button, Modal, Panel, Spinner } from '@/components/ui';
import { SESSION_KINDS as KINDS } from '@/lib/calendar';
const RSVPS: { id: RsvpStatus; label: string; tone: string }[] = [
  { id: 'yes', label: 'Présent', tone: 'var(--signal-ok)' },
  { id: 'maybe', label: 'Peut-être', tone: 'var(--signal-warn)' },
  { id: 'no', label: 'Absent', tone: 'var(--accent)' },
];

export function SessionsPage() {
  const { isPerf, playerId } = useAuth();
  const [items, setItems] = useState<Session[] | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [rsvp, setRsvp] = useState<SessionRsvp[]>([]);
  const [editing, setEditing] = useState<Partial<Session> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const [ss, gs, rs] = await Promise.all([db.listSessions(), db.listGames(), db.listRsvp()]);
      setItems(ss);
      setGames(gs);
      setRsvp(rs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  }
  useEffect(() => {
    refresh();
  }, []);

  const gName = (id?: string) => games.find((g) => g.id === id)?.tag;
  const myStatus = (sid: string) => rsvp.find((r) => r.sessionId === sid && r.playerId === playerId)?.status;
  const counts = (sid: string) => {
    const r = rsvp.filter((x) => x.sessionId === sid);
    return { yes: r.filter((x) => x.status === 'yes').length, maybe: r.filter((x) => x.status === 'maybe').length, no: r.filter((x) => x.status === 'no').length };
  };

  async function setMyRsvp(sid: string, status: RsvpStatus) {
    if (!playerId) return;
    await db.setRsvp({ sessionId: sid, playerId, status });
    refresh();
  }
  async function remove(s: Session) {
    if (!confirm(`Supprimer « ${s.title} » ?`)) return;
    await db.removeSession(s.id);
    refresh();
  }

  if (!items) return <Spinner label="Chargement…" />;

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <p className="hud-label text-[11px]">SESS // Sessions &amp; scrims</p>
          <h1 className="font-display text-3xl font-bold uppercase tracking-hud">Sessions &amp; scrims</h1>
        </div>
        {isPerf && <Button onClick={() => setEditing({ kind: 'practice', startsAt: new Date().toISOString().slice(0, 16) })}>+ Nouvelle session</Button>}
      </header>

      {error && <p className="mb-4 border border-[color:var(--accent)] px-3 py-2 font-mono text-xs text-accent">{error}</p>}

      {items.length === 0 ? (
        <Panel><p className="font-mono text-sm text-[color:var(--text-mute)]">Aucune session planifiée.</p></Panel>
      ) : (
        <div className="space-y-3">
          {items.map((s) => {
            const c = counts(s.id);
            const mine = myStatus(s.id);
            return (
              <div key={s.id} className="panel p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge>{KINDS.find((k) => k.id === s.kind)?.label ?? s.kind}</Badge>
                      {gName(s.gameId) && <Badge tone="mute">{gName(s.gameId)}</Badge>}
                    </div>
                    <p className="mt-1.5 font-display text-lg font-bold uppercase">{s.title}</p>
                    <p className="font-mono text-xs text-[color:var(--text-dim)]">
                      {new Date(s.startsAt).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                      {s.durationMin ? ` · ${s.durationMin} min` : ''}{s.location ? ` · ${s.location}` : ''}
                    </p>
                    {s.notes && <p className="mt-1 font-mono text-xs text-[color:var(--text-mute)]">{s.notes}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)]">
                      <span className="text-[color:var(--signal-ok)]">{c.yes}✓</span> · <span className="text-[color:var(--signal-warn)]">{c.maybe}?</span> · <span className="text-accent">{c.no}✕</span>
                    </p>
                    {isPerf && <button onClick={() => remove(s)} className="mt-2 font-mono text-xs text-[color:var(--text-mute)] hover:text-accent">suppr.</button>}
                  </div>
                </div>

                {/* RSVP du joueur */}
                {playerId && (
                  <div className="mt-3 flex gap-2 border-t border-line pt-3">
                    {RSVPS.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setMyRsvp(s.id, r.id)}
                        className="border px-3 py-1.5 font-mono text-[11px] uppercase tracking-hud transition-colors"
                        style={mine === r.id ? { borderColor: r.tone, background: r.tone, color: '#0d0d0b' } : { borderColor: 'var(--line-strong)', color: 'var(--text-dim)' }}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <SessionForm draft={editing} games={games} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />
      )}
    </div>
  );
}

export function SessionForm({ draft, games, onClose, onSaved }: { draft: Partial<Session>; games: Game[]; onClose: () => void; onSaved: () => void }) {
  const [s, setS] = useState<Partial<Session>>(draft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Session>(k: K, v: Session[K]) => setS((x) => ({ ...x, [k]: v }));

  async function save() {
    if (!s.title?.trim() || !s.startsAt) { setError('Titre et date requis.'); return; }
    setBusy(true);
    try {
      await db.upsertSession({ ...s, startsAt: new Date(s.startsAt).toISOString() });
      if (!s.id) {
        const players = await db.listPlayers();
        const when = new Date(s.startsAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
        await Promise.all(players.map((p) => db.notifyPlayer(p.id, 'session', 'Nouvelle session', `${s.title} — ${when}`)));
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={s.id ? 'Éditer session' : 'Nouvelle session'}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Type</label>
          <select className="field" value={s.kind ?? 'practice'} onChange={(e) => set('kind', e.target.value as SessionKind)}>
            {KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Jeu</label>
          <select className="field" value={s.gameId ?? ''} onChange={(e) => set('gameId', e.target.value)}>
            <option value="">—</option>
            {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="col-span-2"><label className="label">Titre</label><input className="field" value={s.title ?? ''} onChange={(e) => set('title', e.target.value)} /></div>
        <div><label className="label">Date &amp; heure</label><input type="datetime-local" className="field" value={(s.startsAt ?? '').slice(0, 16)} onChange={(e) => set('startsAt', e.target.value)} /></div>
        <div><label className="label">Durée (min)</label><input type="number" className="field" value={s.durationMin ?? ''} onChange={(e) => set('durationMin', e.target.value ? Number(e.target.value) : undefined)} /></div>
        <div className="col-span-2"><label className="label">Lieu / lien</label><input className="field" value={s.location ?? ''} onChange={(e) => set('location', e.target.value)} /></div>
        <div className="col-span-2"><label className="label">Notes</label><textarea className="field h-20" value={s.notes ?? ''} onChange={(e) => set('notes', e.target.value)} /></div>
      </div>
      {error && <p className="mt-4 border border-[color:var(--accent)] px-3 py-2 font-mono text-xs text-accent">{error}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button onClick={save} disabled={busy}>{busy ? '…' : 'Enregistrer'}</Button>
      </div>
    </Modal>
  );
}
