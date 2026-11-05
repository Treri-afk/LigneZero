import type { TournamentFormat, TournamentMatch, TournamentTeam } from '@/types';

/**
 * Génération des matchs d'un tournoi à partir des équipes et du format.
 *
 * Tout est calculé ICI, côté client, puis écrit en une fois : la génération
 * reste rejouable et lisible, sans procédure stockée à maintenir en base.
 *
 * Les identifiants sont tirés localement (crypto.randomUUID) pour pouvoir
 * câbler `nextMatchId` / `loserMatchId` AVANT l'écriture — impossible
 * autrement, puisqu'il faudrait connaître les ids générés par Postgres.
 */

const uid = () => crypto.randomUUID();

/** Base d'un match vide, à compléter. */
function blank(tournamentId: string, bracket: TournamentMatch['bracket'], round: number, position: number): TournamentMatch {
  return { id: uid(), tournamentId, bracket, round, position, status: 'pending' };
}

/**
 * Ordre de rencontre standard d'un arbre : 1v8, 4v5, 2v7, 3v6 pour 8 équipes.
 * Évite que les deux meilleures têtes de série se croisent avant la finale.
 */
export function seedOrder(size: number): number[] {
  let order = [1, 2];
  while (order.length < size) {
    const n = order.length * 2;
    const next: number[] = [];
    for (const s of order) {
      next.push(s);
      next.push(n + 1 - s);
    }
    order = next;
  }
  return order;
}

/** Puissance de 2 immédiatement supérieure ou égale. */
const pow2 = (n: number) => Math.max(2, 2 ** Math.ceil(Math.log2(Math.max(2, n))));

/**
 * Élimination simple. Les équipes absentes (bracket non plein) laissent des
 * emplacements vides : l'adversaire passe au tour suivant, à acter à la main.
 */
export function buildSingleElim(tournamentId: string, teams: TournamentTeam[]): TournamentMatch[] {
  const size = pow2(teams.length);
  const order = seedOrder(size);
  const sorted = [...teams].sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));
  const bySeed = (pos: number) => sorted[pos - 1];

  const rounds = Math.log2(size);
  const all: TournamentMatch[][] = [];

  for (let r = 1; r <= rounds; r++) {
    const count = size / 2 ** r;
    const list: TournamentMatch[] = [];
    for (let p = 1; p <= count; p++) {
      const m = blank(tournamentId, 'winner', r, p);
      if (r === 1) {
        m.teamAId = bySeed(order[(p - 1) * 2])?.id;
        m.teamBId = bySeed(order[(p - 1) * 2 + 1])?.id;
      }
      list.push(m);
    }
    all.push(list);
  }

  // Câblage : le vainqueur du match p monte dans le match ⌈p/2⌉ du tour suivant.
  for (let r = 0; r < all.length - 1; r++) {
    all[r].forEach((m, i) => {
      const next = all[r + 1][Math.floor(i / 2)];
      m.nextMatchId = next.id;
      m.nextSlot = i % 2 === 0 ? 'a' : 'b';
    });
  }
  return all.flat();
}

/**
 * Double élimination. L'upper est un arbre classique ; le lower alterne des
 * tours « de report » (les tombés de l'upper arrivent) et des tours internes.
 * Le câblage des descentes suit cette alternance.
 */
export function buildDoubleElim(tournamentId: string, teams: TournamentTeam[]): TournamentMatch[] {
  const upper = buildSingleElim(tournamentId, teams);
  const size = pow2(teams.length);
  const k = Math.log2(size); // nombre de tours de l'upper
  if (k < 2) return upper;

  const byRound = (r: number) => upper.filter((m) => m.round === r).sort((a, b) => a.position - b.position);

  // Tailles des tours du lower : pour k=3 → 2,2,1,1 ; pour k=4 → 4,4,2,2,1,1.
  // Chaque taille apparaît DEUX fois : un tour « de report » qui accueille les
  // tombés de l'upper, puis un tour interne entre rescapés du lower.
  const sizes: number[] = [];
  for (let i = k - 1; i >= 1; i--) {
    sizes.push(2 ** (i - 1));
    sizes.push(2 ** (i - 1));
  }

  const lower: TournamentMatch[][] = sizes.map((count, idx) =>
    Array.from({ length: count }, (_, i) => blank(tournamentId, 'loser', idx + 1, i + 1)),
  );

  // Descentes depuis l'upper :
  //   tour 1 → lower tour 1 (deux tombés par match)
  //   tour r≥2 → lower tour 2(r-1) — c'est là qu'arrivent les éliminés tardifs,
  //   y compris le perdant de la finale upper, qui atterrit en finale lower.
  byRound(1).forEach((m, i) => {
    const target = lower[0][Math.floor(i / 2)];
    if (!target) return;
    m.loserMatchId = target.id;
    m.loserSlot = i % 2 === 0 ? 'a' : 'b';
  });

  for (let r = 2; r <= k; r++) {
    const target = lower[2 * (r - 1) - 1];
    if (!target) continue;
    byRound(r).forEach((m, i) => {
      const t = target[i % target.length];
      if (!t) return;
      m.loserMatchId = t.id;
      m.loserSlot = 'b';
    });
  }

  // Progression interne : taille égale → 1:1 en slot A ; taille divisée → paires.
  for (let i = 0; i < lower.length - 1; i++) {
    const cur = lower[i];
    const next = lower[i + 1];
    const same = next.length === cur.length;
    cur.forEach((m, j) => {
      const t = same ? next[j] : next[Math.floor(j / 2)];
      if (!t) return;
      m.nextMatchId = t.id;
      m.nextSlot = same ? 'a' : j % 2 === 0 ? 'a' : 'b';
    });
  }

  // Grande finale : vainqueur upper contre vainqueur lower.
  const grand = blank(tournamentId, 'final', 1, 1);
  const upperFinal = byRound(k)[0];
  if (upperFinal) {
    upperFinal.nextMatchId = grand.id;
    upperFinal.nextSlot = 'a';
  }
  const lowerFinal = lower[lower.length - 1]?.[0];
  if (lowerFinal) {
    lowerFinal.nextMatchId = grand.id;
    lowerFinal.nextSlot = 'b';
  }

  return [...upper, ...lower.flat(), grand];
}

