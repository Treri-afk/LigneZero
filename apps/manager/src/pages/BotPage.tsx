import { useEffect, useState } from 'react';
import type { BotAlert, BotCommand, BotCommandRole, BotConfig, BotEvent, BotFeatureKey, BotQuote, BotReward, BotTimer, MatchPrediction, RewardRedemption, ViewerPoints } from '@lignezero/types';
import { BOT_FEATURES } from '@lignezero/types';
import { db } from '@/lib/supabase';
import { Badge, Button, Panel, Spinner } from '@/components/ui';

/**
 * Administration du bot Twitch. Config générale, interrupteurs de features
 * (1 bouton chacun), commandes custom, messages périodiques, citations, points
 * et journal d'activité. Le bot lit ces tables et se recharge tout seul.
 */
const ROLES: { id: BotCommandRole; label: string }[] = [
  { id: 'everyone', label: 'Tout le monde' },
  { id: 'sub', label: 'Abonnés' },
  { id: 'vip', label: 'VIP' },
  { id: 'mod', label: 'Modérateurs' },
  { id: 'broadcaster', label: 'Streamer' },
];

export function BotPage() {
  const [cfg, setCfg] = useState<BotConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    db.getBotConfig().then((c) => setCfg(c ?? fallbackConfig())).catch((e) => setError(e.message));
  }, []);

  async function persist(next: BotConfig, note?: string) {
    setCfg(next);
    try {
      await db.setBotConfig(next);
      if (note) { setMsg(note); setTimeout(() => setMsg(null), 2500); }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  }
  const toggleFeature = (key: BotFeatureKey, on: boolean) =>
    cfg && persist({ ...cfg, features: { ...cfg.features, [key]: on } });

  if (error && !cfg) return <p className="border border-[color:var(--accent)] px-3 py-2 font-mono text-xs text-accent">{error}</p>;
  if (!cfg) return <Spinner label="Chargement…" />;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="hud-label text-[11px]">BOT // Bot Twitch</p>
          <h1 className="font-display text-3xl font-bold uppercase tracking-hud">Bot Twitch</h1>
          <p className="mt-1 font-mono text-xs text-[color:var(--text-dim)]">&gt; Drops, points, animations du chat. Chaque feature s’active d’un bouton.</p>
        </div>
      </header>

      {msg && <p className="border border-line-strong px-3 py-2 font-mono text-xs text-[color:var(--signal-ok)]">{msg}</p>}
      {error && <p className="border border-[color:var(--accent)] px-3 py-2 font-mono text-xs text-accent">{error}</p>}

      {/* ── Features ── */}
      <Panel title="Features (interrupteurs)">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {BOT_FEATURES.map((f) => {
            const on = cfg.features[f.key] ?? defaultOn(f.key);
            return (
              <button
                key={f.key}
                onClick={() => toggleFeature(f.key, !on)}
                className="flex items-start gap-3 border p-3 text-left transition-colors"
                style={{ borderColor: on ? 'var(--signal-ok)' : 'var(--line-strong)', background: on ? 'color-mix(in srgb, var(--signal-ok) 10%, transparent)' : 'transparent' }}
              >
                <span className="mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full px-0.5" style={{ background: on ? 'var(--signal-ok)' : 'var(--line-strong)' }}>
                  <span className="h-4 w-4 rounded-full bg-[color:var(--base-900)] transition-transform" style={{ transform: on ? 'translateX(16px)' : 'translateX(0)' }} />
                </span>
                <span>
                  <span className="block font-display text-sm font-bold uppercase">{f.label}</span>
                  <span className="block font-mono text-[10px] leading-tight text-[color:var(--text-mute)]">{f.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Panel>

      <ConfigForm cfg={cfg} onSave={(c) => persist(c, 'Config enregistrée ✓ (appliquée sous ~2 min)')} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RewardsPanel />
        <RedemptionsPanel />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AlertsPanel />
        <PredictionsPanel />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CommandsPanel />
        <TimersPanel />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PointsAdminPanel />
        <BroadcastPanel />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <QuotesPanel />
        <div className="space-y-6">
          <LeaderboardPanel />
          <EventsPanel />
        </div>
      </div>
    </div>
  );
}

// ── Ajustement manuel des points ──
function PointsAdminPanel() {
  const [login, setLogin] = useState('');
  const [delta, setDelta] = useState(100);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function apply(sign: 1 | -1) {
    if (!login.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const bal = await db.adjustViewerPoints(login.trim(), sign * Math.abs(delta));
      setMsg(`${login.trim()} → ${bal} points`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Panel title="Ajuster les points">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1"><label className="label">Login Twitch</label><input className="field" value={login} placeholder="pseudo" onChange={(e) => setLogin(e.target.value)} /></div>
        <div className="w-24"><label className="label">Montant</label><input type="number" className="field" value={delta} onChange={(e) => setDelta(Number(e.target.value) || 0)} /></div>
        <Button onClick={() => apply(1)} disabled={busy}>+ Créditer</Button>
        <button onClick={() => apply(-1)} disabled={busy} className="border border-[color:var(--accent)] px-3 py-2 font-mono text-xs uppercase tracking-hud text-accent disabled:opacity-50">− Débiter</button>
      </div>
      {msg && <p className="mt-3 font-mono text-xs text-[color:var(--signal-ok)]">{msg}</p>}
    </Panel>
  );
}

// ── Broadcast Discord ──
function BroadcastPanel() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function send() {
    if (!title.trim()) return;
    if (!confirm('Envoyer cette annonce en DM à tous les membres liés Discord ?')) return;
    setBusy(true);
    setMsg(null);
    try {
      const n = await db.broadcastNotification('custom', title.trim(), body.trim() || undefined);
      setMsg(`En file pour ${n} membre(s) — livraison par le bot Discord.`);
      setTitle('');
      setBody('');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Panel title="Broadcast Discord" right={<Button onClick={send} disabled={busy}>{busy ? '…' : 'Envoyer'}</Button>}>
      <div className="space-y-2">
        <input className="field" value={title} placeholder="Titre de l’annonce" onChange={(e) => setTitle(e.target.value)} />
        <textarea className="field h-20" value={body} placeholder="Message (optionnel)…" onChange={(e) => setBody(e.target.value)} />
        <p className="font-mono text-[10px] text-[color:var(--text-mute)]">Livré en DM aux membres ayant lié leur Discord. Nécessite le bot Discord actif.</p>
        {msg && <p className="font-mono text-xs text-[color:var(--signal-ok)]">{msg}</p>}
      </div>
    </Panel>
  );
}

// ── Boutique de points ──
function RewardsPanel() {
  const [items, setItems] = useState<BotReward[] | null>(null);
  const load = () => db.listBotRewards().then(setItems);
  useEffect(() => { load(); }, []);
  const blank = (): BotReward => ({ id: crypto.randomUUID(), name: 'Nouvelle récompense', description: '', cost: 100, kind: 'custom', enabled: true, sortOrder: 0 });
  async function save(r: BotReward) { await db.upsertBotReward(r); load(); }
  async function remove(id: string) { await db.removeBotReward(id); load(); }
  if (!items) return <Panel title="Boutique de points"><Spinner /></Panel>;
  return (
    <Panel title="Boutique de points" right={<Button variant="ghost" onClick={() => setItems([blank(), ...items])}>+ Récompense</Button>}>
      <div className="space-y-3">
        {items.length === 0 && <p className="font-mono text-xs text-[color:var(--text-mute)]">Aucune récompense.</p>}
        {items.map((r, i) => (
          <div key={r.id} className="border border-line p-2">
            <div className="grid grid-cols-[1fr_70px] gap-2">
              <input className="field" value={r.name} placeholder="Nom" onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <input type="number" className="field" value={r.cost} title="Coût" onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, cost: Number(e.target.value) || 0 } : x)))} />
            </div>
            <input className="field mt-1" value={r.description ?? ''} placeholder="Description (optionnel)" onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1 font-mono text-[10px] text-[color:var(--text-mute)]">stock<input type="number" className="field h-8 w-16 py-0" value={r.stock ?? ''} placeholder="∞" onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, stock: e.target.value === '' ? undefined : Number(e.target.value) } : x)))} /></label>
              <label className="flex items-center gap-1 font-mono text-[10px] text-[color:var(--text-dim)]"><input type="checkbox" checked={r.enabled} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, enabled: e.target.checked } : x)))} /> actif</label>
              <div className="ml-auto flex gap-1">
                <Button onClick={() => save(r)}>OK</Button>
                <button onClick={() => remove(r.id)} className="border border-[color:var(--accent)] px-2 font-mono text-xs text-accent">✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ── Demandes d'achat à traiter ──
function RedemptionsPanel() {
  const [items, setItems] = useState<RewardRedemption[] | null>(null);
  const load = () => db.listRedemptions().then(setItems);
  useEffect(() => { load(); }, []);
  async function decide(id: string, status: 'fulfilled' | 'refunded') { await db.setRedemptionStatus(id, status); load(); }
  if (!items) return <Panel title="Demandes d’achat"><Spinner /></Panel>;
  const pending = items.filter((r) => r.status === 'pending');
  return (
    <Panel title="Demandes d’achat" right={<Badge tone={pending.length ? 'live' : 'mute'}>{pending.length} en attente</Badge>}>
      <div className="max-h-72 space-y-2 overflow-auto">
        {items.length === 0 && <p className="font-mono text-xs text-[color:var(--text-mute)]">Aucune demande.</p>}
        {items.map((r) => (
          <div key={r.id} className="flex items-center gap-2 border-b border-line py-1.5 font-mono text-xs">
            <Badge tone={r.status === 'pending' ? 'live' : r.status === 'fulfilled' ? 'ok' : 'warn'}>{r.status}</Badge>
            <span className="text-[color:var(--text-dim)]">{r.twitchLogin}</span>
            <span className="truncate text-[color:var(--text-mute)]">{r.rewardName} ({r.cost})</span>
            {r.status === 'pending' && (
              <span className="ml-auto flex gap-1">
                <button onClick={() => decide(r.id, 'fulfilled')} className="border border-line-strong px-1.5 text-[color:var(--signal-ok)] hover:border-[color:var(--signal-ok)]">✓</button>
                <button onClick={() => decide(r.id, 'refunded')} className="border border-line-strong px-1.5 text-accent hover:border-accent" title="Rembourser">↩</button>
              </span>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ── Alertes ──
function AlertsPanel() {
  const [items, setItems] = useState<BotAlert[] | null>(null);
  const load = () => db.listBotAlerts().then(setItems);
  useEffect(() => { load(); }, []);
  async function save(a: BotAlert) { await db.upsertBotAlert(a); load(); }
  if (!items) return <Panel title="Alertes"><Spinner /></Panel>;
  return (
    <Panel title="Alertes → évènement">
      <p className="mb-2 font-mono text-[10px] text-[color:var(--text-mute)]">Tokens : {'{user} {amount} {months} {viewers}'}. Nécessite le token broadcaster côté bot.</p>
      <div className="space-y-2">
        {items.map((a, i) => (
          <div key={a.id} className="border border-line p-2">
            <div className="flex items-center gap-2">
              <Badge>{a.eventType}</Badge>
              <label className="ml-auto flex items-center gap-1 font-mono text-[10px] text-[color:var(--text-dim)]"><input type="checkbox" checked={a.enabled} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, enabled: e.target.checked } : x)))} /> actif</label>
            </div>
            <input className="field mt-1" value={a.message} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, message: e.target.value } : x)))} />
            <div className="mt-1 flex items-center gap-2">
              <label className="flex items-center gap-1 font-mono text-[10px] text-[color:var(--text-mute)]">+pts<input type="number" className="field h-8 w-16 py-0" value={a.rewardPoints} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, rewardPoints: Number(e.target.value) || 0 } : x)))} /></label>
              <label className="flex items-center gap-1 font-mono text-[10px] text-[color:var(--text-mute)]">seuil<input type="number" className="field h-8 w-16 py-0" value={a.minAmount} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, minAmount: Number(e.target.value) || 0 } : x)))} /></label>
              <Button onClick={() => save(a)}>OK</Button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ── Prédictions / paris ──
