import type { LobbyEntry, PointRule, ReseedMode, TournamentLobby, TournamentTeam } from '@/types';

/**
 * Phase de groupes façon THE FINALS : un lobby oppose N équipes et c'est le
 * PLACEMENT qui rapporte des points, cumulés de round en round.
 *
 * Volontairement séparé de `bracket.ts`, qui ne gère que du 1v1 : les deux
 * phases d'un tournoi ne partagent ni structure ni règles.
 */

const uid = () => crypto.randomUUID();

/** Points d'un placement selon le barème. Hors barème → 0. */
export function pointsFor(rules: PointRule[], placement: number): number {
  return rules.find((r) => r.placement === placement)?.points ?? 0;
}

/** Les équipes réellement en lice (les disqualifiées sortent définitivement). */
export function activeTeams(teams: TournamentTeam[]): TournamentTeam[] {
  return teams.filter((t) => !t.disqualified);
}

/* ── Classement cumulé ───────────────────────────────────────────── */

export interface Standing {
  team: TournamentTeam;
  points: number;
  played: number;
  /** Nombre de premières places — sert à départager. */
  wins: number;
  dnf: number;
  /** Placements round par round, pour la recomposition par classement. */
  placements: number[];
}

/**
 * Classement de la phase de groupes, cumulé sur tous les rounds joués.
 * Toujours recalculé depuis les saisies : jamais stocké, donc jamais
 * désynchronisé des résultats.
 */
export function standings(
  teams: TournamentTeam[],
  lobbies: TournamentLobby[],
  upToRound?: number,
): Standing[] {
  const rows = new Map<string, Standing>();
  for (const t of teams) {
    rows.set(t.id, { team: t, points: 0, played: 0, wins: 0, dnf: 0, placements: [] });
  }

  for (const lob of lobbies) {
    if (upToRound != null && lob.round > upToRound) continue;
    for (const e of lob.entries) {
      const r = rows.get(e.teamId);
      if (!r) continue;
      if (e.placement == null && !e.dnf) continue;
      r.played += 1;
      r.points += e.points;
      if (e.dnf) r.dnf += 1;
      if (e.placement === 1) r.wins += 1;
      if (e.placement != null) r.placements.push(e.placement);
    }
  }

  // Points, puis nombre de victoires, puis meilleur placement moyen.
  return [...rows.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    const avg = (x: Standing) => (x.placements.length ? x.placements.reduce((s, p) => s + p, 0) / x.placements.length : 99);
    return avg(a) - avg(b);
  });
}

/* ── Composition des lobbies ─────────────────────────────────────── */

/** Découpe une liste ordonnée en lobbies de `size` équipes. */
function chunk(list: TournamentTeam[], size: number): TournamentTeam[][] {
  const out: TournamentTeam[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

/** Qui a déjà affronté qui, d'après les lobbies joués. */
function metBefore(lobbies: TournamentLobby[]): Map<string, Set<string>> {
  const met = new Map<string, Set<string>>();
  const add = (a: string, b: string) => {
    if (!met.has(a)) met.set(a, new Set());
    met.get(a)!.add(b);
  };
  for (const lob of lobbies) {
    const ids = lob.entries.map((e) => e.teamId);
    for (const a of ids) for (const b of ids) if (a !== b) add(a, b);
  }
  return met;
}

/**
 * Tirage qui cherche à maximiser le nombre d'adversaires DIFFÉRENTS :
 * on part d'un ordre aléatoire et, pour chaque lobby, on complète avec les
 * équipes les moins déjà croisées. Heuristique gloutonne — pas un optimum,
 * mais elle évite les répétitions flagrantes.
 */
function drawAvoidingRepeats(pool: TournamentTeam[], size: number, lobbies: TournamentLobby[]): TournamentTeam[][] {
  const met = metBefore(lobbies);
  const rest = [...pool].sort(() => Math.random() - 0.5);
  const out: TournamentTeam[][] = [];

  while (rest.length) {
    const group: TournamentTeam[] = [rest.shift()!];
    while (group.length < size && rest.length) {
      // On prend l'équipe qui a le moins déjà affronté ce groupe.
      let best = 0;
      let bestScore = Infinity;
      rest.forEach((cand, i) => {
        const score = group.reduce((n, g) => n + (met.get(g.id)?.has(cand.id) ? 1 : 0), 0);
        if (score < bestScore) {
          bestScore = score;
          best = i;
        }
      });
      group.push(rest.splice(best, 1)[0]);
    }
    out.push(group);
  }
  return out;
}

/**
 * Compose les lobbies d'un round.
 * - round 1 : serpentin par tête de série, pour répartir les favoris
 * - keep    : on rejoue la composition du round précédent
 * - by_rank : par classement cumulé (1ers ensemble, 2es ensemble…)
 * - random  : tirage en évitant les adversaires déjà rencontrés
 */
export function composeRound(
  tournamentId: string,
  teams: TournamentTeam[],
  lobbies: TournamentLobby[],
  round: number,
  size: number,
  mode: ReseedMode,
): TournamentLobby[] {
  const pool = activeTeams(teams);
  if (pool.length < 2) return [];

  let groups: TournamentTeam[][];

  if (round <= 1) {
    const sorted = [...pool].sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));
    const count = Math.ceil(sorted.length / size);
    groups = Array.from({ length: count }, () => [] as TournamentTeam[]);
    // Serpentin : 1er lobby reçoit la 1re tête de série, le dernier la 4e…
    sorted.forEach((t, i) => {
      const row = Math.floor(i / count);
      const col = i % count;
      groups[row % 2 === 0 ? col : count - 1 - col].push(t);
    });
  } else if (mode === 'keep') {
    const prev = lobbies.filter((l) => l.round === round - 1).sort((a, b) => a.position - b.position);
    groups = prev.map((l) =>
      l.entries.map((e) => pool.find((t) => t.id === e.teamId)).filter((t): t is TournamentTeam => !!t),
    );
  } else if (mode === 'random') {
    groups = drawAvoidingRepeats(pool, size, lobbies);
  } else {
    // by_rank : le classement cumulé décide, par tranches de `size`.
    const ranked = standings(pool, lobbies, round - 1).map((r) => r.team);
    groups = chunk(ranked, size);
  }

  return groups
    .filter((g) => g.length > 0)
    .map((g, i) => ({
      id: uid(),
      tournamentId,
      round,
      position: i + 1,
      label: `Lobby ${String.fromCharCode(65 + i)}`,
      status: 'pending' as const,
      entries: g.map((t, j) => ({
        id: uid(),
        lobbyId: '',
        teamId: t.id,
        points: 0,
        dnf: false,
        sortOrder: j,
      })),
    }));
}

/** Rattache les participations à leur lobby une fois les ids connus. */
export function linkEntries(lobbies: TournamentLobby[]): LobbyEntry[] {
  return lobbies.flatMap((l) => l.entries.map((e) => ({ ...e, lobbyId: l.id })));
}

/**
 * Recalcule les points d'un lobby depuis les placements saisis.
 * Une équipe en DNF ne marque rien, quel que soit son placement.
 */
export function scoreLobby(entries: LobbyEntry[], rules: PointRule[]): LobbyEntry[] {
  return entries.map((e) => ({
    ...e,
    points: e.dnf || e.placement == null ? 0 : pointsFor(rules, e.placement),
  }));
}