/** Round robin : chaque équipe rencontre toutes les autres une fois. */
export function buildRoundRobin(
  tournamentId: string,
  teams: TournamentTeam[],
  groupLabel?: string,
): TournamentMatch[] {
  const out: TournamentMatch[] = [];
  let pos = 1;
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const m = blank(tournamentId, undefined, 1, pos++);
      m.teamAId = teams[i].id;
      m.teamBId = teams[j].id;
      m.groupLabel = groupLabel;
      out.push(m);
    }
  }
  return out;
}

/**
 * Poules en serpentin (1-8-9-16, 2-7-10-15…) : évite de concentrer les
 * meilleures têtes de série dans la même poule.
 */
export function splitGroups(teams: TournamentTeam[], groupCount: number): TournamentTeam[][] {
  const sorted = [...teams].sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));
  const groups: TournamentTeam[][] = Array.from({ length: groupCount }, () => []);
  sorted.forEach((t, i) => {
    const row = Math.floor(i / groupCount);
    const col = i % groupCount;
    groups[row % 2 === 0 ? col : groupCount - 1 - col].push(t);
  });
  return groups;
}

export function buildGroups(tournamentId: string, teams: TournamentTeam[], groupCount: number): TournamentMatch[] {
  const groups = splitGroups(teams, groupCount);
  return groups.flatMap((g, i) =>
    buildRoundRobin(tournamentId, g, String.fromCharCode(65 + i)),
  );
}

/**
 * Poules PUIS phase finale. Les deux phases sont générées d'un coup :
 * les matchs de poule avec leurs équipes, et l'arbre final avec des
 * emplacements VIDES — on ne connaît pas encore les qualifiés.
 *
 * Les qualifiés sont injectés plus tard par `seedPlayoffs`, une fois les
 * poules jouées. Séparer les deux évite de régénérer (donc d'effacer les
 * scores) au moment de lancer les playoffs.
 */
export function buildGroupsAndPlayoffs(
  tournamentId: string,
  teams: TournamentTeam[],
  groupCount: number,
  qualifiersPerGroup: number,
  playoffFormat: 'single_elim' | 'double_elim',
): TournamentMatch[] {
  const groupMatches = buildGroups(tournamentId, teams, groupCount);
  const qualified = groupCount * qualifiersPerGroup;
  if (qualified < 2) return groupMatches;

  // Équipes FICTIVES : uniquement pour donner sa forme à l'arbre. Elles ne
  // sont jamais écrites en base — seule la structure des matchs l'est.
  const placeholders: TournamentTeam[] = Array.from({ length: qualified }, (_, i) => ({
    id: '',
    tournamentId,
    name: '',
    seed: i + 1,
    status: 'registered',
    disqualified: false,
    players: [],
  }));

  const playoffs =
    playoffFormat === 'double_elim'
      ? buildDoubleElim(tournamentId, placeholders)
      : buildSingleElim(tournamentId, placeholders);

  // On vide les emplacements : les qualifiés arriveront via seedPlayoffs.
  for (const m of playoffs) {
    m.teamAId = undefined;
    m.teamBId = undefined;
  }
  return [...groupMatches, ...playoffs];
}

/**
 * Place les qualifiés dans le premier tour de la phase finale, une fois les
 * poules terminées. Croise les poules (1er A contre 2e B…) pour éviter qu'un
 * duel de poule se rejoue immédiatement.
 */