function PredictionsPanel() {
  const [items, setItems] = useState<MatchPrediction[] | null>(null);
  const [q, setQ] = useState('');
  const [opts, setOpts] = useState('Victoire | Défaite');
  const load = () => db.listPredictions().then(setItems);
  useEffect(() => { load(); }, []);
  async function create() {
    const options = opts.split('|').map((s) => s.trim()).filter(Boolean);
    if (!q.trim() || options.length < 2) return;
    await db.createPrediction(q.trim(), options);
    setQ('');
    load();
  }
  async function lock(id: string) { await db.setPredictionStatus(id, 'locked'); load(); }
  async function resolve(p: MatchPrediction, n: number) { await db.resolvePrediction(p.id, n); load(); }
  if (!items) return <Panel title="Prédictions"><Spinner /></Panel>;
  return (
    <Panel title="Prédictions / paris">
      <div className="mb-3 space-y-2 border-b border-line pb-3">
        <input className="field" value={q} placeholder="Question…" onChange={(e) => setQ(e.target.value)} />
        <div className="flex gap-2">
          <input className="field" value={opts} placeholder="Option 1 | Option 2" onChange={(e) => setOpts(e.target.value)} />
          <Button onClick={create}>Ouvrir</Button>
        </div>
      </div>
      <div className="max-h-64 space-y-2 overflow-auto">
        {items.length === 0 && <p className="font-mono text-xs text-[color:var(--text-mute)]">Aucune prédiction.</p>}
        {items.map((p) => (
          <div key={p.id} className="border border-line p-2 font-mono text-xs">
            <div className="flex items-center gap-2">
              <Badge tone={p.status === 'open' ? 'live' : p.status === 'resolved' ? 'ok' : 'warn'}>{p.status}</Badge>
              <span className="truncate text-[color:var(--text-dim)]">{p.question}</span>
              {p.status === 'open' && <button onClick={() => lock(p.id)} className="ml-auto border border-line-strong px-1.5 text-[color:var(--text-mute)] hover:border-accent">🔒</button>}
            </div>
            {p.status !== 'resolved' ? (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {p.options.map((o, i) => (
                  <button key={i} onClick={() => resolve(p, i)} className="border border-line-strong px-2 py-0.5 text-[color:var(--text-dim)] hover:border-[color:var(--signal-ok)] hover:text-[color:var(--signal-ok)]">🏆 {o}</button>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-[color:var(--signal-ok)]">Gagnant : {p.options[p.winningOption ?? 0]}</p>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function defaultOn(key: BotFeatureKey): boolean {
  return key !== 'automod' && key !== 'greetings';
}
function fallbackConfig(): BotConfig {
  return {
    claimMessage: 'Bien joué @{user} ! Tu as récupéré ton ticket pour le match {match} 🎟️',
    claimMessageUnlinked: '@{user} lie ton compte Twitch sur le site pour réclamer tes récompenses !',
    ticketsEnabled: true, clipsEnabled: true, autoSetLive: true,
    cartridgeName: 'Clip Twitch', cooldownSec: 3, features: {},
    pointsName: 'points', pointsPerMessage: 1, pointsPerClaim: 50,
    discordLiveMessage: '🔴 On est EN LIVE !', discordAnnounce: true, discordNotifications: true, discordSubRole: true,
    discordPrefix: '!', discordMessageContent: false,
  };
}

// ── Config générale ──
function ConfigForm({ cfg, onSave }: { cfg: BotConfig; onSave: (c: BotConfig) => void }) {
  const [f, setF] = useState<BotConfig>(cfg);
  useEffect(() => setF(cfg), [cfg]);
  const set = <K extends keyof BotConfig>(k: K, v: BotConfig[K]) => setF((x) => ({ ...x, [k]: v }));
  return (
    <Panel title="Configuration" right={<Button onClick={() => onSave(f)}>Enregistrer</Button>}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Chaîne Twitch (login)"><input className="field" value={f.twitchChannel ?? ''} onChange={(e) => set('twitchChannel', e.target.value)} /></Field>
        <Field label="Compte bot (login)"><input className="field" value={f.twitchBotUsername ?? ''} onChange={(e) => set('twitchBotUsername', e.target.value)} /></Field>
        <Field label="Lien Discord ({discord})"><input className="field" value={f.discordInvite ?? ''} onChange={(e) => set('discordInvite', e.target.value)} /></Field>
        <Field label="Anti-spam global (s)"><input type="number" className="field" value={f.cooldownSec} onChange={(e) => set('cooldownSec', Number(e.target.value) || 0)} /></Field>
        <Field label="Nom cartouche (clip)"><input className="field" value={f.cartridgeName} onChange={(e) => set('cartridgeName', e.target.value)} /></Field>
        <Field label="Nom des points"><input className="field" value={f.pointsName} onChange={(e) => set('pointsName', e.target.value)} /></Field>
        <Field label="Points / message"><input type="number" className="field" value={f.pointsPerMessage} onChange={(e) => set('pointsPerMessage', Number(e.target.value) || 0)} /></Field>
        <Field label="Points / ticket"><input type="number" className="field" value={f.pointsPerClaim} onChange={(e) => set('pointsPerClaim', Number(e.target.value) || 0)} /></Field>
        <div className="col-span-2"><Field label="Message ticket réclamé — {user} {match} {competition}"><input className="field" value={f.claimMessage} onChange={(e) => set('claimMessage', e.target.value)} /></Field></div>
        <div className="col-span-2"><Field label="Message compte non lié — {user}"><input className="field" value={f.claimMessageUnlinked} onChange={(e) => set('claimMessageUnlinked', e.target.value)} /></Field></div>
        <label className="col-span-2 flex items-center gap-2 font-mono text-xs text-[color:var(--text-dim)]">
          <input type="checkbox" checked={f.autoSetLive} onChange={(e) => set('autoSetLive', e.target.checked)} /> Passer le match du jour en « live » automatiquement au démarrage du stream
        </label>
      </div>
    </Panel>
  );
}

// ── Commandes custom ──
function CommandsPanel() {
  const [items, setItems] = useState<BotCommand[] | null>(null);
  const load = () => db.listBotCommands().then(setItems);
  useEffect(() => { load(); }, []);
  const blank = (): BotCommand => ({ id: crypto.randomUUID(), trigger: '!', response: '', enabled: true, minRole: 'everyone', cooldownSec: 5 });
  async function save(c: BotCommand) { await db.upsertBotCommand(c); load(); }
  async function remove(id: string) { await db.removeBotCommand(id); load(); }
  if (!items) return <Panel title="Commandes custom"><Spinner /></Panel>;
  return (
    <Panel title="Commandes custom" right={<Button variant="ghost" onClick={() => setItems([blank(), ...items])}>+ Ajouter</Button>}>
      <p className="mb-3 font-mono text-[10px] text-[color:var(--text-mute)]">Tokens : {'{user} {discord} {nextmatch} {score} {roster} {uptime} {match} {competition}'}</p>
      <div className="space-y-3">
        {items.length === 0 && <p className="font-mono text-xs text-[color:var(--text-mute)]">Aucune commande.</p>}
        {items.map((c, i) => (
          <div key={c.id} className="border border-line p-2">
            <div className="grid grid-cols-[100px_1fr] gap-2">
              <input className="field" value={c.trigger} placeholder="!nom" onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, trigger: e.target.value } : x)))} />
              <input className="field" value={c.response} placeholder="Réponse…" onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, response: e.target.value } : x)))} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select className="field h-8 w-auto py-0" value={c.minRole} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, minRole: e.target.value as BotCommandRole } : x)))}>
                {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
              <label className="flex items-center gap-1 font-mono text-[10px] text-[color:var(--text-mute)]">CD<input type="number" className="field h-8 w-14 py-0" value={c.cooldownSec} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, cooldownSec: Number(e.target.value) || 0 } : x)))} /></label>
              <label className="flex items-center gap-1 font-mono text-[10px] text-[color:var(--text-dim)]"><input type="checkbox" checked={c.enabled} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, enabled: e.target.checked } : x)))} /> actif</label>
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

