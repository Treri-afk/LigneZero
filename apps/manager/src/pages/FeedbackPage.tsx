import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Feedback, Match, Player } from '@lignezero/types';
import { db } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import { Badge, Button, Modal, Panel, Spinner } from '@/components/ui';
import { formatTimestamp } from '@/lib/video';

export function FeedbackPage() {
  const { isPerf, playerId } = useAuth();
  const [items, setItems] = useState<Feedback[] | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const [fs, ps, ms] = await Promise.all([db.listFeedback(), db.listPlayers(), db.listMatches()]);
      setItems(fs);
      setPlayers(ps);
      setMatches(ms);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  }
  useEffect(() => {
    refresh();
  }, []);

  const pName = (id: string) => players.find((p) => p.id === id)?.pseudo ?? id;

  if (!items) return <Spinner label="Chargement…" />;

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <p className="hud-label text-[11px]">FDBK // Feedback</p>
          <h1 className="font-display text-3xl font-bold uppercase tracking-hud">Feedback</h1>
        </div>
        {isPerf && <Button onClick={() => setCreating(true)}>+ Nouveau feedback</Button>}
      </header>

      {error && <p className="mb-4 border border-[color:var(--accent)] px-3 py-2 font-mono text-xs text-accent">{error}</p>}

      {items.length === 0 ? (
        <Panel><p className="font-mono text-sm text-[color:var(--text-mute)]">Aucun feedback.</p></Panel>
      ) : (
        <div className="space-y-3">
          {items.map((f) => (
            <FeedbackCard key={f.id} f={f} who={pName(f.playerId)} mine={f.playerId === playerId} isPerf={isPerf} onChange={refresh} />
          ))}
        </div>
      )}

      {creating && (
        <FeedbackForm players={players} matches={matches} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); refresh(); }} />
      )}
    </div>
  );
}

function FeedbackCard({ f, who, mine, isPerf, onChange }: { f: Feedback; who: string; mine: boolean; isPerf: boolean; onChange: () => void }) {
  const [reply, setReply] = useState(f.reply ?? '');
  const [busy, setBusy] = useState(false);

  async function ack() {
    setBusy(true);
    await db.ackFeedback(f.id, reply || undefined);
    setBusy(false);
    onChange();
  }
  async function remove() {
    if (!confirm('Supprimer ce feedback ?')) return;
    await db.removeFeedback(f.id);
    onChange();
  }

  return (
    <div className="panel p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-mono text-xs uppercase tracking-hud text-[color:var(--text-dim)]">Pour {who}</span>
        <div className="flex items-center gap-3">
          {f.acknowledged ? <Badge tone="ok">lu</Badge> : <Badge tone="live">non lu</Badge>}
          {isPerf && <button onClick={remove} className="font-mono text-xs text-[color:var(--text-mute)] hover:text-accent">suppr.</button>}
        </div>
      </div>
      <p className="font-mono text-sm text-[color:var(--text)]">{f.body}</p>

      {/* Feedback issu d'un checkpoint de revue vidéo → lien vers l'instant précis. */}
      {f.reviewId != null && (
        <Link
          to={`/review?open=${f.reviewId}${f.timestampSec != null ? `&t=${f.timestampSec}` : ''}`}
          className="mt-2 inline-flex items-center gap-2 border border-line-strong px-2.5 py-1 font-mono text-[11px] uppercase tracking-hud text-accent transition-colors hover:border-accent"
        >
          ▶ Voir le checkpoint{f.timestampSec != null ? ` · ${formatTimestamp(f.timestampSec)}` : ''}
        </Link>
      )}

      {f.reply && <p className="mt-2 border-l-2 border-line-strong pl-3 font-mono text-xs text-[color:var(--text-dim)]">↳ {f.reply}</p>}

      {/* le joueur concerné peut répondre / accuser réception */}
      {mine && !f.acknowledged && (
        <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
          <textarea className="field h-16" placeholder="Réponse (optionnelle)…" value={reply} onChange={(e) => setReply(e.target.value)} />
          <div className="flex justify-end">
            <Button onClick={ack} disabled={busy}>{busy ? '…' : 'Accuser réception'}</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function FeedbackForm({ players, matches, onClose, onSaved }: { players: Player[]; matches: Match[]; onClose: () => void; onSaved: () => void }) {
  const [playerId, setPlayerId] = useState('');
  const [matchId, setMatchId] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!playerId || !body.trim()) { setError('Joueur et message requis.'); return; }
    setBusy(true);
    try {
      await db.upsertFeedback({ playerId, matchId: matchId || undefined, body });
      // Notifie le joueur en DM Discord (livré par le bot ; best-effort).
      await db.notifyPlayer(playerId, 'feedback', 'Nouveau feedback', body.slice(0, 300));
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Nouveau feedback">
      <div className="space-y-4">
        <div>
          <label className="label">Joueur</label>
          <select className="field" value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
            <option value="">— choisir —</option>
            {players.map((p) => <option key={p.id} value={p.id}>{p.pseudo}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Match lié (optionnel)</label>
          <select className="field" value={matchId} onChange={(e) => setMatchId(e.target.value)}>
            <option value="">—</option>
            {matches.map((m) => <option key={m.id} value={m.id}>{new Date(m.dateISO).toLocaleDateString('fr-FR')} vs {m.opponent.name}</option>)}
          </select>
        </div>
        <div><label className="label">Message</label><textarea className="field h-32" value={body} onChange={(e) => setBody(e.target.value)} /></div>
      </div>
      {error && <p className="mt-4 border border-[color:var(--accent)] px-3 py-2 font-mono text-xs text-accent">{error}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Annuler</Button>
        <Button onClick={save} disabled={busy}>{busy ? '…' : 'Envoyer'}</Button>
      </div>
    </Modal>
  );
}
