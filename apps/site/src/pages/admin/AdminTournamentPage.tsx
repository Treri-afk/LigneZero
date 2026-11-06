import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDocTitle } from '@/hooks/useDocTitle';
import { AdminGuard } from './AdminGuard';
import { slugify } from './AdminTournamentsPage';
import { db } from '@/lib/supabase';
import { uploadImage } from '@/lib/storage';
import { applyResult, buildPlayoffShell, generateMatches, seedOrder, seedPlayoffs } from '@/lib/bracket';
import { EditableBracket } from '@/components/tournament/EditableBracket';
import { EditableGroups } from '@/components/tournament/EditableGroups';
import { GroupPhaseAdmin } from '@/components/tournament/GroupPhaseAdmin';
import { composeRound, linkEntries, seedPlayoffsFromLobbies } from '@/lib/lobbies';
import type { PointRule, Tournament, TournamentFull, TournamentLobby, TournamentMatch, TournamentStatus, TournamentTeam } from '@/types';
import { RESEED_MODES, TOURNAMENT_FORMATS } from '@/types';

const STATUSES: TournamentStatus[] = ['draft', 'registration', 'running', 'finished'];

const field =
  'w-full border-2 border-line-strong bg-base-900 px-3 py-2 font-mono text-sm outline-none focus:border-accent';
const label = 'mb-1 block font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)]';
const btn =
  'border-2 px-4 py-2 font-mono text-xs font-bold uppercase tracking-hud transition-opacity disabled:opacity-40';

export default function AdminTournamentPage() {
  return (
    <AdminGuard>
      <Inner />
    </AdminGuard>
  );
}