// ── Timers ──
function TimersPanel() {
  const [items, setItems] = useState<BotTimer[] | null>(null);
  const load = () => db.listBotTimers().then(setItems);
  useEffect(() => { load(); }, []);
  const blank = (): BotTimer => ({ id: crypto.randomUUID(), label: 'Nouveau', message: '', intervalSec: 600, enabled: true });
  async function save(t: BotTimer) { await db.upsertBotTimer(t); load(); }
  async function remove(id: string) { await db.removeBotTimer(id); load(); }
  if (!items) return <Panel title="Messages périodiques"><Spinner /></Panel>;
  return (
    <Panel title="Messages périodiques" right={<Button variant="ghost" onClick={() => setItems([blank(), ...items])}>+ Ajouter</Button>}>
      <div className="space-y-3">
        {items.length === 0 && <p className="font-mono text-xs text-[color:var(--text-mute)]">Aucun message périodique.</p>}
        {items.map((t, i) => (
          <div key={t.id} className="border border-line p-2">
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <input className="field" value={t.label} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <input className="field" value={t.message} placeholder="Message…" onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, message: e.target.value } : x)))} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <label className="flex items-center gap-1 font-mono text-[10px] text-[color:var(--text-mute)]">toutes les<input type="number" className="field h-8 w-20 py-0" value={t.intervalSec} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, intervalSec: Number(e.target.value) || 60 } : x)))} />s</label>
              <label className="flex items-center gap-1 font-mono text-[10px] text-[color:var(--text-dim)]"><input type="checkbox" checked={t.enabled} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, enabled: e.target.checked } : x)))} /> actif</label>
              <div className="ml-auto flex gap-1">
                <Button onClick={() => save(t)}>OK</Button>
                <button onClick={() => remove(t.id)} className="border border-[color:var(--accent)] px-2 font-mono text-xs text-accent">✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ── Citations ──
