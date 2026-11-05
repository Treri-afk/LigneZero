import { useEffect, useState } from 'react';
import type { BotConfig, BotNotification, DiscordCommand, DiscordCommandKind, DiscordRoute, DiscordRouteMode } from '@lignezero/types';
import { db } from '@/lib/supabase';
import { Badge, Button, Panel, Spinner } from '@/components/ui';

/**
 * Page dédiée au bot Discord : connexion/serveur, commandes personnalisées
 * (slash ou préfixe, restreignables par salon et par rôle), routage des
 * notifications (feedback/annonce/scrim…) en DM ou salon, et file d'envoi.
 * Le TOKEN reste dans le .env du bot (secret) ; tout le reste s'édite ici.
 */
const ROUTE_KINDS: { kind: string; label: string }[] = [
  { kind: 'feedback', label: 'Feedback joueur' },
  { kind: 'objective', label: 'Objectif' },
  { kind: 'session', label: 'Session / scrim' },
  { kind: 'announcement', label: 'Annonce' },
  { kind: 'custom', label: 'Broadcast' },
  { kind: 'clip', label: 'Clip' },
];
const MODES: { id: DiscordRouteMode; label: string }[] = [
  { id: 'dm', label: 'DM au membre' },
  { id: 'channel', label: 'Salon' },
  { id: 'off', label: 'Coupé' },
];

export function BotDiscordPage() {
  const [cfg, setCfg] = useState<BotConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { db.getBotConfig().then((c) => setCfg(c ?? fallback())).catch((e) => setError(e.message)); }, []);

  async function persist(next: BotConfig, note?: string) {
    setCfg(next);
    try { await db.setBotConfig(next); if (note) { setMsg(note); setTimeout(() => setMsg(null), 2500); } }
    catch (e) { setError(e instanceof Error ? e.message : 'Erreur'); }
  }

  if (error && !cfg) return <p className="border border-[color:var(--accent)] px-3 py-2 font-mono text-xs text-accent">{error}</p>;
  if (!cfg) return <Spinner label="Chargement…" />;

  return (
    <div className="space-y-6">
      <header>
        <p className="hud-label text-[11px]">DCRD // Bot Discord</p>
        <h1 className="font-display text-3xl font-bold uppercase tracking-hud">Bot Discord</h1>
        <p className="mt-1 font-mono text-xs text-[color:var(--text-dim)]">&gt; Serveur, commandes, routage des notifications. Le token reste dans le .env du bot.</p>
      </header>

      {msg && <p className="border border-line-strong px-3 py-2 font-mono text-xs text-[color:var(--signal-ok)]">{msg}</p>}
      {error && <p className="border border-[color:var(--accent)] px-3 py-2 font-mono text-xs text-accent">{error}</p>}

      <ConfigForm cfg={cfg} onSave={(c) => persist(c, 'Enregistré ✓ (appliqué sous ~2 min)')} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CommandsPanel />
        <RoutesPanel />
      </div>
      <NotificationsPanel />
    </div>
  );
}

function fallback(): BotConfig {
  return {
    claimMessage: '', claimMessageUnlinked: '', ticketsEnabled: true, clipsEnabled: true, autoSetLive: true,
    cartridgeName: 'Clip Twitch', cooldownSec: 3, features: {}, pointsName: 'points', pointsPerMessage: 1, pointsPerClaim: 50,
    discordLiveMessage: '🔴 On est EN LIVE !', discordAnnounce: true, discordNotifications: true, discordSubRole: true,
    discordPrefix: '!', discordMessageContent: false,
  };
}