export function seedPlayoffs(
  all: TournamentMatch[],
  teams: TournamentTeam[],
  groupCount: number,
  qualifiersPerGroup: number,
): TournamentMatch[] {
  const groups = splitGroups(teams, groupCount);

  /** Classement d'une poule, calculé depuis les scores saisis. */
  const rank = (group: TournamentTeam[]) => {
    const pool = all.filter((m) => m.groupLabel && m.status === 'finished');
    const score = group.map((t) => {
      let won = 0;
      let diff = 0;
      for (const m of pool) {
        if (m.scoreA == null || m.scoreB == null) continue;
        if (m.teamAId === t.id) {
          diff += m.scoreA - m.scoreB;
          if (m.scoreA > m.scoreB) won++;
        } else if (m.teamBId === t.id) {
          diff += m.scoreB - m.scoreA;
          if (m.scoreB > m.scoreA) won++;
        }
      }
      return { t, won, diff };
    });
    return score.sort((x, y) => y.won - x.won || y.diff - x.diff).map((x) => x.t);
  };

  // Ordre des qualifiés : tous les 1ers, puis tous les 2es…
  const ordered: TournamentTeam[] = [];
  for (let pos = 0; pos < qualifiersPerGroup; pos++) {
    groups.forEach((g) => {
      const t = rank(g)[pos];
      if (t) ordered.push(t);
    });
  }

  const first = all
    .filter((m) => m.bracket === 'winner' && m.round === 1)
    .sort((a, b) => a.position - b.position);
  if (!first.length) return [];

  const order = seedOrder(first.length * 2);
  const updated: TournamentMatch[] = [];
  first.forEach((m, i) => {
    const a = ordered[order[i * 2] - 1];
    const b = ordered[order[i * 2 + 1] - 1];
    updated.push({ ...m, teamAId: a?.id, teamBId: b?.id });
  });
  return updated;
}

/**
 * Arbre de playoffs VIDE, pour N qualifiés — utilisé quand la phase de
 * groupes n'est pas en 1v1 (lobbies « The Finals ») : seule la forme de
 * l'arbre est générée, les équipes arrivent ensuite.
 */
export function buildPlayoffShell(
  tournamentId: string,
  qualified: number,
  playoffFormat: 'single_elim' | 'double_elim',
): TournamentMatch[] {
  if (qualified < 2) return [];
  const placeholders: TournamentTeam[] = Array.from({ length: qualified }, (_, i) => ({
    id: '',
    tournamentId,
    name: '',
    seed: i + 1,
    status: 'registered',
    disqualified: false,
    players: [],
  }));
  const list =
    playoffFormat === 'double_elim'
      ? buildDoubleElim(tournamentId, placeholders)
      : buildSingleElim(tournamentId, placeholders);
  for (const m of list) {
    m.teamAId = undefined;
    m.teamBId = undefined;
  }
  return list;
}

/** Point d'entrée : génère les matchs selon le format choisi. */
export function generateMatches(
  tournamentId: string,
  format: TournamentFormat,
  teams: TournamentTeam[],
  opts: { groupCount?: number; qualifiersPerGroup?: number; playoffFormat?: 'single_elim' | 'double_elim' } = {},
): TournamentMatch[] {
  if (teams.length < 2) return [];
  const { groupCount = 4, qualifiersPerGroup = 2, playoffFormat = 'single_elim' } = opts;
  switch (format) {
    case 'single_elim':
      return buildSingleElim(tournamentId, teams);
    case 'double_elim':
      return buildDoubleElim(tournamentId, teams);
    case 'round_robin':
    case 'swiss':
      // Le suisse se joue tour par tour selon les résultats : on amorce par un
      // round robin, les tours suivants s'ajoutent à la main.
      return buildRoundRobin(tournamentId, teams);
    case 'groups_bracket':
      return buildGroupsAndPlayoffs(tournamentId, teams, groupCount, qualifiersPerGroup, playoffFormat);
    default:
      return [];
  }
}

/**
 * Applique un résultat : marque le vainqueur, puis propage l'équipe gagnante
 * dans le match suivant ET la perdante dans sa destination lower.
 * Renvoie TOUS les matchs modifiés, à écrire en lot.
 */
export function applyResult(
  all: TournamentMatch[],
  matchId: string,
  scoreA: number,
  scoreB: number,
): TournamentMatch[] {
  const m = all.find((x) => x.id === matchId);
  if (!m || !m.teamAId || !m.teamBId) return [];

  const winnerId = scoreA > scoreB ? m.teamAId : scoreB > scoreA ? m.teamBId : undefined;
  const loserId = winnerId ? (winnerId === m.teamAId ? m.teamBId : m.teamAId) : undefined;

  const updated: TournamentMatch[] = [];
  const next = { ...m, scoreA, scoreB, winnerId, status: winnerId ? ('finished' as const) : m.status };
  updated.push(next);

  const place = (targetId?: string, slot?: 'a' | 'b', teamId?: string) => {
    if (!targetId || !slot || !teamId) return;
    const t = all.find((x) => x.id === targetId);
    if (!t) return;
    const already = updated.find((x) => x.id === t.id);
    const base = already ?? { ...t };
    if (slot === 'a') base.teamAId = teamId;
    else base.teamBId = teamId;
    if (!already) updated.push(base);
  };

  place(m.nextMatchId, m.nextSlot, winnerId);
  place(m.loserMatchId, m.loserSlot, loserId);

  return updated;
}
