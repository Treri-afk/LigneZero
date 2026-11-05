import { useCallback, useEffect, useState } from 'react';
import type { PredictionTally } from '@/types';
import { db, supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';

/**
 * Widget prédiction EN DIRECT (vitrine) : affiche le pari en cours avec les
 * totaux qui se mettent à jour (realtime + polling), et permet à un membre
 * ayant lié son Twitch de miser ses points depuis le site.
 */
export function LivePrediction() {
  const { session } = useAuth();
  const [tally, setTally] = useState<PredictionTally | null>(null);
  const [me, setMe] = useState<{ linked: boolean; points: number } | null>(null);
  const [amount, setAmount] = useState(50);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const pred = await db.getOpenPrediction().catch(() => null);
    if (!pred) { setTally(null); return; }
    setTally(await db.predictionTally(pred.id).catch(() => null));
  }, []);

  // Chargement + realtime (nouvelle prédiction, lock, résolution) + polling léger.
  useEffect(() => {
    refresh();
    const channel = supabase
      .channel(`live-prediction-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_predictions' }, refresh)
      .subscribe();
    const iv = setInterval(refresh, 3500); // reflète vite les paris venus du bot Twitch/Discord
    return () => { supabase.removeChannel(channel); clearInterval(iv); };
  }, [refresh]);

  // Solde du membre (si connecté).
  useEffect(() => {
    if (!session) { setMe(null); return; }
    db.getMyPoints().then((r) => setMe({ linked: r.linked, points: r.points })).catch(() => setMe(null));
  }, [session, tally?.id]);

  if (!tally) return null;

  const totalPot = tally.options.reduce((s, o) => s + o.total, 0);
  const resolved = tally.status === 'resolved';
  const canBet = tally.status === 'open' && session && me?.linked;

  async function bet(optionIndex: number) {
    if (!tally || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await db.placeMyBet(tally.id, optionIndex, amount);
      if (res.ok) { setMsg(`Mise placée ! Solde : ${res.remaining}`); setMe((m) => (m ? { ...m, points: res.remaining ?? m.points } : m)); }
      else setMsg(reason(res.reason));
      refresh();
    } catch {
      setMsg('Erreur lors de la mise.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sticky top-16 z-30 border-b-2 border-line-strong bg-base-900/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="bg-[color:var(--accent-2)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-hud text-[color:var(--base-900)]">
            🔮 Prédiction {tally.status === 'locked' ? '· fermée' : resolved ? '· résolue' : '· ouverte'}
          </span>
          <span className="min-w-0 flex-1 truncate font-mono text-xs uppercase tracking-hud text-[color:var(--text-dim)]">{tally.question}</span>
          {me?.linked && <span className="font-mono text-[10px] text-[color:var(--text-mute)]">{me.points} pts</span>}
        </div>

        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {tally.options.map((o) => {
            const pct = totalPot > 0 ? Math.round((o.total / totalPot) * 100) : 0;
            const won = resolved && tally.winning === o.index;
            return (
              <button
                key={o.index}
                disabled={!canBet || busy}
                onClick={() => bet(o.index)}
                className="group relative overflow-hidden border border-line-strong px-2 py-1.5 text-left transition-colors enabled:hover:border-accent disabled:cursor-default"
                style={won ? { borderColor: 'var(--signal-ok)' } : undefined}
              >
                <span className="absolute inset-y-0 left-0 bg-accent/20" style={{ width: `${pct}%` }} aria-hidden />
                <span className="relative flex items-center justify-between font-mono text-[11px]">
                  <span className="truncate text-[color:var(--text)]">{won && '🏆 '}{o.label}{canBet && <span className="ml-1 text-[color:var(--text-mute)] group-hover:text-accent">— miser</span>}</span>
                  <span className="shrink-0 text-[color:var(--text-dim)]">{pct}% · {o.total}</span>
                </span>
              </button>
            );
          })}
        </div>

        {canBet && (
          <div className="mt-2 flex items-center gap-2">
            <label className="font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)]">Mise</label>
            <input type="number" min={1} value={amount} onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 1))} className="w-24 border border-line-strong bg-base-900/70 px-2 py-1 font-mono text-xs text-[color:var(--text)] focus:border-accent focus:outline-none" />
            <span className="font-mono text-[10px] text-[color:var(--text-mute)]">points, puis clique une option</span>
          </div>
        )}
        {session && me && !me.linked && <p className="mt-1.5 font-mono text-[10px] text-[color:var(--text-mute)]">Lie ton compte Twitch depuis ton espace membre pour parier.</p>}
        {msg && <p className="mt-1.5 font-mono text-[10px] text-[color:var(--signal-ok)]">{msg}</p>}
      </div>
    </div>
  );
}

function reason(r?: string): string {
  switch (r) {
    case 'not_linked': return 'Lie ton compte Twitch pour parier.';
    case 'insufficient': return 'Pas assez de points.';
    case 'already_bet': return 'Tu as déjà parié sur ce match.';
    case 'closed': return 'Les paris sont fermés.';
    default: return 'Mise refusée.';
  }
}
