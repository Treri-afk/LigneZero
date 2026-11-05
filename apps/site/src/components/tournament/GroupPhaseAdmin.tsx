import { useState } from 'react';
import type { PointRule, TournamentFull, TournamentLobby } from '@/types';
import { RESEED_MODES } from '@/types';
import { activeTeams, scoreLobby, standings } from '@/lib/lobbies';

/**
 * Pilotage de la phase de groupes « The Finals » côté organisateur.
 *
 * Un lobby par bloc : on saisit le placement de chaque équipe, les points
 * se calculent depuis le barème, et le classement cumulé se met à jour.
 * Les playoffs 1v1 ne sont pas concernés et restent gérés à part.
 */
export function GroupPhaseAdmin({
  t,
  busy,
  qualified,
  onSaveLobby,
  onGenerateRound,
  onDeleteRound,
  onToggleDq,
  onArbitrate,
}: {
  t: TournamentFull;
  busy: boolean;
  /** Nombre de places qualificatives — trace la ligne de coupure. */
  qualified: number;
  onSaveLobby: (lobby: TournamentLobby) => void;
  onGenerateRound: (round: number) => void;
  onDeleteRound: (round: number) => void;
  onToggleDq: (teamId: string, dq: boolean) => void;
  onArbitrate: (teamId: string, order: number, note: string) => void;
}) {
  const rounds = [...new Set(t.lobbies.map((l) => l.round))].sort((a, b) => a - b);
  const lastRound = rounds.length ? rounds[rounds.length - 1] : 0;
  const nextRound = lastRound + 1;
  const table = standings(activeTeams(t.teams), t.lobbies);
  const mode = RESEED_MODES.find((m) => m.id === t.reseedMode);

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-3 border-2 border-line-strong bg-base-900/55 p-4">
        <span className="font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)]">
          {activeTeams(t.teams).length} équipes · lobbies de {t.teamsPerLobby} · {t.groupRounds} rounds prévus
        </span>
        <span className="font-mono text-[10px] text-[color:var(--text-dim)]">{mode?.label}</span>
        <div className="flex-1" />
        {nextRound <= t.groupRounds && (
          <button
            type="button"
            disabled={busy || activeTeams(t.teams).length < 2}
            onClick={() => onGenerateRound(nextRound)}
            className="border-2 border-accent px-4 py-2 font-mono text-xs font-bold uppercase tracking-hud text-accent disabled:opacity-40"
          >
            Générer le round {nextRound}
          </button>
        )}
      </div>

      {/* Classement cumulé */}
      {table.some((r) => r.played > 0) && (
        <div className="mt-6">
          <p className="hud-label mb-3 text-[11px]">[ Classement cumulé ]</p>
          {table.some((r) => r.tied) && (
            <p className="mb-3 border-2 border-accent px-3 py-2 font-mono text-[11px] text-accent">
              ⚠ Égalité non tranchée automatiquement — les équipes marquées « = » sont
              départagées par ton arbitrage, ou à défaut par l'ordre de saisie.
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-2 border-line-strong">
              <thead>
                <tr className="bg-base-800 font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-mute)]">
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Équipe</th>
                  <th className="px-2 py-2 text-right">Pts</th>
                  <th className="px-2 py-2 text-right">J</th>
                  <th className="px-2 py-2 text-right" title="Meilleur placement obtenu">Best</th>
                  <th className="px-2 py-2 text-right">1ers</th>
                  <th className="px-2 py-2 text-right" title="Placement au dernier round joué">Dern.</th>
                  <th className="px-2 py-2 text-right">DNF</th>
                  <th className="px-2 py-2 text-right">Arbitrage</th>
                  <th className="px-2 py-2 text-right">DQ</th>
                </tr>
              </thead>
              <tbody>
                {table.map((r, i) => {
                  // Trait rouge sous la dernière place qualificative.
                  const cut = qualified > 0 && i + 1 === qualified && table.length > qualified;
                  return (
                    <tr
                      key={r.team.id}
                      className="border-t border-line-strong"
                      style={cut ? { borderBottom: '2px solid var(--accent)' } : undefined}
                    >
                      <td className="px-3 py-2 font-display text-sm font-bold" style={{ color: i === 0 ? 'var(--accent)' : 'inherit' }}>{i + 1}</td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {r.team.name}
                        {r.tied && <span className="ml-2 text-accent" title="Égalité non tranchée automatiquement">=</span>}
                        {r.team.tiebreakNote && (
                          <span className="ml-2 text-[10px] text-[color:var(--text-mute)]" title={r.team.tiebreakNote}>⚖</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-right font-display text-base font-bold text-accent">{r.points}</td>
                      <td className="px-2 py-2 text-right font-mono text-xs text-[color:var(--text-dim)]">{r.played}</td>
                      <td className="px-2 py-2 text-right font-mono text-xs">{r.best === 99 ? '' : r.best}</td>
                      <td className="px-2 py-2 text-right font-mono text-xs">{r.wins}</td>
                      <td className="px-2 py-2 text-right font-mono text-xs text-[color:var(--text-dim)]">{r.lastPlacement === 99 ? '' : r.lastPlacement}</td>
                      <td className="px-2 py-2 text-right font-mono text-xs text-[color:var(--text-mute)]">{r.dnf || ''}</td>
                      <td className="px-2 py-2 text-right">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            const cur = r.team.tiebreakOrder ?? 0;
                            const raw = prompt(
                              `Arbitrage pour ${r.team.name}\n\n`
                                + `Valeur plus BASSE = mieux classé (0 = aucun arbitrage).\n`
                                + `Ne s'applique qu'en cas d'égalité parfaite.`,
                              String(cur),
                            );
                            if (raw == null) return;
                            const order = Number(raw) || 0;
                            const note = order === 0 ? '' : (prompt('Raison (affichée publiquement) :', r.team.tiebreakNote ?? '') ?? '');
                            onArbitrate(r.team.id, order, note);
                          }}
                          className="font-mono text-[10px] uppercase"
                          style={{ color: (r.team.tiebreakOrder ?? 0) !== 0 ? 'var(--accent)' : 'var(--text-mute)' }}
                          title={r.team.tiebreakNote ?? 'Départager manuellement'}
                        >
                          {(r.team.tiebreakOrder ?? 0) !== 0 ? `± ${r.team.tiebreakOrder}` : 'régler'}
                        </button>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            if (confirm(`Disqualifier ${r.team.name} du tournoi entier ?`)) onToggleDq(r.team.id, true);
                          }}
                          className="font-mono text-[10px] uppercase text-accent"
                          title="Exclure du tournoi entier"
                        >
                          exclure
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Équipes exclues : réintégrables */}
          {t.teams.some((x) => x.disqualified) && (
            <p className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[10px] text-[color:var(--text-mute)]">
              Exclues :
              {t.teams.filter((x) => x.disqualified).map((x) => (
                <button
                  key={x.id}
                  type="button"
                  disabled={busy}
                  onClick={() => onToggleDq(x.id, false)}
                  className="border border-line-strong px-2 py-0.5 uppercase hover:border-accent hover:text-accent"
                  title="Réintégrer"
                >
                  {x.name} ↩
                </button>
              ))}
            </p>
          )}
        </div>
      )}

      {/* Rounds */}
      {rounds.map((round) => (
        <RoundBlock
          key={round}
          t={t}
          round={round}
          busy={busy}
          onSaveLobby={onSaveLobby}
          onDeleteRound={onDeleteRound}
        />
      ))}

      {rounds.length === 0 && (
        <p className="mt-5 border-2 border-dashed border-line-strong px-4 py-8 text-center font-mono text-xs text-[color:var(--text-mute)]">
          &gt; aucun round — génère le round 1
        </p>
      )}
    </div>
  );
}

function RoundBlock({
  t,
  round,
  busy,
  onSaveLobby,
  onDeleteRound,
}: {
  t: TournamentFull;
  round: number;
  busy: boolean;
  onSaveLobby: (l: TournamentLobby) => void;
  onDeleteRound: (round: number) => void;
}) {
  const list = t.lobbies.filter((l) => l.round === round).sort((a, b) => a.position - b.position);
  return (
    <div className="mt-8">
      <p className="hud-label mb-3 flex items-center gap-3 text-[11px]">
        [ Round {round} ]
        <span className="h-px flex-1 bg-line-strong" />
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (confirm(`Supprimer le round ${round} et ses résultats ?`)) onDeleteRound(round);
          }}
          className="font-mono text-[10px] uppercase text-accent"
        >
          supprimer
        </button>
      </p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {list.map((l) => (
          <LobbyCard key={l.id} lobby={l} t={t} busy={busy} onSave={onSaveLobby} />
        ))}
      </div>
    </div>
  );
}