function Inner() {
  const { slug = '' } = useParams();
  const [t, setT] = useState<TournamentFull | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useDocTitle(t ? `Admin · ${t.name}` : 'Admin · Tournoi');

  const load = useCallback(
    () =>
      db
        .getTournament(slug)
        .then(setT)
        .catch((e) => setError(e instanceof Error ? e.message : 'Erreur')),
    [slug],
  );
  useEffect(() => {
    load();
  }, [load]);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 3000);
  };
  const run = async (fn: () => Promise<void>, note?: string) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await load();
      if (note) flash(note);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  if (error && !t) return <Wrap><p className="font-mono text-sm text-accent">{error}</p></Wrap>;
  if (!t) return <Wrap><p className="font-mono text-sm text-[color:var(--text-mute)]">&gt; chargement…</p></Wrap>;

  const set = <K extends keyof Tournament>(k: K, v: Tournament[K]) => setT({ ...t, [k]: v });

  return (
    <Wrap>
      <Link to="/admin/tournois" className="mb-4 inline-block font-mono text-xs uppercase tracking-hud text-[color:var(--text-dim)] hover:text-accent">
        ← tous les tournois
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="hud-label mb-2 text-[11px] text-accent">[ ADMIN ]</p>
          <h1 className="hud-title text-3xl font-bold leading-none">{t.name}</h1>
        </div>
        <Link to={`/tournoi/${t.slug}`} className="font-mono text-xs uppercase tracking-hud text-accent hover:underline">
          voir la page publique ↗
        </Link>
      </div>

      {error && <p className="mt-4 border-2 border-accent px-3 py-2 font-mono text-xs text-accent">{error}</p>}
      {msg && <p className="mt-4 font-mono text-xs" style={{ color: 'var(--signal-ok)' }}>{msg}</p>}

      {/* ── Informations ── */}
      <Section title="Informations">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <L t="Nom"><input className={field} value={t.name} onChange={(e) => set('name', e.target.value)} /></L>
          <L t="Slug (URL)"><input className={field} value={t.slug} onChange={(e) => set('slug', slugify(e.target.value))} /></L>
          <L t="Format">
            <select className={field} value={t.format} onChange={(e) => set('format', e.target.value as Tournament['format'])}>
              {TOURNAMENT_FORMATS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </L>
          <L t="Statut">
            <select className={field} value={t.status} onChange={(e) => set('status', e.target.value as TournamentStatus)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </L>
          {hasLobbyPhase(t.format) && (
            <>
              <L t="Équipes qualifiées pour la phase finale">
                <input
                  type="number"
                  min={2}
                  max={64}
                  className={field}
                  value={qualifiedCount(t)}
                  // Stocké en groupCount × qualifiersPerGroup (colonnes héritées
                  // des poules 1v1) : on force groupCount à 1 pour que le champ
                  // affiché soit exactement le nombre de qualifiés.
                  onChange={(e) => {
                    const n = Math.max(2, Number(e.target.value) || 2);
                    set('groupCount', 1);
                    set('qualifiersPerGroup', n);
                  }}
                />
              </L>
              <L t="Format de la phase finale">
                <select className={field} value={t.playoffFormat}
                  onChange={(e) => set('playoffFormat', e.target.value as Tournament['playoffFormat'])}>
                  <option value="single_elim">Élimination simple</option>
                  <option value="double_elim">Élimination double</option>
                </select>
              </L>
              <div className="sm:col-span-2 font-mono text-[10px] leading-relaxed text-[color:var(--text-mute)]">
                → arbre de {bracketSize(qualifiedCount(t))} places ·{' '}
                {Math.ceil(t.teams.length / Math.max(1, t.teamsPerLobby))} lobbies par round
              </div>
            </>
          )}
          {hasLobbyPhase(t.format) && (
            <>
              <L t="Rounds de phase de groupes">
                <input type="number" min={1} max={20} className={field} value={t.groupRounds}
                  onChange={(e) => set('groupRounds', Number(e.target.value) || 1)} />
              </L>
              <L t="Équipes par lobby">
                <input type="number" min={2} max={12} className={field} value={t.teamsPerLobby}
                  onChange={(e) => set('teamsPerLobby', Number(e.target.value) || 2)} />
              </L>
              <div className="sm:col-span-2">
                <L t="Recomposition des lobbies entre les rounds">
                  <select className={field} value={t.reseedMode}
                    onChange={(e) => set('reseedMode', e.target.value as Tournament['reseedMode'])}>
                    {RESEED_MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                </L>
                <p className="mt-1 font-mono text-[10px] text-[color:var(--text-mute)]">
                  {RESEED_MODES.find((m) => m.id === t.reseedMode)?.hint}
                </p>
              </div>
              <div className="sm:col-span-2">
                <PointRulesEditor rules={t.pointRules} size={t.teamsPerLobby} onChange={(r) => set('pointRules', r)} />
              </div>
            </>
          )}
          <L t="Dotation"><input className={field} value={t.prize ?? ''} onChange={(e) => set('prize', e.target.value)} placeholder="500 €" /></L>
          <L t="Début">
            <input
              type="date"
              className={field}
              value={t.startsAt ? t.startsAt.slice(0, 10) : ''}
              onChange={(e) => set('startsAt', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
            />
          </L>
          <div className="sm:col-span-2">
            <L t="Description"><textarea className={`${field} min-h-[70px]`} value={t.description ?? ''} onChange={(e) => set('description', e.target.value)} /></L>
          </div>
          <div className="sm:col-span-2">
            <L t="Règlement"><textarea className={`${field} min-h-[110px]`} value={t.rules ?? ''} onChange={(e) => set('rules', e.target.value)} /></L>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            disabled={busy}
            className={`${btn} border-accent bg-accent text-[color:var(--ink)]`}
            onClick={() => run(() => db.upsertTournament(t), 'Enregistré')}
          >
            Enregistrer
          </button>
          {t.status === 'draft' && (
            <span className="font-mono text-[10px] text-[color:var(--text-mute)]">
              brouillon — invisible du public tant que le statut n'est pas changé
            </span>
          )}
        </div>
      </Section>

      <TeamsSection t={t} busy={busy} run={run} />
      {hasLobbyPhase(t.format) && <LobbySection t={t} busy={busy} run={run} />}
      <BracketSection t={t} busy={busy} run={run} />
    </Wrap>
  );
}

/* ── Équipes ─────────────────────────────────────────────────────── */
function TeamsSection({
  t,
  busy,
  run,
}: {
  t: TournamentFull;
  busy: boolean;
  run: (fn: () => Promise<void>, note?: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');

  const add = () => {
    const n = name.trim();
    if (!n) return;
    return run(async () => {
      await db.upsertTournamentTeam({
        id: '',
        tournamentId: t.id,
        name: n,
        tag: tag.trim() || undefined,
        // Seed automatique = ordre d'arrivée ; modifiable ensuite.
        seed: t.teams.length + 1,
        status: 'registered',
        disqualified: false,
        tiebreakOrder: 0,
        players: [],
      });
      setName('');
      setTag('');
    }, 'Équipe ajoutée');
  };

  return (
    <Section title={`Équipes (${t.teams.length})`}>
      <div className="flex flex-wrap items-end gap-3">
        <L t="Nom de l'équipe"><input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="NEMESIS" /></L>
        <L t="Tag"><input className={`${field} w-24`} value={tag} onChange={(e) => setTag(e.target.value.toUpperCase())} placeholder="NMS" maxLength={4} /></L>
        <button type="button" disabled={busy || !name.trim()} onClick={add} className={`${btn} border-line-strong text-[color:var(--text)]`}>
          + Ajouter
        </button>
      </div>

      <div className="mt-5 space-y-2">
        {t.teams.map((team) => (
          <TeamRow key={team.id} team={team} busy={busy} run={run} />
        ))}
      </div>
    </Section>
  );
}

function TeamRow({
  team,
  busy,
  run,
}: {
  team: TournamentTeam;
  busy: boolean;
  run: (fn: () => Promise<void>, note?: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pseudo, setPseudo] = useState('');

  return (
    <div className="border-2 border-line-strong bg-base-900/55">
      <div className="flex flex-wrap items-center gap-3 px-3 py-2">
        <input
          type="number"
          className="w-14 border border-line-strong bg-base-900 px-2 py-1 font-mono text-xs"
          value={team.seed ?? ''}
          onChange={(e) => run(() => db.upsertTournamentTeam({ ...team, seed: Number(e.target.value) || undefined }))}
          title="Tête de série"
        />

        {/* Logo : aperçu cliquable. Sans logo, la pastille de couleur sert de
            repli partout (bracket, lobbies, fiches) — d'où le sélecteur à côté. */}
        <label className="shrink-0 cursor-pointer" title={team.logoUrl ? 'Changer le logo' : 'Ajouter un logo'}>
          {team.logoUrl ? (
            <img src={team.logoUrl} alt="" className="h-8 w-8 border border-line-strong object-contain" />
          ) : (
            <span
              className="flex h-8 w-8 items-center justify-center border border-dashed border-line-strong font-mono text-[9px] text-[color:var(--text-mute)]"
            >
              +
            </span>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file) return;
              run(async () => {
                const url = await uploadImage(file, 'teams');
                await db.upsertTournamentTeam({ ...team, logoUrl: url });
              }, 'Logo mis à jour');
            }}
          />
        </label>

        <input
          type="color"
          className="h-8 w-8 shrink-0 cursor-pointer border border-line-strong bg-transparent"
          value={team.color ?? '#f23127'}
          onChange={(e) => run(() => db.upsertTournamentTeam({ ...team, color: e.target.value }))}
          title="Couleur de l'équipe"
        />

        <span className="min-w-0 flex-1 truncate font-mono text-sm">{team.name}</span>
        {team.tag && <span className="font-mono text-[10px] text-[color:var(--text-mute)]">{team.tag}</span>}
        {team.logoUrl && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => db.upsertTournamentTeam({ ...team, logoUrl: undefined }), 'Logo retiré')}
            className="font-mono text-[10px] uppercase text-[color:var(--text-mute)] hover:text-accent"
          >
            retirer logo
          </button>
        )}
        <button type="button" onClick={() => setOpen(!open)} className="font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-dim)] hover:text-accent">
          {team.players.length} joueur{team.players.length > 1 ? 's' : ''} {open ? '▲' : '▼'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (confirm(`Supprimer ${team.name} ?`)) run(() => db.deleteTournamentTeam(team.id), 'Équipe supprimée');
          }}
          className="font-mono text-[10px] uppercase tracking-hud text-accent"
        >
          suppr.
        </button>
      </div>

      {open && (
        <div className="border-t border-line-strong px-3 py-3">
          <ul className="mb-3 space-y-1">
            {team.players.map((p) => (
              <li key={p.id} className="flex items-center gap-2 font-mono text-xs text-[color:var(--text-dim)]">
                {p.isCaptain && <span className="text-accent">★</span>}
                <span className="flex-1">{p.pseudo}</span>
                <button type="button" onClick={() => run(() => db.deleteTournamentPlayer(p.id))} className="text-accent">×</button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              className={`${field} flex-1`}
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder="pseudo du joueur"
            />
            <button
              type="button"
              disabled={busy || !pseudo.trim()}
              onClick={() =>
                run(async () => {
                  await db.upsertTournamentPlayer({
                    id: '',
                    teamId: team.id,
                    pseudo: pseudo.trim(),
                    isCaptain: team.players.length === 0,
                    sortOrder: team.players.length + 1,
                  });
                  setPseudo('');
                })
              }
              className={`${btn} border-line-strong`}
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Arbre et scores, en visuel ──────────────────────────────────── */
function BracketSection({
  t,
  busy,
  run,
}: {
  t: TournamentFull;
  busy: boolean;
  run: (fn: () => Promise<void>, note?: string) => Promise<void>;
}) {
  const generate = () =>
    run(async () => {
      // Régénérer repart de zéro : les scores déjà saisis disparaissent.
      await db.deleteTournamentMatches(t.id);
      // Pour un format à lobbies, la phase de groupes est gérée au-dessus :
      // on ne génère ici que l'arbre de playoffs, en 1v1.
      const list = hasLobbyPhase(t.format)
        ? buildPlayoffShell(t.id, qualifiedCount(t), t.playoffFormat)
        : generateMatches(t.id, t.format, t.teams, {
            groupCount: t.groupCount,
            qualifiersPerGroup: t.qualifiersPerGroup,
            playoffFormat: t.playoffFormat,
          });
      await db.upsertTournamentMatches(list);
    }, 'Arbre généré');

  const score = (m: TournamentMatch, a: number, b: number) =>
    run(async () => {
      await db.upsertTournamentMatches(applyResult(t.matches, m.id, a, b));
    }, 'Résultat enregistré');

  const qualify = () =>
    run(async () => {
      // Phase à lobbies → classement par points ; poules 1v1 → classement par victoires.
      const updated = hasLobbyPhase(t.format)
        ? seedPlayoffsFromLobbies(t.matches, t.teams, t.lobbies, qualifiedCount(t), seedOrder)
        : seedPlayoffs(t.matches, t.teams, t.groupCount, t.qualifiersPerGroup);
      if (!updated.length) throw new Error('Aucun match de phase finale à remplir.');
      await db.upsertTournamentMatches(updated);
    }, 'Qualifiés placés');

  const pools = t.matches.filter((m) => m.groupLabel);
  const upper = t.matches.filter((m) => m.bracket === 'winner');
  const lower = t.matches.filter((m) => m.bracket === 'loser');
  const grand = t.matches.filter((m) => m.bracket === 'final');
  const poolsDone = pools.length > 0 && pools.every((m) => m.status === 'finished');

  return (
    <Section title={`Déroulé (${t.matches.length} matchs)`}>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy || t.teams.length < 2}
          onClick={() => {
            if (t.matches.length && !confirm('Régénérer EFFACE tous les matchs et les scores déjà saisis. Continuer ?')) return;
            generate();
          }}
          className={`${btn} border-accent text-accent`}
        >
          {t.matches.length ? 'Régénérer' : 'Générer'}
        </button>

        {(pools.length > 0 || t.lobbies.length > 0) && upper.length > 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              const done = hasLobbyPhase(t.format)
                ? t.lobbies.length > 0 && t.lobbies.every((l) => l.status === 'finished')
                : poolsDone;
              if (!done && !confirm('La phase de groupes n\u2019est pas terminée. Placer quand même les qualifiés ?')) return;
              qualify();
            }}
            className={`${btn} border-line-strong`}
            title="Place les premiers de chaque poule dans la phase finale"
          >
            Placer les qualifiés
          </button>
        )}

        <span className="font-mono text-[10px] text-[color:var(--text-mute)]">
          {t.teams.length} équipes · {TOURNAMENT_FORMATS.find((f) => f.id === t.format)?.label}
          {t.format === 'groups_bracket' && ` · finale ${t.playoffFormat === 'double_elim' ? 'double' : 'simple'}`}
        </span>
      </div>

      {t.matches.length === 0 && (
        <p className="mt-5 border-2 border-dashed border-line-strong px-4 py-8 text-center font-mono text-xs text-[color:var(--text-mute)]">
          &gt; aucun match — ajoute les équipes puis génère
        </p>
      )}

      {pools.length > 0 && (
        <EditableGroups
          matches={pools}
          teams={t.teams}
          busy={busy}
          onScore={score}
          qualifiersPerGroup={t.qualifiersPerGroup}
        />
      )}

      <EditableBracket
        matches={upper}
        teams={t.teams}
        busy={busy}
        onScore={score}
        title={lower.length ? '[ Upper bracket ]' : pools.length ? '[ Phase finale ]' : '[ Bracket ]'}
      />
      <EditableBracket matches={lower} teams={t.teams} busy={busy} onScore={score} title="[ Lower bracket ]" />
      <EditableBracket matches={grand} teams={t.teams} busy={busy} onScore={score} title="[ Grande finale ]" />

      {/* Round robin / suisse : pas d'arbre, juste la liste. */}
      {pools.length === 0 && upper.length === 0 && t.matches.length > 0 && (
        <EditableGroups
          matches={t.matches.map((m) => ({ ...m, groupLabel: m.groupLabel ?? 'unique' }))}
          teams={t.teams}
          busy={busy}
          onScore={score}
          qualifiersPerGroup={0}
        />
      )}
    </Section>
  );
}

/** Nombre de qualifiés pour la phase finale (produit des deux colonnes). */
function qualifiedCount(t: Tournament): number {
  return Math.max(2, t.groupCount * t.qualifiersPerGroup);
}

/** Taille réelle de l'arbre : puissance de 2 au-dessus du nombre de qualifiés. */
function bracketSize(n: number): number {
  return Math.max(2, 2 ** Math.ceil(Math.log2(Math.max(2, n))));
}

/** Formats dont la phase de groupes se joue en lobbies à N équipes. */
function hasLobbyPhase(format: Tournament['format']): boolean {
  return format === 'groups_bracket' || format === 'swiss';
}

/* ── Barème de points ────────────────────────────────────────────── */
function PointRulesEditor({
  rules,
  size,
  onChange,
}: {
  rules: PointRule[];
  size: number;
  onChange: (r: PointRule[]) => void;
}) {
  // Le barème suit la taille des lobbies : une ligne par place possible.
  const rows: PointRule[] = Array.from({ length: size }, (_, i) => {
    const p = i + 1;
    return { placement: p, points: rules.find((r) => r.placement === p)?.points ?? 0 };
  });

  return (
    <div>
      <span className={label}>Barème — points par placement</span>
      <div className="flex flex-wrap gap-2">
        {rows.map((r) => (
          <label key={r.placement} className="flex items-center gap-2 border-2 border-line-strong bg-base-900 px-2 py-1">
            <span className="font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)]">
              {r.placement}
              {r.placement === 1 ? 'er' : 'e'}
            </span>
            <input
              type="number"
              min={0}
              className="w-14 border border-line-strong bg-base-900 px-1 py-0.5 text-center font-mono text-xs"
              value={r.points}
              onChange={(e) =>
                onChange(rows.map((x) => (x.placement === r.placement ? { ...x, points: Number(e.target.value) || 0 } : x)))
              }
            />
          </label>
        ))}
      </div>
      <p className="mt-1 font-mono text-[10px] text-[color:var(--text-mute)]">
        Une équipe en DNF ne marque rien, quel que soit son placement.
      </p>
    </div>
  );
}

/* ── Phase de groupes en lobbies ─────────────────────────────────── */
function LobbySection({
  t,
  busy,
  run,
}: {
  t: TournamentFull;
  busy: boolean;
  run: (fn: () => Promise<void>, note?: string) => Promise<void>;
}) {
  const generate = (round: number) =>
    run(async () => {
      const lobbies = composeRound(t.id, t.teams, t.lobbies, round, t.teamsPerLobby, t.reseedMode);
      if (!lobbies.length) throw new Error('Pas assez d\u2019équipes en lice.');
      await db.upsertTournamentLobbies(lobbies);
      await db.upsertLobbyEntries(linkEntries(lobbies));
    }, `Round ${round} généré`);

  const saveLobby = (lobby: TournamentLobby) =>
    run(async () => {
      await db.upsertTournamentLobbies([lobby]);
      await db.upsertLobbyEntries(lobby.entries);
    }, 'Résultats enregistrés');

  const deleteRound = (round: number) =>
    run(() => db.deleteTournamentLobbies(t.id, round), `Round ${round} supprimé`);

  /** Arbitrage manuel : ne s'applique qu'en cas d'égalité parfaite. */
  const arbitrate = (teamId: string, order: number, note: string) =>
    run(async () => {
      const team = t.teams.find((x) => x.id === teamId);
      if (!team) return;
      await db.upsertTournamentTeam({ ...team, tiebreakOrder: order, tiebreakNote: note || undefined });
    }, 'Arbitrage enregistré');

  const toggleDq = (teamId: string, dq: boolean) =>
    run(async () => {
      const team = t.teams.find((x) => x.id === teamId);
      if (!team) return;
      await db.upsertTournamentTeam({ ...team, disqualified: dq });
    }, dq ? 'Équipe exclue' : 'Équipe réintégrée');

  return (
    <Section title={`Phase de groupes (${t.lobbies.length} lobbies)`}>
      <GroupPhaseAdmin
        t={t}
        busy={busy}
        qualified={qualifiedCount(t)}
        onArbitrate={arbitrate}
        onSaveLobby={saveLobby}
        onGenerateRound={generate}
        onDeleteRound={deleteRound}
        onToggleDq={toggleDq}
      />
    </Section>
  );
}

/* ── Habillage ───────────────────────────────────────────────────── */
function Wrap({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">{children}</div>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <p className="hud-label mb-4 flex items-center gap-3 text-[11px]">
        <span className="text-accent">[</span>
        {title}
        <span className="text-accent">]</span>
        <span className="h-px flex-1 bg-line-strong" />
      </p>
      {children}
    </section>
  );
}
function L({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={label}>{t}</span>
      {children}
    </label>
  );
}