// ── Connexion / serveur ──
function ConfigForm({ cfg, onSave }: { cfg: BotConfig; onSave: (c: BotConfig) => void }) {
  const [f, setF] = useState<BotConfig>(cfg);
  useEffect(() => setF(cfg), [cfg]);
  const set = <K extends keyof BotConfig>(k: K, v: BotConfig[K]) => setF((x) => ({ ...x, [k]: v }));
  return (
    <Panel title="Connexion & serveur" right={<Button onClick={() => onSave(f)}>Enregistrer</Button>}>
      <p className="mb-3 font-mono text-[10px] text-[color:var(--text-mute)]">Ids récupérables par clic droit (mode développeur Discord activé).</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Serveur (Guild ID)"><input className="field" value={f.discordGuildId ?? ''} onChange={(e) => set('discordGuildId', e.target.value)} /></Field>
        <Field label="Salon d’annonce (ID)"><input className="field" value={f.discordAnnounceChannelId ?? ''} onChange={(e) => set('discordAnnounceChannelId', e.target.value)} /></Field>
        <Field label="Rôle abonné (ID)"><input className="field" value={f.discordSubRoleId ?? ''} onChange={(e) => set('discordSubRoleId', e.target.value)} /></Field>
        <Field label="Message d’annonce live"><input className="field" value={f.discordLiveMessage} onChange={(e) => set('discordLiveMessage', e.target.value)} /></Field>
        <Field label="Préfixe des commandes texte"><input className="field" value={f.discordPrefix} onChange={(e) => set('discordPrefix', e.target.value)} /></Field>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 border-t border-line pt-3">
        {(['discordAnnounce', 'discordNotifications', 'discordSubRole'] as const).map((k) => (
          <label key={k} className="flex items-center gap-2 font-mono text-xs text-[color:var(--text-dim)]">
            <input type="checkbox" checked={f[k]} onChange={(e) => set(k, e.target.checked)} />
            {k === 'discordAnnounce' ? 'Annoncer les lives' : k === 'discordNotifications' ? 'Livrer les notifs' : 'Rôle abonné auto'}
          </label>
        ))}
        <label className="flex items-center gap-2 font-mono text-xs text-[color:var(--text-dim)]">
          <input type="checkbox" checked={f.discordMessageContent} onChange={(e) => set('discordMessageContent', e.target.checked)} />
          Commandes préfixe (intent Message Content)
        </label>
      </div>
      {f.discordMessageContent && <p className="mt-2 font-mono text-[10px] text-[color:var(--signal-warn)]">⚠ Active aussi « Message Content Intent » dans le portail développeur Discord, sinon le bot ne se connecte pas.</p>}
    </Panel>
  );
}