function LobbyCard({
  lobby,
  t,
  busy,
  onSave,
}: {
  lobby: TournamentLobby;
  t: TournamentFull;
  busy: boolean;
  onSave: (l: TournamentLobby) => void;
}) {
  const [entries, setEntries] = useState(lobby.entries);
  const name = (id: string) => t.teams.find((x) => x.id === id)?.name ?? '—';

  const set = (id: string, patch: Partial<(typeof entries)[number]>) =>
    setEntries((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  // Deux équipes au même placement fausseraient le classement : on bloque.
  const placements = entries.filter((e) => !e.dnf && e.placement != null).map((e) => e.placement);
  const dupe = new Set(placements).size !== placements.length;

  const save = () => onSave({ ...lobby, entries: scoreLobby(entries, t.pointRules as PointRule[]), status: 'finished' });

  return (
    <div className="border-2 border-line-strong bg-base-900/55">
      <div className="flex items-center justify-between border-b border-line-strong px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-hud text-[color:var(--text-dim)]">{lobby.label ?? `Lobby ${lobby.position}`}</span>
        <span className="font-mono text-[9px] uppercase tracking-hud text-[color:var(--text-mute)]">
          {lobby.status === 'finished' ? 'terminé' : 'à jouer'}
        </span>
      </div>

      <ul>
        {[...entries].sort((a, b) => (a.placement ?? 99) - (b.placement ?? 99)).map((e) => (
          <li key={e.id} className="flex items-center gap-2 border-b border-line-strong px-3 py-2 last:border-b-0">
            <select
              className="w-14 border border-line-strong bg-base-900 px-1 py-1 text-center font-mono text-xs"
              value={e.placement ?? ''}
              onChange={(ev) => set(e.id, { placement: ev.target.value ? Number(ev.target.value) : undefined })}
            >
              <option value="">–</option>
              {Array.from({ length: entries.length }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className={`min-w-0 flex-1 truncate font-mono text-xs ${e.dnf ? 'line-through opacity-50' : ''}`}>
              {name(e.teamId)}
            </span>
            <span className="w-10 text-right font-display text-sm font-bold text-accent">
              {e.dnf || e.placement == null
                ? 0
                : (t.pointRules as PointRule[]).find((r) => r.placement === e.placement)?.points ?? 0}
            </span>
            <button
              type="button"
              onClick={() => set(e.id, { dnf: !e.dnf })}
              className="shrink-0 border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-hud"
              style={{
                color: e.dnf ? 'var(--ink)' : 'var(--text-mute)',
                background: e.dnf ? 'var(--accent)' : 'transparent',
                borderColor: e.dnf ? 'var(--accent)' : 'var(--line-strong)',
              }}
              title="Abandon sur ce round"
            >
              dnf
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between px-3 py-2">
        {dupe ? (
          <span className="font-mono text-[9px] text-accent">placements en double</span>
        ) : (
          <span />
        )}
        <button
          type="button"
          disabled={busy || dupe}
          onClick={save}
          className="border border-accent px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-hud text-accent disabled:opacity-30"
        >
          enregistrer
        </button>
      </div>
    </div>
  );
}
