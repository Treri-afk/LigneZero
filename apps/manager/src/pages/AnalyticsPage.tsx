import { useEffect, useState } from 'react';
import type { BotEvent, RewardRedemption, ViewerPoints } from '@lignezero/types';
import { db } from '@/lib/supabase';
import { Panel, Spinner } from '@/components/ui';

/**
 * Tableau de bord analytics du bot : drops, clips, points, achats, alertes,
 * top clippeurs — agrégés depuis bot_events et les tables associées.
 */
export function AnalyticsPage() {
  const [events, setEvents] = useState<BotEvent[] | null>(null);
  const [points, setPoints] = useState<ViewerPoints[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);

  useEffect(() => {
    (async () => {
      const [ev, pts, red] = await Promise.all([db.listBotEvents(500), db.listViewerPoints(10), db.listRedemptions()]);
      setEvents(ev);
      setPoints(pts);
      setRedemptions(red);
    })();
  }, []);

  if (!events) return <Spinner label="Chargement…" />;

  const countKind = (pred: (k: string) => boolean) => events.filter((e) => pred(e.kind)).length;
  const tickets = countKind((k) => k === 'ticket_claim');
  const clips = countKind((k) => k === 'clip_cartridge');
  const redeems = countKind((k) => k === 'redeem');
  const alerts = countKind((k) => k.startsWith('alert_'));
  const totalPoints = points.reduce((s, p) => s + p.points, 0);
  const pendingRedemptions = redemptions.filter((r) => r.status === 'pending').length;

  // Top clippeurs (bot_events clip_cartridge)
  const clipCounts = new Map<string, number>();
  events.filter((e) => e.kind === 'clip_cartridge' && e.twitchUser).forEach((e) => clipCounts.set(e.twitchUser!, (clipCounts.get(e.twitchUser!) ?? 0) + 1));
  const topClippers = [...clipCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  // Évènements par type
  const byKind = new Map<string, number>();
  events.forEach((e) => byKind.set(e.kind, (byKind.get(e.kind) ?? 0) + 1));
  const kinds = [...byKind.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  const maxKind = Math.max(1, ...kinds.map(([, n]) => n));

  return (
    <div className="space-y-6">
      <header>
        <p className="hud-label text-[11px]">STAT // Analytics bot</p>
        <h1 className="font-display text-3xl font-bold uppercase tracking-hud">Analytics bot</h1>
        <p className="mt-1 font-mono text-xs text-[color:var(--text-dim)]">&gt; Basé sur les {events.length} derniers évènements.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Tickets réclamés" value={tickets} />
        <Stat label="Clips → cartouches" value={clips} />
        <Stat label="Achats boutique" value={redeems} />
        <Stat label="Alertes" value={alerts} />
        <Stat label="Points en circulation" value={totalPoints} />
        <Stat label="Demandes à traiter" value={pendingRedemptions} accent={pendingRedemptions > 0} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Top clippeurs">
          {topClippers.length === 0 ? <p className="font-mono text-xs text-[color:var(--text-mute)]">Aucun clip enregistré.</p> : (
            <ol className="space-y-1 font-mono text-xs">
              {topClippers.map(([who, n], i) => (
                <li key={who} className="flex justify-between"><span className="text-[color:var(--text-dim)]">{i + 1}. {who}</span><span className="text-accent">{n} clip{n > 1 ? 's' : ''}</span></li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title="Top points">
          {points.length === 0 ? <p className="font-mono text-xs text-[color:var(--text-mute)]">Aucun point distribué.</p> : (
            <ol className="space-y-1 font-mono text-xs">
              {points.map((p, i) => (
                <li key={p.twitchLogin} className="flex justify-between"><span className="text-[color:var(--text-dim)]">{i + 1}. {p.twitchLogin}</span><span className="text-[color:var(--signal-ok)]">{p.points}</span></li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <Panel title="Évènements par type">
        <div className="space-y-1.5">
          {kinds.map(([k, n]) => (
            <div key={k} className="flex items-center gap-2 font-mono text-[11px]">
              <span className="w-40 shrink-0 truncate text-[color:var(--text-dim)]">{k}</span>
              <span className="h-3 bg-accent" style={{ width: `${(n / maxKind) * 100}%`, minWidth: 4 }} />
              <span className="text-[color:var(--text-mute)]">{n}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="panel p-3" style={accent ? { borderColor: 'var(--accent)' } : undefined}>
      <p className="font-display text-2xl font-bold" style={{ color: accent ? 'var(--accent)' : 'var(--text)' }}>{value}</p>
      <p className="font-mono text-[10px] uppercase leading-tight tracking-hud text-[color:var(--text-mute)]">{label}</p>
    </div>
  );
}
