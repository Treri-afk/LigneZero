import { useEffect, useState } from 'react';
import type {
  Candidate,
  CandidateAvailability,
  CandidateEvaluation,
  CandidateRecommendation,
  CandidateStatus,
  Profile,
  TryoutCampaign,
} from '@lignezero/types';
import { db } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import { Badge, Button, Modal, Panel, Spinner } from '@/components/ui';
import { uid } from '@/lib/id';

const STATUS_LABEL: Record<CandidateStatus, string> = {
  nouveau: 'Nouveau',
  en_evaluation: 'En évaluation',
  liste_attente: "Liste d'attente",
  accepte: 'Accepté',
  refuse: 'Refusé',
};
const STATUS_TONE: Record<CandidateStatus, 'ok' | 'warn' | 'mute' | 'live'> = {
  nouveau: 'mute',
  en_evaluation: 'warn',
  liste_attente: 'warn',
  accepte: 'ok',
  refuse: 'live',
};
const RECO_LABEL: Record<CandidateRecommendation, string> = { oui: 'Oui', non: 'Non', mitige: 'Mitigé' };

const EMPTY_CANDIDATE = (campaignId: string): Candidate => ({
  id: uid(),
  campaignId,
  pseudo: '',
  status: 'nouveau',
  publicToken: '',
  createdAt: '',
});

