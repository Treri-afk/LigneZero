import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '@/lib/supabase';
import { Button, Spinner } from '@/components/ui';

interface CandidatePublic {
  candidateId: string;
  pseudo: string;
  campaignTitle: string;
  roleSought?: string;
  opensAt?: string;
  closesAt?: string;
  status: string;
}

interface SlotDraft {
  day: string;
  startTime: string;
  endTime: string;
}

const emptySlot = (): SlotDraft => ({ day: '', startTime: '18:00', endTime: '20:00' });

/**
 * Page publique, sans authentification — lien envoyé au candidat en tryout
 * pour qu'il déclare lui-même ses disponibilités. Passe uniquement par les
 * RPC `get_candidate_public` / `get_candidate_availability` / `set_candidate_availability`
 * (SECURITY DEFINER, portées au jeton) : aucun accès table direct n'est
 * exposé à `anon`.
 */
export function PublicTryoutFormPage() {
  const { token } = useParams<{ token: string }>();
  const [candidate, setCandidate] = useState<CandidatePublic | null | undefined>(undefined);
  const [slots, setSlots] = useState<SlotDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const c = await db.getCandidateByToken(token);
        setCandidate(c);
        if (c) {
          const existing = await db.getCandidateAvailabilityByToken(token);
          setSlots(existing.length > 0 ? existing.map((s) => ({ ...s })) : [emptySlot()]);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur');
        setCandidate(null);
      }
    })();
  }, [token]);

  function updateSlot(i: number, patch: Partial<SlotDraft>) {
    setSlots((list) => list.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function removeSlot(i: number) {
    setSlots((list) => list.filter((_, idx) => idx !== i));
  }

  async function save() {
    if (!token) return;
    const valid = slots.filter((s) => s.day && s.startTime && s.endTime && s.startTime < s.endTime);
    if (valid.length === 0) {
      setError('Ajoute au moins un créneau valide (heure de fin après heure de début).');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await db.setCandidateAvailabilityByToken(token, valid);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
      <div className="panel w-full max-w-lg p-6">
        {candidate === undefined ? (
          <Spinner label="Chargement…" />
        ) : candidate === null ? (
          <div>
            <p className="font-display text-xl font-bold uppercase tracking-hud text-accent">Lien invalide</p>
            <p className="mt-2 font-mono text-sm text-[color:var(--text-dim)]">
              Ce lien de tryout n'existe pas ou n'est plus valide. Recontacte le staff pour en obtenir un nouveau.
            </p>
          </div>
        ) : (
          <>
            <p className="hud-label text-[11px]">TRYOUT // {candidate.campaignTitle}</p>
            <h1 className="font-display text-2xl font-bold uppercase tracking-hud">Salut {candidate.pseudo} 👋</h1>
            <p className="mt-2 font-mono text-sm text-[color:var(--text-dim)]">
              {candidate.roleSought ? `Poste visé : ${candidate.roleSought}. ` : ''}
              Indique tes créneaux de disponibilité pour qu'on puisse organiser une session d'évaluation en groupe.
            </p>

            {saved ? (
              <p className="mt-6 border border-[color:var(--signal-ok)] px-3 py-3 font-mono text-sm text-[color:var(--signal-ok)]">
                Dispos enregistrées, merci ! Tu peux revenir sur ce lien pour les modifier à tout moment.
              </p>
            ) : (
              <>
                <div className="mt-6 space-y-3">
                  {slots.map((s, i) => (
                    <div key={i} className="flex flex-wrap items-center gap-2">
                      <input
                        type="date"
                        className="field"
                        value={s.day}
                        min={candidate.opensAt}
                        max={candidate.closesAt}
                        onChange={(e) => updateSlot(i, { day: e.target.value })}
                      />
                      <input type="time" className="field w-28" value={s.startTime} onChange={(e) => updateSlot(i, { startTime: e.target.value })} />
                      <span className="font-mono text-xs text-[color:var(--text-mute)]">à</span>
                      <input type="time" className="field w-28" value={s.endTime} onChange={(e) => updateSlot(i, { endTime: e.target.value })} />
                      <button onClick={() => removeSlot(i)} className="font-mono text-xs text-[color:var(--text-mute)] hover:text-accent">
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setSlots((list) => [...list, emptySlot()])}
                  className="mt-3 font-mono text-xs text-[color:var(--text-dim)] hover:text-accent"
                >
                  + ajouter un créneau
                </button>

                {error && <p className="mt-4 border border-[color:var(--accent)] px-3 py-2 font-mono text-xs text-accent">{error}</p>}

                <div className="mt-6 flex justify-end">
                  <Button onClick={save} disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer mes dispos'}</Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