// ── Commandes Discord ──
function CommandsPanel() {
  const [items, setItems] = useState<DiscordCommand[] | null>(null);
  const load = () => db.listDiscordCommands().then(setItems);
  useEffect(() => { load(); }, []);
  const blank = (): DiscordCommand => ({ id: crypto.randomUUID(), trigger: 'commande', kind: 'slash', response: '', description: 'Commande personnalisée', enabled: true, allowedChannels: [], cooldownSec: 3 });
  const patch = (i: number, p: Partial<DiscordCommand>) => setItems((xs) => xs!.map((x, j) => (j === i ? { ...x, ...p } : x)));
  async function save(c: DiscordCommand) { await db.upsertDiscordCommand(c); load(); }
  async function remove(id: string) { await db.removeDiscordCommand(id); load(); }
  if (!items) return <Panel title="Commandes"><Spinner /></Panel>;
  return (
    <Panel title="Commandes Discord" right={<Button variant="ghost" onClick={() => setItems([blank(), ...items])}>+ Ajouter</Button>}>
      <p className="mb-3 font-mono text-[10px] text-[color:var(--text-mute)]">Tokens : {'{user} {nextmatch} {score} {roster}'}. Salons vides = tous. Slash : redémarrage du bot requis pour l’enregistrement.</p>
      <div className="space-y-3">
        {items.length === 0 && <p className="font-mono text-xs text-[color:var(--text-mute)]">Aucune commande.</p>}
        {items.map((c, i) => c.kind === 'builtin' ? (
          <div key={c.id} className="border border-line p-2">
            <div className="flex items-center gap-2">
              <Badge tone="ok">intégrée</Badge>
              <span className="font-mono text-xs text-[color:var(--text)]">/{c.trigger}</span>
              <span className="truncate font-mono text-[10px] text-[color:var(--text-mute)]">{c.description}</span>
            </div>
            <input className="field mt-1.5" value={c.allowedChannels.join(', ')} placeholder="Salons autorisés (ids, séparés par ,) — vide = tous" onChange={(e) => patch(i, { allowedChannels: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1 font-mono text-[10px] text-[color:var(--text-dim)]"><input type="checkbox" checked={c.enabled} onChange={(e) => patch(i, { enabled: e.target.checked })} /> actif</label>
              <div className="ml-auto flex gap-1">
                <Button onClick={() => save(c)}>OK</Button>
                <button onClick={() => remove(c.id)} title="Supprimer" className="border border-[color:var(--accent)] px-2 font-mono text-xs text-accent">✕</button>
              </div>
            </div>
          </div>
        ) : (
          <div key={c.id} className="border border-line p-2">
            <div className="grid grid-cols-[90px_1fr] gap-2">
              <select className="field" value={c.kind} onChange={(e) => patch(i, { kind: e.target.value as DiscordCommandKind })}>
                <option value="slash">Slash</option><option value="prefix">Préfixe</option>
              </select>
              <input className="field" value={c.trigger} placeholder="nom" onChange={(e) => patch(i, { trigger: e.target.value })} />
            </div>
            <input className="field mt-1" value={c.response} placeholder="Réponse…" onChange={(e) => patch(i, { response: e.target.value })} />
            {c.kind === 'slash' && <input className="field mt-1" value={c.description} placeholder="Description (slash)" onChange={(e) => patch(i, { description: e.target.value })} />}
            <input className="field mt-1" value={c.allowedChannels.join(', ')} placeholder="Salons autorisés (ids, séparés par ,) — vide = tous" onChange={(e) => patch(i, { allowedChannels: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input className="field h-8 w-40 py-0" value={c.minRoleId ?? ''} placeholder="Rôle requis (id)" onChange={(e) => patch(i, { minRoleId: e.target.value || undefined })} />
              <label className="flex items-center gap-1 font-mono text-[10px] text-[color:var(--text-mute)]">CD<input type="number" className="field h-8 w-14 py-0" value={c.cooldownSec} onChange={(e) => patch(i, { cooldownSec: Number(e.target.value) || 0 })} /></label>
              <label className="flex items-center gap-1 font-mono text-[10px] text-[color:var(--text-dim)]"><input type="checkbox" checked={c.enabled} onChange={(e) => patch(i, { enabled: e.target.checked })} /> actif</label>
              <div className="ml-auto flex gap-1">
                <Button onClick={() => save(c)}>OK</Button>
                <button onClick={() => remove(c.id)} className="border border-[color:var(--accent)] px-2 font-mono text-xs text-accent">✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ── Routage des notifications ──
function RoutesPanel() {
  const [items, setItems] = useState<DiscordRoute[] | null>(null);
  const load = () => db.listDiscordRoutes().then(setItems);
  useEffect(() => { load(); }, []);
  async function save(r: DiscordRoute) { await db.upsertDiscordRoute(r); load(); }
  const patch = (i: number, p: Partial<DiscordRoute>) => setItems((xs) => xs!.map((x, j) => (j === i ? { ...x, ...p } : x)));
  if (!items) return <Panel title="Routage"><Spinner /></Panel>;
  const byKind = (k: string) => items.findIndex((r) => r.kind === k);
  return (
    <Panel title="Routage des notifications">
      <p className="mb-3 font-mono text-[10px] text-[color:var(--text-mute)]">Où chaque type de message part : DM au membre concerné, un salon précis, ou coupé.</p>
      <div className="space-y-2">
        {ROUTE_KINDS.map(({ kind, label }) => {
          const i = byKind(kind);
          const r = i >= 0 ? items[i] : { kind, mode: 'dm' as DiscordRouteMode };
          return (
            <div key={kind} className="flex flex-wrap items-center gap-2 border-b border-line pb-2">
              <span className="w-32 shrink-0 font-mono text-xs text-[color:var(--text-dim)]">{label}</span>
              <select className="field h-8 w-auto py-0" value={r.mode} onChange={(e) => (i >= 0 ? patch(i, { mode: e.target.value as DiscordRouteMode }) : setItems([...items, { kind, mode: e.target.value as DiscordRouteMode }]))}>
                {MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
              {r.mode === 'channel' && <input className="field h-8 flex-1 py-0" value={r.channelId ?? ''} placeholder="Salon (id)" onChange={(e) => (i >= 0 ? patch(i, { channelId: e.target.value }) : null)} />}
              <Button onClick={() => save(i >= 0 ? items[i] : r)}>OK</Button>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// ── File des notifications ──
function NotificationsPanel() {
  const [items, setItems] = useState<BotNotification[] | null>(null);
  useEffect(() => { db.listNotifications(40).then(setItems).catch(() => setItems([])); }, []);
  if (!items) return <Panel title="File des notifications"><Spinner /></Panel>;
  const pending = items.filter((n) => n.status === 'pending').length;
  return (
    <Panel title="File des notifications" right={<Badge tone={pending ? 'live' : 'mute'}>{pending} en attente</Badge>}>
      <div className="max-h-64 space-y-1 overflow-auto font-mono text-[11px]">
        {items.length === 0 && <p className="text-[color:var(--text-mute)]">Aucune notification.</p>}
        {items.map((n) => (
          <div key={n.id} className="flex items-center gap-2 border-b border-line py-1">
            <Badge tone={n.status === 'delivered' ? 'ok' : n.status === 'failed' ? 'warn' : 'mute'}>{n.status}</Badge>
            <span className="text-[color:var(--text-dim)]">{n.kind}</span>
            <span className="truncate text-[color:var(--text-mute)]">{n.title}</span>
            <span className="ml-auto shrink-0 text-[color:var(--text-mute)]">{new Date(n.createdAt).toLocaleDateString('fr-FR')}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}
