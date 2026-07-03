import { useEffect, useMemo, useState } from 'react';
import type { Candidate, Player, TryoutCampaign } from '@lignezero/types';
import { db } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import { Badge, Button, Modal, Panel, Spinner } from '@/components/ui';
import { uid } from '@/lib/id';
import { findOverlapWindows, type OverlapWindow } from '@/lib/tryoutOverlap';

const todayISO = () => new Date().toISOString().slice(0, 10);

export function TryoutAvailabilityPage() {
  const { isPerf } = useAuth();
  const [campaigns, setCampaigns] = useState<TryoutCampaign[]>([]);
  const [campaignId, setCampaignId] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [windows, setWindows] = useState<OverlapWindow[] | null>(null);
  const [minCount, setMinCount] = useState(5);
  const [creating, setCreating] = useState<OverlapWindow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    db.listTryoutCampaigns().then((cs) => {
      setCampaigns(cs);
      if (cs.length > 0) setCampaignId(cs.find((c) => c.status === 'ouverte')?.id ?? cs[0].id);
    });
  }, []);

  async function refresh(cid: string, min: number) {
    setError(null);
    setWindows(null);
    try {
      const [cands, ps, playerAvail] = await Promise.all([db.listCandidates(cid), db.listPlayers(), db.listAvailability()]);
      setCandidates(cands);
      setPlayers(ps);
      const candAvail = await db.listCandidateAvailability(cands.map((c) => c.id));
      const all = findOverlapWindows(playerAvail, candAvail, min).filter((w) => w.day >= todayISO());
      setWindows(all);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  }
  useEffect(() => {
    if (campaignId) refresh(campaignId, minCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, minCount]);

  const pseudo = (kind: 'player' | 'candidate', id: string) =>
    kind === 'player' ? players.find((p) => p.id === id)?.pseudo ?? id : candidates.find((c) => c.id === id)?.pseudo ?? id;

  const grouped = useMemo(() => {
    const byDay = new Map<string, OverlapWindow[]>();
    for (const w of windows ?? []) {
      if (!byDay.has(w.day)) byDay.set(w.day, []);
      byDay.get(w.day)!.push(w);
    }
    return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [windows]);

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="hud-label text-[11px]">OVLP // Créneaux tryout</p>
          <h1 className="font-display text-3xl font-bold uppercase tracking-hud">Créneaux de tryout</h1>
          <p className="mt-1 max-w-xl font-mono text-xs text-[color:var(--text-dim)]">
            &gt; Fenêtres où au moins {minCount} personnes (candidats + joueurs de l'effectif confondus) sont dispo en même temps.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="field" value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 font-mono text-xs text-[color:var(--text-dim)]">
            seuil
            <input
              type="number"
              min={2}
              max={10}
              className="field w-16"
              value={minCount}
              onChange={(e) => setMinCount(Math.max(2, Number(e.target.value) || 5))}
            />
          </label>
        </div>
      </header>

      {error && <p className="mb-4 border border-[color:var(--accent)] px-3 py-2 font-mono text-xs text-accent">{error}</p>}

      {!campaignId ? (
        <Panel><p className="font-mono text-sm text-[color:var(--text-dim)]">Aucune campagne sélectionnée.</p></Panel>
      ) : !windows ? (
        <Spinner label="Calcul des chevauchements…" />
      ) : grouped.length === 0 ? (
        <Panel>
          <p className="font-mono text-sm text-[color:var(--text-dim)]">
            Aucun créneau avec {minCount}+ personnes dispo pour l'instant. Le seuil baisse si tu ajustes le champ « seuil » ci-dessus.
          </p>
        </Panel>
      ) : (
        <div className="space-y-4">
          {grouped.map(([day, ws]) => (
            <Panel key={day} title={new Date(day).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })}>
              <div className="space-y-3">
                {ws.map((w, i) => (
                  <div key={i} className="flex items-center justify-between border border-line px-3 py-2">
                    <div>
                      <p className="font-mono text-sm text-[color:var(--text)]">{w.startTime} – {w.endTime}</p>
                      <p className="mt-1 flex flex-wrap gap-1">
                        {w.candidateIds.map((id) => <Badge key={id} tone="warn">{pseudo('candidate', id)}</Badge>)}
                        {w.playerIds.map((id) => <Badge key={id} tone="ok">{pseudo('player', id)}</Badge>)}
                      </p>
                    </div>
                    {isPerf && <Button onClick={() => setCreating(w)}>Programmer une pracc</Button>}
                  </div>
                ))}
              </div>
            </Panel>
          ))}
        </div>
      )}

      {creating && (
        <CreatePraccModal
          window={creating}
          campaignId={campaignId}
          players={players}
          candidates={candidates}
          onClose={() => setCreating(null)}
          onCreated={() => {
            setCreating(null);
            refresh(campaignId, minCount);
          }}
        />
      )}
    </div>
  );
}

function timeDiffMin(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

function CreatePraccModal({
  window: w,
  campaignId,
  players,
  candidates,
  onClose,
  onCreated,
}: {
  window: OverlapWindow;
  campaignId: string;
  players: Player[];
  candidates: Candidate[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('Pracc tryout');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(w.playerIds);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>(w.candidateIds);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (list: string[], setList: (v: string[]) => void, id: string) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  async function create() {
    if (selectedCandidates.length === 0) {
      setError('Sélectionne au moins un candidat.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const sessionId = uid();
      await db.upsertSession({
        id: sessionId,
        kind: 'tryout',
        title: title.trim() || 'Pracc tryout',
        startsAt: new Date(`${w.day}T${w.startTime}:00`).toISOString(),
        durationMin: timeDiffMin(w.startTime, w.endTime),
        campaignId,
      });
      await Promise.all([
        ...selectedCandidates.map((id) => db.setSessionCandidate({ sessionId, candidateId: id, status: 'invite' })),
        ...selectedPlayers.map((id) => db.setRsvp({ sessionId, playerId: id, status: 'yes' })),
      ]);
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Programmer une pracc · ${w.day} ${w.startTime}–${w.endTime}`}>
      <div className="space-y-4">
        <div>
          <span className="label">Titre</span>
          <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <p className="label">Candidats invités</p>
          <div className="flex flex-wrap gap-2">
            {w.candidateIds.map((id) => {
              const c = candidates.find((x) => x.id === id);
              const on = selectedCandidates.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggle(selectedCandidates, setSelectedCandidates, id)}
                  className="border px-3 py-1.5 font-mono text-[11px] uppercase tracking-hud"
                  style={on ? { borderColor: 'var(--signal-warn)', background: 'var(--signal-warn)', color: '#0d0d0b' } : { borderColor: 'var(--line-strong)', color: 'var(--text-dim)' }}
                >
                  {c?.pseudo ?? id}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="label">Joueurs de l'effectif présents</p>
          <div className="flex flex-wrap gap-2">
            {w.playerIds.map((id) => {
              const p = players.find((x) => x.id === id);
              const on = selectedPlayers.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggle(selectedPlayers, setSelectedPlayers, id)}
                  className="border px-3 py-1.5 font-mono text-[11px] uppercase tracking-hud"
                  style={on ? { borderColor: 'var(--signal-ok)', background: 'var(--signal-ok)', color: '#0d0d0b' } : { borderColor: 'var(--line-strong)', color: 'var(--text-dim)' }}
                >
                  {p?.pseudo ?? id}
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="border border-[color:var(--accent)] px-3 py-2 font-mono text-xs text-accent">{error}</p>}

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button onClick={create} disabled={busy}>{busy ? 'Création…' : 'Créer la pracc'}</Button>
        </div>
      </div>
    </Modal>
  );
}