function QuotesPanel() {
  const [items, setItems] = useState<BotQuote[] | null>(null);
  const [text, setText] = useState('');
  const load = () => db.listBotQuotes().then(setItems);
  useEffect(() => { load(); }, []);
  async function add() { if (!text.trim()) return; await db.addBotQuote(text.trim(), 'staff'); setText(''); load(); }
  async function remove(id: number) { await db.removeBotQuote(id); load(); }
  if (!items) return <Panel title="Citations"><Spinner /></Panel>;
  return (
    <Panel title="Citations (!quote)">
      <div className="mb-3 flex gap-2">
        <input className="field" value={text} placeholder="Nouvelle citation…" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <Button onClick={add}>+ </Button>
      </div>
      <div className="max-h-64 space-y-2 overflow-auto">
        {items.length === 0 && <p className="font-mono text-xs text-[color:var(--text-mute)]">Aucune citation.</p>}
        {items.map((q) => (
          <div key={q.id} className="flex items-start justify-between gap-2 border-b border-line pb-2 font-mono text-xs">
            <span className="text-[color:var(--text-dim)]">#{q.id} « {q.text} »</span>
            <button onClick={() => remove(q.id)} className="shrink-0 text-[color:var(--text-mute)] hover:text-accent">✕</button>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ── Leaderboard points ──
function LeaderboardPanel() {
  const [items, setItems] = useState<ViewerPoints[] | null>(null);
  useEffect(() => { db.listViewerPoints(10).then(setItems).catch(() => setItems([])); }, []);
  if (!items) return <Panel title="Classement points"><Spinner /></Panel>;
  return (
    <Panel title="Classement points">
      {items.length === 0 ? <p className="font-mono text-xs text-[color:var(--text-mute)]">Aucun point distribué.</p> : (
        <ol className="space-y-1 font-mono text-xs">
          {items.map((v, i) => (
            <li key={v.twitchLogin} className="flex justify-between"><span className="text-[color:var(--text-dim)]">{i + 1}. {v.twitchLogin}</span><span className="text-[color:var(--signal-ok)]">{v.points}</span></li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

// ── Journal ──
function EventsPanel() {
  const [items, setItems] = useState<BotEvent[] | null>(null);
  useEffect(() => { db.listBotEvents(40).then(setItems).catch(() => setItems([])); }, []);
  if (!items) return <Panel title="Journal"><Spinner /></Panel>;
  return (
    <Panel title="Journal d’activité">
      <div className="max-h-64 space-y-1 overflow-auto font-mono text-[11px]">
        {items.length === 0 && <p className="text-[color:var(--text-mute)]">Aucun évènement.</p>}
        {items.map((e) => (
          <div key={e.id} className="flex items-center gap-2 border-b border-line py-1">
            <Badge tone={e.kind.includes('error') || e.kind.includes('automod') ? 'warn' : e.kind.includes('claim') || e.kind.includes('cartridge') ? 'ok' : 'mute'}>{e.kind}</Badge>
            {e.twitchUser && <span className="text-[color:var(--text-dim)]">{e.twitchUser}</span>}
            <span className="ml-auto text-[color:var(--text-mute)]">{new Date(e.createdAt).toLocaleTimeString('fr-FR')}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}
