import { useEffect, useState } from 'react';
import { useDocTitle } from '@/hooks/useDocTitle';
import type { FavoriteMatch, InventoryItem } from '@/types';
import { MatchTicketCard } from '@lignezero/ticket';
import { useAuth } from '@/auth/AuthProvider';
import { useData } from '@/data/DataProvider';
import { db, supabase } from '@/lib/supabase';
import { KeycapButton } from '@/components/ui/KeycapButton';
import { Bracket } from '@/components/ui/Bracket';
import { HudFrame } from '@/components/ui/HudFrame';
import { GlitchText } from '@/components/animation/GlitchText';
import { formatDate } from '@/lib/format';

type Mode = 'login' | 'signup';

const KIND_LABEL: Record<InventoryItem['kind'], string> = {
  ticket: 'Ticket',
  cartouche: 'Cartouche',
  special: 'Spécial',
};

export default function AccountPage() {
  const { session, profile, loading } = useAuth();

  useDocTitle('Compte');

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 text-center sm:px-6">
        <p className="hud-label text-xs">[ Vérification de la session… ]</p>
      </div>
    );
  }

  return session ? <MemberDashboard displayName={profile?.displayName} /> : <LoginForm />;
}

/* ── Non connecté : terminal d'accès (connexion / inscription) ─────── */
function LoginForm() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const PERKS = [
    'Badge d’accès personnel',
    'Inventaire (tickets, cartouches, objets spéciaux)',
    'Suivi des matchs favoris',
    'Contenus & drops réservés à la commu',
  ];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setStatus(null);
    setBusy(true);
    const res = mode === 'login' ? await signIn(email, password) : await signUp(email, password, pseudo || email);
    setBusy(false);
    if (res.error) {
      setError(res.error);
    } else if (mode === 'signup') {
      setStatus('Compte créé — vérifie ta boîte mail si une confirmation est requise, puis connecte-toi.');
      setMode('login');
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="hazard mb-8 h-3 w-full opacity-60" aria-hidden />
      <p className="hud-label mb-4 flex items-center gap-3 text-xs">
        <Bracket>ACCÈS SÉCURISÉ</Bracket>
        <span className="h-px w-12 bg-accent" />
      </p>
      <h1 className="hud-title text-5xl font-bold leading-none glow-text sm:text-7xl">
        <GlitchText text="Compte" />
      </h1>
      <p className="mt-4 max-w-xl font-mono text-sm leading-relaxed text-[color:var(--text-dim)]">
        &gt; Identifie-toi pour accéder à ton espace.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="cut-panel panel-concrete border-2 border-line-strong p-6 shadow-ink">
          <div className="mb-6 grid grid-cols-2 gap-0 border-2 border-line-strong">
            {(['login', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setStatus(null); setError(null); }}
                className={[
                  'py-2 font-mono text-[11px] font-bold uppercase tracking-hud transition-colors duration-ui',
                  mode === m ? 'bg-accent text-[color:var(--paper)]' : 'text-[color:var(--text-dim)] hover:text-[color:var(--text)]',
                ].join(' ')}
              >
                {m === 'login' ? 'Connexion' : 'Créer un compte'}
              </button>
            ))}
          </div>

          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            {mode === 'signup' && (
              <Field id="pseudo" label="Pseudo" type="text" value={pseudo} onChange={setPseudo} placeholder="ton_pseudo" autoComplete="username" />
            )}
            <Field id="email" label="Identifiant / e-mail" type="email" value={email} onChange={setEmail} placeholder="agent@lignezero.gg" autoComplete="email" />
            <Field
              id="password"
              label="Mot de passe"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />

            <KeycapButton type="submit" className="mt-2 w-full" sound>
              {busy ? '…' : mode === 'login' ? 'Se connecter' : 'S’inscrire'} &gt;
            </KeycapButton>

            {error && (
              <p className="mt-1 border-l-2 border-accent bg-base-800/60 px-3 py-2 font-mono text-[11px] leading-relaxed text-accent">
                <span>&gt;</span> {error}
              </p>
            )}
            {status && (
              <p className="mt-1 border-l-2 border-accent bg-base-800/60 px-3 py-2 font-mono text-[11px] leading-relaxed text-[color:var(--text-dim)]">
                <span className="text-accent">&gt;</span> {status}
              </p>
            )}
          </form>
        </div>

        <div className="cut-panel-alt border-2 border-line-strong bg-base-800/40 p-6">
          <p className="hud-label mb-4 text-xs"><Bracket tone="dim">AVANTAGES</Bracket></p>
          <p className="hud-title mb-5 text-xl font-bold leading-tight">Avec un compte, tu débloques</p>
          <ul className="space-y-3">
            {PERKS.map((p) => (
              <li key={p} className="flex items-start gap-3 font-mono text-[12px] leading-snug text-[color:var(--text-dim)]">
                <span className="mt-0.5 text-accent">▸</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Field({
  id, label, type, value, onChange, placeholder, autoComplete,
}: { id: string; label: string; type: string; value: string; onChange: (v: string) => void; placeholder?: string; autoComplete?: string }) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-dim)]">{label}</span>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="border-2 border-line-strong bg-base-900/70 px-3 py-2.5 font-mono text-sm text-[color:var(--text)] placeholder:text-[color:var(--text-mute)] transition-colors focus:border-accent focus:outline-none"
      />
    </label>
  );
}