export function CandidatesPage() {
  const { isPerf, isEvaluator, profile } = useAuth();
  const [campaigns, setCampaigns] = useState<TryoutCampaign[]>([]);
  const [campaignId, setCampaignId] = useState<string>('');
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | 'tous'>('tous');
  const [editing, setEditing] = useState<Candidate | null>(null);
  const [detail, setDetail] = useState<Candidate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function refreshCampaigns() {
    const cs = await db.listTryoutCampaigns();
    setCampaigns(cs);
    if (!campaignId && cs.length > 0) {
      setCampaignId(cs.find((c) => c.status === 'ouverte')?.id ?? cs[0].id);
    }
  }
  async function refreshCandidates(cid: string) {
    setError(null);
    try {
      setCandidates(await db.listCandidates(cid));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  }

  useEffect(() => {
    refreshCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (campaignId) refreshCandidates(campaignId);
  }, [campaignId]);

  async function remove(c: Candidate) {
    if (!confirm(`Supprimer ${c.pseudo} ?`)) return;
    try {
      await db.removeCandidate(c.id);
      refreshCandidates(campaignId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  }

  async function changeStatus(c: Candidate, status: CandidateStatus) {
    try {
      const campaign = campaigns.find((x) => x.id === c.campaignId);
      const result = await db.setCandidateStatus(c, status, { decidedBy: profile?.id, gameId: campaign?.gameId });
      if (result.warning) alert(result.warning);
      else if (result.playerId) {
        alert(`Fiche joueur créée automatiquement : ${result.playerId}. Lie le futur compte du joueur depuis « Comptes & rôles » quand il s'inscrit.`);
      }
      refreshCandidates(campaignId);
      setDetail((d) => (d?.id === c.id ? { ...d, status, convertedPlayerId: result.playerId ?? d.convertedPlayerId } : d));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  }

  function copyLink(c: Candidate) {
    const url = `${window.location.origin}/tryout/${c.publicToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(c.id);
      setTimeout(() => setCopiedId((id) => (id === c.id ? null : id)), 2000);
    });
  }

  const filtered = (candidates ?? []).filter((c) => statusFilter === 'tous' || c.status === statusFilter);

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="hud-label text-[11px]">CDT // Candidats tryout</p>
          <h1 className="font-display text-3xl font-bold uppercase tracking-hud">Candidats</h1>
        </div>
        <div className="flex items-center gap-2">
          <select className="field" value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
            {campaigns.length === 0 && <option value="">— aucune campagne —</option>}
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.status})
              </option>
            ))}
          </select>
          {isPerf && campaignId && (
            <Button onClick={() => setEditing(EMPTY_CANDIDATE(campaignId))}>+ Candidat</Button>
          )}
        </div>
      </header>

      {campaigns.length === 0 && (
        <Panel>
          <p className="font-mono text-sm text-[color:var(--text-dim)]">
            Aucune campagne de recrutement. {isPerf ? "Crée-en une dans « Campagnes tryout »." : 'Demande à un admin/manager/coach d\'en créer une.'}
          </p>
        </Panel>
      )}

      {error && <p className="mb-4 border border-[color:var(--accent)] px-3 py-2 font-mono text-xs text-accent">{error}</p>}

      {campaignId && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {(['tous', 'nouveau', 'en_evaluation', 'liste_attente', 'accepte', 'refuse'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="border px-3 py-1.5 font-mono text-[11px] uppercase tracking-hud transition-colors"
                style={
                  statusFilter === s
                    ? { borderColor: 'var(--accent)', background: 'var(--accent)', color: '#0d0d0b' }
                    : { borderColor: 'var(--line-strong)', color: 'var(--text-dim)' }
                }
              >
                {s === 'tous' ? 'Tous' : STATUS_LABEL[s]}
              </button>
            ))}
          </div>

          {!candidates ? (
            <Spinner label="Chargement des candidats…" />
          ) : filtered.length === 0 ? (
            <Panel>
              <p className="font-mono text-sm text-[color:var(--text-dim)]">Aucun candidat pour ce filtre.</p>
            </Panel>
          ) : (
            <div className="panel overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-line-strong bg-base-700">
                  <tr className="hud-label text-[10px]">
                    <th className="px-4 py-2">Pseudo</th>
                    <th className="px-4 py-2">Poste</th>
                    <th className="px-4 py-2">Rank</th>
                    <th className="px-4 py-2">Statut</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-sm">
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b border-line last:border-0 hover:bg-base-700/50">
                      <td className="px-4 py-2.5 font-semibold text-[color:var(--text)]">{c.pseudo}</td>
                      <td className="px-4 py-2.5 text-[color:var(--text-dim)]">{c.roleApplied ?? '—'}</td>
                      <td className="px-4 py-2.5 text-[color:var(--text-dim)]">{c.rankCurrent ?? '—'}</td>
                      <td className="px-4 py-2.5">
                        <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button onClick={() => setDetail(c)} className="mr-3 text-[color:var(--text-dim)] hover:text-accent">
                          voir / noter
                        </button>
                        <button onClick={() => copyLink(c)} className="mr-3 text-[color:var(--text-dim)] hover:text-accent">
                          {copiedId === c.id ? 'copié !' : 'copier le lien'}
                        </button>
                        {isPerf && (
                          <button onClick={() => remove(c)} className="text-[color:var(--text-mute)] hover:text-accent">
                            suppr.
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {editing && (
        <CandidateForm
          candidate={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refreshCandidates(campaignId);
          }}
        />
      )}

      {detail && (
        <CandidateDetail
          candidate={detail}
          canManage={isPerf}
          canEvaluate={isEvaluator}
          myProfileId={profile?.id}
          onClose={() => setDetail(null)}
          onChangeStatus={(s) => changeStatus(detail, s)}
        />
      )}
    </div>
  );
}

function CandidateForm({ candidate, onClose, onSaved }: { candidate: Candidate; onClose: () => void; onSaved: () => void }) {
  const [c, setC] = useState<Candidate>(candidate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Candidate>(k: K, v: Candidate[K]) => setC((x) => ({ ...x, [k]: v }));

  async function save() {
    if (!c.pseudo.trim()) {
      setError('Le pseudo est requis.');
      return;
    }
    setBusy(true);
    try {
      await db.upsertCandidate(c);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Nouveau candidat">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <span className="label">Pseudo</span>
          <input className="field" value={c.pseudo} onChange={(e) => set('pseudo', e.target.value)} />
        </div>
        <div>
          <span className="label">Prénom</span>
          <input className="field" value={c.firstName ?? ''} onChange={(e) => set('firstName', e.target.value)} />
        </div>
        <div>
          <span className="label">Nom</span>
          <input className="field" value={c.lastName ?? ''} onChange={(e) => set('lastName', e.target.value)} />
        </div>
        <div>
          <span className="label">Discord</span>
          <input className="field" value={c.discord ?? ''} onChange={(e) => set('discord', e.target.value)} placeholder="pseudo#0000" />
        </div>
        <div>
          <span className="label">Email</span>
          <input className="field" type="email" value={c.email ?? ''} onChange={(e) => set('email', e.target.value)} />
        </div>
        <div>
          <span className="label">Poste visé</span>
          <input className="field" value={c.roleApplied ?? ''} onChange={(e) => set('roleApplied', e.target.value)} placeholder="Duelist" />
        </div>
        <div>
          <span className="label">Rank actuel</span>
          <input className="field" value={c.rankCurrent ?? ''} onChange={(e) => set('rankCurrent', e.target.value)} placeholder="Immortal 2" />
        </div>
        <div className="col-span-2">
          <span className="label">Notes internes</span>
          <textarea className="field h-20" value={c.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
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

function CandidateDetail({
  candidate,
  canManage,
  canEvaluate,
  myProfileId,
  onClose,
  onChangeStatus,
}: {
  candidate: Candidate;
  canManage: boolean;
  canEvaluate: boolean;
  myProfileId?: string;
  onClose: () => void;
  onChangeStatus: (s: CandidateStatus) => void;
}) {
  const [evaluations, setEvaluations] = useState<CandidateEvaluation[] | null>(null);
  const [availability, setAvailability] = useState<CandidateAvailability[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const [ev, av, pr] = await Promise.all([
        db.listCandidateEvaluations(candidate.id),
        db.listCandidateAvailability([candidate.id]),
        db.listProfiles(),
      ]);
      setEvaluations(ev);
      setAvailability(av);
      setProfiles(pr);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  }
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate.id]);

  const authorName = (id: string) => profiles.find((p) => p.id === id)?.displayName || id.slice(0, 8);
  const myEvaluation = evaluations?.find((e) => e.authorId === myProfileId) ?? null;
  const avgRating = evaluations && evaluations.length > 0
    ? (evaluations.reduce((s, e) => s + e.rating, 0) / evaluations.length).toFixed(1)
    : null;

  return (
    <Modal open onClose={onClose} title={`Candidat · ${candidate.pseudo}`}>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs text-[color:var(--text-dim)]">
          <p>Poste : <span className="text-[color:var(--text)]">{candidate.roleApplied ?? '—'}</span></p>
          <p>Rank : <span className="text-[color:var(--text)]">{candidate.rankCurrent ?? '—'}</span></p>
          <p>Discord : <span className="text-[color:var(--text)]">{candidate.discord ?? '—'}</span></p>
          <p>Email : <span className="text-[color:var(--text)]">{candidate.email ?? '—'}</span></p>
          {candidate.notes && <p className="col-span-2">Notes : <span className="text-[color:var(--text)]">{candidate.notes}</span></p>}
        </div>

        {candidate.convertedPlayerId && (
          <p className="border-t border-line pt-3 font-mono text-xs text-[color:var(--signal-ok)]">
            ✓ Converti en fiche joueur : {candidate.convertedPlayerId}
          </p>
        )}

        {canManage && (
          <div className="flex items-center gap-2 border-t border-line pt-3">
            <span className="label mb-0">Statut</span>
            <select
              className="field w-48"
              value={candidate.status}
              onChange={(e) => onChangeStatus(e.target.value as CandidateStatus)}
            >
              {(Object.keys(STATUS_LABEL) as CandidateStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
        )}

        <div className="border-t border-line pt-3">
          <p className="hud-label mb-2 text-[10px]">
            DISPOS DÉCLARÉES {availability.length > 0 && `(${availability.length})`}
          </p>
          {availability.length === 0 ? (
            <p className="font-mono text-xs text-[color:var(--text-mute)]">Aucune dispo saisie pour l'instant.</p>
          ) : (
            <ul className="space-y-1 font-mono text-xs text-[color:var(--text-dim)]">
              {availability.map((a) => (
                <li key={a.id}>
                  {new Date(a.day).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })} · {a.startTime}–{a.endTime}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-line pt-3">
          <p className="hud-label mb-2 text-[10px]">
            AVIS {evaluations && evaluations.length > 0 ? `(${evaluations.length} · moyenne ${avgRating}/5)` : ''}
          </p>
          {!evaluations ? (
            <Spinner label="Chargement des avis…" />
          ) : evaluations.length === 0 ? (
            <p className="font-mono text-xs text-[color:var(--text-mute)]">Aucun avis pour l'instant.</p>
          ) : (
            <div className="space-y-3">
              {evaluations.map((e) => (
                <div key={e.id} className="border border-line px-3 py-2">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-[color:var(--text)]">{authorName(e.authorId)}</span>
                    <span className="flex items-center gap-2">
                      <Badge tone={e.recommendation === 'oui' ? 'ok' : e.recommendation === 'non' ? 'live' : 'warn'}>
                        {RECO_LABEL[e.recommendation]}
                      </Badge>
                      <span className="text-[color:var(--text-dim)]">{'★'.repeat(e.rating)}{'☆'.repeat(5 - e.rating)}</span>
                    </span>
                  </div>
                  {e.body && <p className="mt-1 font-mono text-xs text-[color:var(--text-dim)]">{e.body}</p>}
                </div>
              ))}
            </div>
          )}

          {canEvaluate && myProfileId && (
            <EvaluationForm
              candidateId={candidate.id}
              authorId={myProfileId}
              existing={myEvaluation}
              onSaved={refresh}
            />
          )}
        </div>

        {error && <p className="border border-[color:var(--accent)] px-3 py-2 font-mono text-xs text-accent">{error}</p>}
      </div>
    </Modal>
  );
}

function EvaluationForm({
  candidateId,
  authorId,
  existing,
  onSaved,
}: {
  candidateId: string;
  authorId: string;
  existing: CandidateEvaluation | null;
  onSaved: () => void;
}) {
  const [rating, setRating] = useState(existing?.rating ?? 3);
  const [recommendation, setRecommendation] = useState<CandidateRecommendation>(existing?.recommendation ?? 'mitige');
  const [body, setBody] = useState(existing?.body ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await db.upsertCandidateEvaluation({
        id: existing?.id ?? uid(),
        candidateId,
        authorId,
        rating,
        recommendation,
        body: body.trim(),
      });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 border-t border-line pt-3">
      <p className="label">{existing ? 'Modifier mon avis' : 'Ajouter mon avis'}</p>
      <div className="flex flex-wrap items-center gap-3">
        <select className="field w-28" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{'★'.repeat(n)} ({n}/5)</option>
          ))}
        </select>
        <select className="field w-36" value={recommendation} onChange={(e) => setRecommendation(e.target.value as CandidateRecommendation)}>
          <option value="oui">Recommandé</option>
          <option value="mitige">Mitigé</option>
          <option value="non">Non recommandé</option>
        </select>
      </div>
      <textarea
        className="field mt-2 h-16"
        placeholder="Ton retour sur ce candidat…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      {error && <p className="mt-2 font-mono text-xs text-accent">{error}</p>}
      <div className="mt-2 flex justify-end">
        <Button onClick={save} disabled={busy}>{busy ? '…' : existing ? 'Mettre à jour' : 'Publier mon avis'}</Button>
      </div>
    </div>
  );
}