/* ── Connecté : espace membre ────────────────────────────────────── */
function MemberDashboard({ displayName }: { displayName?: string }) {
  const { session, signOut } = useAuth();
  const { matches, games } = useData();
  const [inventory, setInventory] = useState<InventoryItem[] | null>(null);
  const [favorites, setFavorites] = useState<FavoriteMatch[]>([]);
  const [discord, setDiscord] = useState('');
  const [twitch, setTwitch] = useState('');
  const [savingLinks, setSavingLinks] = useState(false);
  const [linksMsg, setLinksMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [inv, fav, lk] = await Promise.all([db.listMyInventory(), db.listMyFavorites(), db.getMyLinks()]);
      setInventory(inv);
      setFavorites(fav);
      setDiscord(lk?.discordHandle ?? '');
      setTwitch(lk?.twitchHandle ?? '');
      // Si des comptes OAuth sont liés, on synchronise handle + id fiables.
      const identities = session?.user.identities ?? [];
      if (identities.some((i) => i.provider === 'twitch' || i.provider === 'discord')) {
        const synced = await db.syncMyLinksFromIdentities().catch(() => null);
        if (synced) {
          setDiscord(synced.discordHandle ?? '');
          setTwitch(synced.twitchHandle ?? '');
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function linkOAuth(provider: 'twitch' | 'discord') {
    setLinksMsg(null);
    const { error } = await supabase.auth.linkIdentity({ provider });
    if (error) setLinksMsg(error.message);
  }

  async function saveLinks(e: React.FormEvent) {
    e.preventDefault();
    setSavingLinks(true);
    setLinksMsg(null);
    try {
      await db.upsertMyLinks({ discordHandle: discord.trim() || undefined, twitchHandle: twitch.trim() || undefined });
      setLinksMsg('Liens enregistrés ✓ — les drops te trouveront désormais automatiquement.');
    } catch (e2) {
      setLinksMsg(e2 instanceof Error ? e2.message : 'Erreur');
    } finally {
      setSavingLinks(false);
    }
  }

  async function unfavorite(matchId: string) {
    await db.removeFavorite(matchId);
    setFavorites((f) => f.filter((x) => x.matchId !== matchId));
  }

  const pseudo = displayName || session?.user.email?.split('@')[0] || 'Agent';
  const joined = session?.user.created_at ? formatDate(session.user.created_at) : '—';
  const favoriteMatches = favorites
    .map((f) => matches.find((m) => m.id === f.matchId))
    .filter((m): m is NonNullable<typeof m> => !!m);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="hazard mb-8 h-3 w-full opacity-60" aria-hidden />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="hud-label mb-4 flex items-center gap-3 text-xs">
            <Bracket>ESPACE MEMBRE</Bracket>
            <span className="h-px w-12 bg-accent" />
          </p>
          <h1 className="hud-title text-5xl font-bold leading-none glow-text sm:text-6xl">
            <GlitchText text={pseudo.toUpperCase()} />
          </h1>
        </div>
        <button
          type="button"
          onClick={() => signOut()}
          className="border-2 border-line-strong px-4 py-2 font-mono text-xs uppercase tracking-hud text-[color:var(--text-dim)] transition-colors hover:border-accent hover:text-[color:var(--text)]"
        >
          Se déconnecter
        </button>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        {/* ── Badge d'accès ── */}
        <div className="cut-panel panel-concrete border-2 border-line-strong p-6 shadow-ink">
          <p className="hud-label mb-4 text-[10px]">[ Badge d'accès ]</p>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 bg-accent" aria-hidden />
            <span className="hud-label text-[9px]">Membre</span>
          </div>
          <p className="hud-title mt-2 text-2xl font-bold leading-none" style={{ textShadow: '3px 3px 0 var(--base-900), 5px 5px 0 var(--accent)' }}>
            {pseudo}
          </p>
          <dl className="mt-5 space-y-2 border-t border-line pt-4 font-mono text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-[color:var(--text-mute)]">Membre depuis</dt>
              <dd className="text-right text-[color:var(--text)]">{joined}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[color:var(--text-mute)]">Objets</dt>
              <dd className="text-right text-[color:var(--text)]">{inventory?.length ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[color:var(--text-mute)]">Matchs favoris</dt>
              <dd className="text-right text-[color:var(--text)]">{favorites.length}</dd>
            </div>
          </dl>

          {/* Liaison OAuth (recommandé) — identité vérifiée pour les drops */}
          <div className="mt-5 space-y-2 border-t border-line pt-4">
            <p className="hud-label text-[9px]">Comptes vérifiés (OAuth)</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => linkOAuth('twitch')}
                className="border-2 px-2 py-1.5 font-mono text-[10px] font-bold uppercase tracking-hud transition-colors"
                style={twitch ? { borderColor: 'var(--signal-ok)', color: 'var(--signal-ok)' } : { borderColor: 'var(--line-strong)', color: 'var(--text-dim)' }}
              >
                {twitch ? '✓ Twitch' : 'Connecter Twitch'}
              </button>
              <button
                type="button"
                onClick={() => linkOAuth('discord')}
                className="border-2 px-2 py-1.5 font-mono text-[10px] font-bold uppercase tracking-hud transition-colors"
                style={discord ? { borderColor: 'var(--signal-ok)', color: 'var(--signal-ok)' } : { borderColor: 'var(--line-strong)', color: 'var(--text-dim)' }}
              >
                {discord ? '✓ Discord' : 'Connecter Discord'}
              </button>
            </div>
          </div>

          {/* Liens manuels (repli si OAuth non configuré) — drops auto */}
          <form onSubmit={saveLinks} className="mt-5 space-y-3 border-t border-line pt-4">
            <p className="hud-label text-[9px]">…ou saisir à la main</p>
            <input
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
              placeholder="Discord (pseudo#0000)"
              className="w-full border border-line-strong bg-base-900/70 px-2.5 py-1.5 font-mono text-xs text-[color:var(--text)] placeholder:text-[color:var(--text-mute)] focus:border-accent focus:outline-none"
            />
            <input
              value={twitch}
              onChange={(e) => setTwitch(e.target.value)}
              placeholder="Twitch (login)"
              className="w-full border border-line-strong bg-base-900/70 px-2.5 py-1.5 font-mono text-xs text-[color:var(--text)] placeholder:text-[color:var(--text-mute)] focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={savingLinks}
              className="w-full border-2 border-accent px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-hud text-accent transition-colors hover:bg-accent hover:text-[color:var(--paper)] disabled:opacity-50"
            >
              {savingLinks ? '…' : 'Enregistrer'}
            </button>
            {linksMsg && <p className="font-mono text-[10px] leading-relaxed text-[color:var(--text-dim)]">{linksMsg}</p>}
          </form>
        </div>

        {/* ── Inventaire + favoris ── */}
        <div className="space-y-6">
          <div>
            <p className="hud-label mb-3 text-[10px]">[ Inventaire ]</p>
            {inventory === null ? (
              <p className="font-mono text-sm text-[color:var(--text-mute)]">Chargement…</p>
            ) : inventory.length === 0 ? (
              <HudFrame tone="dim" className="cut-panel">
                <p className="p-5 font-mono text-sm text-[color:var(--text-dim)]">
                  <span className="text-accent">&gt;</span> Vide pour l'instant. Les objets (tickets, cartouches, objets
                  spéciaux) arrivent via les drops Twitch/Discord — lie tes comptes ci-contre pour les recevoir.
                </p>
              </HudFrame>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {inventory.map((item) => {
                  // Ticket de match : rendu réel via les paramètres du Studio Match.
                  const tm = item.kind === 'ticket' && item.matchId ? matches.find((m) => m.id === item.matchId) : null;
                  if (tm) {
                    const tag = games.find((g) => g.id === tm.gameId)?.tag ?? '—';
                    return (
                      <div key={item.id} className="ticket-tilt col-span-2 flex justify-center overflow-visible py-2 sm:col-span-3">
                        <div className="ticket-tilt-card">
                          <MatchTicketCard
                            match={{ id: tm.id, opponentName: tm.opponent.name, dateISO: tm.dateISO, competition: tm.competition, status: tm.status, score: tm.score, streamUrl: tm.streamUrl, vodUrl: tm.vodUrl }}
                            gameTag={tag}
                            ticket={tm.ticket}
                          />
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={item.id} className="cut-panel panel-concrete border-2 border-line-strong p-3 shadow-ink-sm">
                      {item.image && (
                        <img src={item.image} alt="" className="mb-2 aspect-square w-full border border-line object-cover" />
                      )}
                      <span className="inline-block border border-line-strong px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-hud text-accent">
                        {KIND_LABEL[item.kind]}
                      </span>
                      <p className="mt-1.5 hud-title text-sm font-bold leading-tight">{item.name}</p>
                      {item.description && (
                        <p className="mt-1 font-mono text-[10px] leading-snug text-[color:var(--text-mute)]">{item.description}</p>
                      )}
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-block border border-line-strong px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-hud text-accent transition-colors hover:border-accent"
                        >
                          ▶ Voir le clip
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <p className="hud-label mb-3 text-[10px]">[ Matchs favoris ]</p>
            {favoriteMatches.length === 0 ? (
              <HudFrame tone="dim" className="cut-panel">
                <p className="p-5 font-mono text-sm text-[color:var(--text-dim)]">
                  <span className="text-accent">&gt;</span> Aucun match favori — marque-en depuis le{' '}
                  <a href="/calendrier" className="text-accent hover:underline">calendrier</a>.
                </p>
              </HudFrame>
            ) : (
              <ul className="divide-y divide-[color:var(--line)] border-2 border-line-strong">
                {favoriteMatches.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-4 bg-base-800/40 p-3 font-mono text-sm">
                    <span className="text-[color:var(--text-mute)]">{formatDate(m.dateISO)}</span>
                    <span className="flex-1 truncate text-[color:var(--text-dim)]">vs {m.opponent.name}</span>
                    <button
                      type="button"
                      onClick={() => unfavorite(m.id)}
                      className="shrink-0 font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)] hover:text-accent"
                    >
                      ★ retirer
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
