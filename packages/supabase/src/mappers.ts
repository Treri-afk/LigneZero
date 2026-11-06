/**
 * Conversion entre les lignes DB (snake_case, jsonb) et les types domaine
 * (camelCase) de @lignezero/types. Un couple « from… / to… » par entité :
 *   from<Entity>Row  : Row  → domaine (lecture, vitrine)
 *   to<Entity>Row    : domaine → Insert (écriture, manager)
 * Les objets imbriqués sont stockés en jsonb → cast au passage.
 */
import type {
  BrandSettings,
  Tournament,
  TournamentFormat,
  TournamentStatus,
  TournamentTeam,
  TournamentTeamStatus,
  TournamentPlayer,
  TournamentStage,
  TournamentStageKind,
  TournamentMatch,
  TournamentMatchStatus,
  BracketSide,
  TournamentLobby,
  LobbyEntry,
  LobbyStatus,
  PointRule,
  ReseedMode,
  Game,
  Player,
  Staff,
  Sponsor,
  SponsorDossier,
  Match,
  MatchOpponent,
  MatchScore,
  MatchTicket,
  Creator,
  Clip,
  Product,
  Profile,
  PlayerStat,
  SocialLink,
  SponsorTier,
  SponsorStatus,
  SponsorTracking,
  DesignRequest,
  DesignKind,
  DesignStatus,
  Transaction,
  TransactionKind,
  MatchStatus,
  ProductStatus,
  UserRole,
  Announcement,
  Objective,
  ObjectiveScope,
  ObjectiveStatus,
  Feedback,
  Session,
  SessionKind,
  SessionRsvp,
  RsvpStatus,
  Availability,
  AvailabilityStatus,
  VideoReview,
  VideoAnnotation,
  MatchPlayerStat,
  Strat,
  StratBoardObject,
  ValorantMap,
  ValorantAgent,
  AgentClass,
  ValorantAbility,
  AbilityCategory,
  AbilityShape,
  InventoryItemKind,
  InventoryItem,
  FavoriteMatch,
  MemberLinks,
  BotConfig,
  BotCommand,
  BotCommandRole,
  BotEvent,
  BotFeatureKey,
  BotTimer,
  BotQuote,
  ViewerPoints,
  BotReward,
  BotRewardKind,
  RewardRedemption,
  RedemptionStatus,
  BotAlert,
  AlertEventType,
  MatchPrediction,
  PredictionStatus,
  PredictionBet,
  BotNotification,
  NotificationStatus,
  DiscordCommand,
  DiscordCommandKind,
  DiscordRoute,
  DiscordRouteMode,
  TicketTemplate,
  TryoutCampaign,
  TryoutCampaignStatus,
  Candidate,
  CandidateStatus,
  CandidateEvaluation,
  CandidateRecommendation,
  CandidateAvailability,
  SessionCandidate,
  CandidateSessionStatus,
} from '@lignezero/types';
import type { Tables, TablesInsert, Json } from './database.types';

/** null → undefined (les types domaine utilisent `?`, pas `| null`). */
const u = <T>(v: T | null): T | undefined => (v == null ? undefined : v);

// ── Games ──────────────────────────────────────────────────────────
export function fromGameRow(r: Tables<'games'>): Game {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    tag: r.tag,
    visual: u(r.visual),
    color: u(r.color),
    stats: (r.stats as unknown as PlayerStat[]) ?? [],
    palmares: r.palmares ?? [],
  };
}
export function toGameRow(g: Game, sortOrder = 0): TablesInsert<'games'> {
  return {
    id: g.id,
    slug: g.slug,
    name: g.name,
    tag: g.tag,
    visual: g.visual ?? null,
    color: g.color ?? null,
    stats: (g.stats ?? []) as unknown as TablesInsert<'games'>['stats'],
    palmares: g.palmares ?? [],
    sort_order: sortOrder,
  };
}

// ── Players ────────────────────────────────────────────────────────
export function fromPlayerRow(r: Tables<'players'>): Player {
  return {
    id: r.id,
    pseudo: r.pseudo,
    firstName: u(r.first_name),
    lastName: u(r.last_name),
    role: r.role,
    gameId: r.game_id,
    country: u(r.country),
    color: u(r.color),
    photo: u(r.photo),
    socials: (r.socials as unknown as SocialLink[]) ?? [],
    stats: (r.stats as unknown as PlayerStat[]) ?? [],
    palmares: r.palmares ?? [],
    joinedYear: u(r.joined_year),
    setup: (r.setup as unknown as PlayerStat[]) ?? [],
  };
}
export function toPlayerRow(p: Player, sortOrder = 0): TablesInsert<'players'> {
  return {
    id: p.id,
    pseudo: p.pseudo,
    first_name: p.firstName ?? null,
    last_name: p.lastName ?? null,
    role: p.role,
    game_id: p.gameId,
    country: p.country ?? null,
    color: p.color ?? null,
    photo: p.photo ?? null,
    socials: (p.socials ?? []) as unknown as TablesInsert<'players'>['socials'],
    stats: (p.stats ?? []) as unknown as TablesInsert<'players'>['stats'],
    palmares: p.palmares ?? [],
    joined_year: p.joinedYear ?? null,
    setup: (p.setup ?? []) as unknown as TablesInsert<'players'>['setup'],
    sort_order: sortOrder,
  };
}

// ── Staff ──────────────────────────────────────────────────────────
export function fromStaffRow(r: Tables<'staff'>): Staff {
  return {
    id: r.id,
    name: r.name,
    role: r.role,
    photo: u(r.photo),
    socials: (r.socials as unknown as SocialLink[]) ?? [],
    bio: u(r.bio),
    matricule: u(r.matricule),
    clearance: u(r.clearance),
    division: u(r.division),
    since: u(r.since),
  };
}
export function toStaffRow(s: Staff, sortOrder = 0): TablesInsert<'staff'> {
  return {
    id: s.id,
    name: s.name,
    role: s.role,
    photo: s.photo ?? null,
    socials: (s.socials ?? []) as unknown as TablesInsert<'staff'>['socials'],
    bio: s.bio ?? null,
    matricule: s.matricule ?? null,
    clearance: s.clearance ?? null,
    division: s.division ?? null,
    since: s.since ?? null,
    sort_order: sortOrder,
  };
}

// ── Sponsors ───────────────────────────────────────────────────────
export function fromSponsorRow(r: Tables<'sponsors'>): Sponsor {
  return {
    id: r.id,
    name: r.name,
    logo: u(r.logo),
    color: u(r.color),
    url: r.url,
    tier: r.tier as SponsorTier,
    status: r.status as SponsorStatus,
    tagline: u(r.tagline),
    sector: u(r.sector),
    since: u(r.since),
    description: u(r.description),
    contribution: u(r.contribution),
    dossier: (u(r.dossier) as SponsorDossier | undefined) ?? undefined,
  };
}
export function toSponsorRow(s: Sponsor, sortOrder = 0): TablesInsert<'sponsors'> {
  return {
    id: s.id,
    name: s.name,
    logo: s.logo ?? null,
    color: s.color ?? null,
    url: s.url,
    tier: s.tier,
    status: s.status ?? 'actif',
    tagline: s.tagline ?? null,
    sector: s.sector ?? null,
    since: s.since ?? null,
    description: s.description ?? null,
    contribution: s.contribution ?? null,
    dossier: (s.dossier ?? null) as unknown as TablesInsert<'sponsors'>['dossier'],
    sort_order: sortOrder,
  };
}

// ── Matches ────────────────────────────────────────────────────────
export function fromMatchRow(r: Tables<'matches'>): Match {
  return {
    id: r.id,
    gameId: r.game_id,
    opponent: r.opponent as unknown as MatchOpponent,
    dateISO: r.date_iso,
    competition: r.competition,
    status: r.status as MatchStatus,
    score: (u(r.score) as MatchScore | undefined) ?? undefined,
    streamUrl: u(r.stream_url),
    vodUrl: u(r.vod_url),
    ticket: (u(r.ticket) as MatchTicket | undefined) ?? undefined,
  };
}
export function toMatchRow(m: Match): TablesInsert<'matches'> {
  return {
    id: m.id,
    game_id: m.gameId,
    opponent: m.opponent as unknown as TablesInsert<'matches'>['opponent'],
    date_iso: m.dateISO,
    competition: m.competition,
    status: m.status,
    score: (m.score ?? null) as unknown as TablesInsert<'matches'>['score'],
    stream_url: m.streamUrl ?? null,
    vod_url: m.vodUrl ?? null,
    ticket: (m.ticket ?? null) as unknown as TablesInsert<'matches'>['ticket'],
  };
}

// ── Creators ───────────────────────────────────────────────────────
export function fromCreatorRow(r: Tables<'creators'>): Creator {
  return {
    id: r.id,
    name: r.name,
    role: u(r.role),
    platform: r.platform as Creator['platform'],
    live: r.live,
    title: u(r.title),
    viewers: u(r.viewers),
    avatar: u(r.avatar),
    url: r.url,
  };
}
export function toCreatorRow(c: Creator, sortOrder = 0): TablesInsert<'creators'> {
  return {
    id: c.id,
    name: c.name,
    role: c.role ?? null,
    platform: c.platform,
    live: c.live ?? false,
    title: c.title ?? null,
    viewers: c.viewers ?? null,
    avatar: c.avatar ?? null,
    url: c.url,
    sort_order: sortOrder,
  };
}

// ── Clips ──────────────────────────────────────────────────────────
export function fromClipRow(r: Tables<'clips'>): Clip {
  return {
    id: r.id,
    title: r.title,
    author: r.author,
    game: u(r.game),
    thumb: u(r.thumb),
    url: r.url,
  };
}
export function toClipRow(c: Clip, sortOrder = 0): TablesInsert<'clips'> {
  return {
    id: c.id,
    title: c.title,
    author: c.author,
    game: c.game ?? null,
    thumb: c.thumb ?? null,
    url: c.url,
    sort_order: sortOrder,
  };
}

// ── Products ───────────────────────────────────────────────────────
export function fromProductRow(r: Tables<'products'>): Product {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    price: u(r.price),
    image: u(r.image),
    status: r.status as ProductStatus,
  };
}
export function toProductRow(p: Product, sortOrder = 0): TablesInsert<'products'> {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price ?? null,
    image: p.image ?? null,
    status: p.status,
    sort_order: sortOrder,
  };
}

// ── Profiles ───────────────────────────────────────────────────────
export function fromProfileRow(r: Tables<'profiles'>): Profile {
  return { id: r.id, role: r.role as UserRole, displayName: u(r.display_name), playerId: u(r.player_id) };
}

// ── Announcements ──────────────────────────────────────────────────
export function fromAnnouncementRow(r: Tables<'announcements'>): Announcement {
  return { id: r.id, title: r.title, body: r.body, audience: r.audience, createdAt: r.created_at };
}
export function toAnnouncementRow(a: Partial<Announcement>): TablesInsert<'announcements'> {
  return { id: a.id, title: a.title ?? '', body: a.body ?? '', audience: a.audience ?? 'all' };
}

// ── Objectives ─────────────────────────────────────────────────────
export function fromObjectiveRow(r: Tables<'objectives'>): Objective {
  return {
    id: r.id,
    scope: r.scope as ObjectiveScope,
    playerId: u(r.player_id),
    week: u(r.week),
    title: r.title,
    detail: u(r.detail),
    status: r.status as ObjectiveStatus,
    createdAt: r.created_at,
  };
}
export function toObjectiveRow(o: Partial<Objective>): TablesInsert<'objectives'> {
  return {
    id: o.id,
    scope: (o.scope ?? 'team') as string,
    player_id: o.playerId ?? null,
    week: o.week ?? null,
    title: o.title ?? '',
    detail: o.detail ?? null,
    status: o.status ?? 'todo',
  };
}

// ── Feedback ───────────────────────────────────────────────────────
export function fromFeedbackRow(r: Tables<'feedback'>): Feedback {
  return {
    id: r.id,
    playerId: r.player_id,
    matchId: u(r.match_id),
    body: r.body,
    acknowledged: r.acknowledged,
    reply: u(r.reply),
    reviewId: u(r.review_id),
    timestampSec: u(r.timestamp_sec),
    createdAt: r.created_at,
  };
}
export function toFeedbackRow(f: Partial<Feedback>): TablesInsert<'feedback'> {
  return {
    id: f.id,
    player_id: f.playerId ?? '',
    match_id: f.matchId ?? null,
    body: f.body ?? '',
    acknowledged: f.acknowledged ?? false,
    reply: f.reply ?? null,
    review_id: f.reviewId ?? null,
    timestamp_sec: f.timestampSec ?? null,
  };
}

// ── Sessions ───────────────────────────────────────────────────────
export function fromSessionRow(r: Tables<'sessions'>): Session {
  return {
    id: r.id,
    kind: r.kind as SessionKind,
    title: r.title,
    startsAt: r.starts_at,
    durationMin: u(r.duration_min),
    gameId: u(r.game_id),
    location: u(r.location),
    notes: u(r.notes),
    campaignId: u(r.campaign_id),
  };
}
export function toSessionRow(s: Partial<Session>): TablesInsert<'sessions'> {
  return {
    id: s.id,
    kind: (s.kind ?? 'practice') as string,
    title: s.title ?? '',
    starts_at: s.startsAt ?? new Date().toISOString(),
    duration_min: s.durationMin ?? null,
    game_id: s.gameId ?? null,
    location: s.location ?? null,
    notes: s.notes ?? null,
    campaign_id: s.campaignId ?? null,
  };
}

// ── Session RSVP ───────────────────────────────────────────────────
export function fromRsvpRow(r: Tables<'session_rsvp'>): SessionRsvp {
  return { sessionId: r.session_id, playerId: r.player_id, status: r.status as RsvpStatus };
}
export function toRsvpRow(r: SessionRsvp): TablesInsert<'session_rsvp'> {
  return { session_id: r.sessionId, player_id: r.playerId, status: r.status };
}

// ── Availability ───────────────────────────────────────────────────
const hhmm = (t: string | null): string | undefined => (t ? t.slice(0, 5) : undefined);

export function fromAvailabilityRow(r: Tables<'availability'>): Availability {
  return {
    id: r.id,
    playerId: r.player_id,
    day: r.day,
    startTime: hhmm(r.start_time),
    endTime: hhmm(r.end_time),
    status: r.status as AvailabilityStatus,
    note: u(r.note),
  };
}
export function toAvailabilityRow(a: Partial<Availability>): TablesInsert<'availability'> {
  return {
    id: a.id,
    player_id: a.playerId ?? '',
    day: a.day ?? '',
    start_time: a.startTime ?? null,
    end_time: a.endTime ?? null,
    status: a.status ?? 'available',
    note: a.note ?? null,
  };
}

// ── Revue vidéo ────────────────────────────────────────────────────
export function fromVideoReviewRow(r: Tables<'video_reviews'>): VideoReview {
  return {
    id: r.id,
    title: r.title,
    videoUrl: r.video_url,
    gameId: u(r.game_id),
    sessionId: u(r.session_id),
    matchId: u(r.match_id),
    createdAt: r.created_at,
  };
}
export function toVideoReviewRow(v: Partial<VideoReview>): TablesInsert<'video_reviews'> {
  return {
    id: v.id ?? '',
    title: v.title ?? '',
    video_url: v.videoUrl ?? '',
    game_id: v.gameId ?? null,
    session_id: v.sessionId ?? null,
    match_id: v.matchId ?? null,
  };
}

export function fromVideoAnnotationRow(r: Tables<'video_annotations'>): VideoAnnotation {
  return {
    id: r.id,
    reviewId: r.review_id,
    timestampSec: r.timestamp_sec,
    tag: r.tag,
    description: r.description,
    playerId: u(r.player_id),
    createdAt: r.created_at,
  };
}
export function toVideoAnnotationRow(a: Partial<VideoAnnotation>): TablesInsert<'video_annotations'> {
  return {
    id: a.id,
    review_id: a.reviewId ?? '',
    timestamp_sec: a.timestampSec ?? 0,
    tag: a.tag ?? '',
    description: a.description ?? '',
    player_id: a.playerId ?? null,
  };
}

// ── Stats par match ────────────────────────────────────────────────
export function fromMatchPlayerStatRow(r: Tables<'match_player_stats'>): MatchPlayerStat {
  return {
    id: r.id,
    matchId: r.match_id,
    playerId: r.player_id,
    stats: (r.stats as unknown as PlayerStat[]) ?? [],
  };
}
export function toMatchPlayerStatRow(s: Partial<MatchPlayerStat>): TablesInsert<'match_player_stats'> {
  return {
    id: s.id,
    match_id: s.matchId ?? '',
    player_id: s.playerId ?? '',
    stats: (s.stats ?? []) as unknown as TablesInsert<'match_player_stats'>['stats'],
  };
}

// ── Strats ─────────────────────────────────────────────────────────
export function fromStratRow(r: Tables<'strats'>): Strat {
  return {
    id: r.id,
    title: r.title,
    gameId: u(r.game_id),
    map: u(r.map),
    description: r.description,
    tags: r.tags ?? [],
    reviewId: u(r.review_id),
    timestampSec: u(r.timestamp_sec),
    createdAt: r.created_at,
    board: (r.board as unknown as StratBoardObject[]) ?? [],
  };
}
export function toStratRow(s: Strat): TablesInsert<'strats'> {
  return {
    id: s.id,
    title: s.title,
    game_id: s.gameId ?? null,
    map: s.map ?? null,
    description: s.description,
    tags: s.tags ?? [],
    review_id: s.reviewId ?? null,
    timestamp_sec: s.timestampSec ?? null,
    board: (s.board ?? []) as unknown as TablesInsert<'strats'>['board'],
  };
}

// ── Valoplant (paramètres : maps, agents, compétences) ─────────────
export function fromValorantMapRow(r: Tables<'valorant_maps'>): ValorantMap {
  return { id: r.id, name: r.name, image: u(r.image), createdAt: r.created_at };
}
export function toValorantMapRow(m: Partial<ValorantMap>): TablesInsert<'valorant_maps'> {
  return { id: m.id ?? '', name: m.name ?? '', image: m.image ?? null };
}

export function fromValorantAgentRow(r: Tables<'valorant_agents'>): ValorantAgent {
  return { id: r.id, name: r.name, cls: r.class as AgentClass, image: u(r.image), createdAt: r.created_at };
}
export function toValorantAgentRow(a: Partial<ValorantAgent>): TablesInsert<'valorant_agents'> {
  return { id: a.id ?? '', name: a.name ?? '', class: a.cls ?? 'duelist', image: a.image ?? null };
}

export function fromValorantAbilityRow(r: Tables<'valorant_abilities'>): ValorantAbility {
  return {
    id: r.id,
    agentId: r.agent_id,
    slot: r.slot as ValorantAbility['slot'],
    name: r.name,
    category: r.category as AbilityCategory,
    shape: r.shape as AbilityShape,
    radius: r.radius,
    width: r.width,
    length: r.length,
    image: u(r.image),
    createdAt: r.created_at,
  };
}
export function toValorantAbilityRow(a: Partial<ValorantAbility>): TablesInsert<'valorant_abilities'> {
  return {
    id: a.id ?? '',
    agent_id: a.agentId ?? '',
    slot: a.slot ?? 'C',
    name: a.name ?? '',
    category: a.category ?? 'other',
    shape: a.shape ?? 'circle',
    radius: a.radius ?? 16,
    width: a.width ?? 16,
    length: a.length ?? 16,
    image: a.image ?? null,
  };
}

// ── Inventaire membre (lecture seule côté site) ───────────────────────
export function fromInventoryItemRow(r: Tables<'inventory_items'>): InventoryItem {
  return {
    id: r.id,
    ownerId: r.owner_id,
    kind: r.kind as InventoryItemKind,
    name: r.name,
    description: u(r.description),
    image: u(r.image),
    source: u(r.source),
    link: u(r.link),
    matchId: u(r.match_id),
    obtainedAt: r.obtained_at,
  };
}

// ── Matchs favoris ─────────────────────────────────────────────────
export function fromFavoriteMatchRow(r: Tables<'favorite_matches'>): FavoriteMatch {
  return { ownerId: r.owner_id, matchId: r.match_id };
}
export function toFavoriteMatchRow(f: FavoriteMatch): TablesInsert<'favorite_matches'> {
  return { owner_id: f.ownerId, match_id: f.matchId };
}

// ── Liens Discord/Twitch ───────────────────────────────────────────
export function fromMemberLinksRow(r: Tables<'member_links'>): MemberLinks {
  return {
    ownerId: r.owner_id,
    discordHandle: u(r.discord_handle),
    twitchHandle: u(r.twitch_handle),
    twitchUserId: u(r.twitch_user_id),
    discordUserId: u(r.discord_user_id),
  };
}
export function toMemberLinksRow(m: MemberLinks): TablesInsert<'member_links'> {
  return {
    owner_id: m.ownerId,
    discord_handle: m.discordHandle ?? null,
    twitch_handle: m.twitchHandle ?? null,
    twitch_user_id: m.twitchUserId ?? null,
    discord_user_id: m.discordUserId ?? null,
  };
}


// ── Tournois ───────────────────────────────────────────────────────
export function fromTournamentRow(r: Tables<'tournaments'>): Tournament {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    gameId: u(r.game_id),
    format: r.format as TournamentFormat,
    status: r.status as TournamentStatus,
    teamSize: r.team_size,
    maxTeams: u(r.max_teams),
    groupCount: r.group_count,
    qualifiersPerGroup: r.qualifiers_per_group,
    playoffFormat: r.playoff_format as Tournament['playoffFormat'],
    groupRounds: r.group_rounds,
    teamsPerLobby: r.teams_per_lobby,
    pointRules: (r.point_rules as unknown as PointRule[]) ?? [],
    reseedMode: r.reseed_mode as ReseedMode,
    prize: u(r.prize),
    rules: u(r.rules),
    description: u(r.description),
    coverUrl: u(r.cover_url),
    startsAt: u(r.starts_at),
    endsAt: u(r.ends_at),
  };
}
export function toTournamentRow(t: Tournament): TablesInsert<'tournaments'> {
  return {
    id: t.id || undefined,
    slug: t.slug,
    name: t.name,
    game_id: t.gameId ?? null,
    format: t.format,
    status: t.status,
    team_size: t.teamSize,
    max_teams: t.maxTeams ?? null,
    group_count: t.groupCount,
    qualifiers_per_group: t.qualifiersPerGroup,
    playoff_format: t.playoffFormat,
    group_rounds: t.groupRounds,
    teams_per_lobby: t.teamsPerLobby,
    point_rules: (t.pointRules ?? []) as unknown as TablesInsert<'tournaments'>['point_rules'],
    reseed_mode: t.reseedMode,
    prize: t.prize ?? null,
    rules: t.rules ?? null,
    description: t.description ?? null,
    cover_url: t.coverUrl ?? null,
    starts_at: t.startsAt ?? null,
    ends_at: t.endsAt ?? null,
    updated_at: new Date().toISOString(),
  };
}

export function fromTournamentPlayerRow(r: Tables<'tournament_players'>): TournamentPlayer {
  return { id: r.id, teamId: r.team_id, pseudo: r.pseudo, role: u(r.role), isCaptain: r.is_captain, sortOrder: r.sort_order };
}
export function toTournamentPlayerRow(p: TournamentPlayer): TablesInsert<'tournament_players'> {
  return { id: p.id || undefined, team_id: p.teamId, pseudo: p.pseudo, role: p.role ?? null, is_captain: p.isCaptain, sort_order: p.sortOrder };
}

/** `players` est rempli à part (requête séparée) — vide par défaut. */
export function fromTournamentTeamRow(r: Tables<'tournament_teams'>): TournamentTeam {
  return {
    id: r.id,
    tournamentId: r.tournament_id,
    name: r.name,
    tag: u(r.tag),
    logoUrl: u(r.logo_url),
    color: u(r.color),
    seed: u(r.seed),
    status: r.status as TournamentTeamStatus,
    placement: u(r.placement),
    disqualified: r.disqualified,
    disqualifiedReason: u(r.disqualified_reason),
    tiebreakOrder: r.tiebreak_order,
    tiebreakNote: u(r.tiebreak_note),
    players: [],
  };
}
export function toTournamentTeamRow(t: TournamentTeam): TablesInsert<'tournament_teams'> {
  return {
    id: t.id || undefined,
    tournament_id: t.tournamentId,
    name: t.name,
    tag: t.tag ?? null,
    logo_url: t.logoUrl ?? null,
    color: t.color ?? null,
    seed: t.seed ?? null,
    status: t.status,
    placement: t.placement ?? null,
    disqualified: t.disqualified,
    disqualified_reason: t.disqualifiedReason ?? null,
    tiebreak_order: t.tiebreakOrder,
    tiebreak_note: t.tiebreakNote ?? null,
  };
}

export function fromLobbyEntryRow(r: Tables<'tournament_lobby_entries'>): LobbyEntry {
  return { id: r.id, lobbyId: r.lobby_id, teamId: r.team_id, placement: u(r.placement), points: r.points, dnf: r.dnf, sortOrder: r.sort_order };
}
export function toLobbyEntryRow(e: LobbyEntry): TablesInsert<'tournament_lobby_entries'> {
  return { id: e.id || undefined, lobby_id: e.lobbyId, team_id: e.teamId, placement: e.placement ?? null, points: e.points, dnf: e.dnf, sort_order: e.sortOrder };
}

/** `entries` est rempli à part — vide par défaut. */
export function fromLobbyRow(r: Tables<'tournament_lobbies'>): TournamentLobby {
  return {
    id: r.id,
    tournamentId: r.tournament_id,
    round: r.round,
    position: r.position,
    label: u(r.label),
    status: r.status as LobbyStatus,
    scheduledAt: u(r.scheduled_at),
    streamUrl: u(r.stream_url),
    entries: [],
  };
}
export function toLobbyRow(l: TournamentLobby): TablesInsert<'tournament_lobbies'> {
  return {
    id: l.id || undefined,
    tournament_id: l.tournamentId,
    round: l.round,
    position: l.position,
    label: l.label ?? null,
    status: l.status,
    scheduled_at: l.scheduledAt ?? null,
    stream_url: l.streamUrl ?? null,
  };
}

export function fromTournamentStageRow(r: Tables<'tournament_stages'>): TournamentStage {
  return { id: r.id, tournamentId: r.tournament_id, kind: r.kind as TournamentStageKind, name: r.name, sortOrder: r.sort_order };
}
export function toTournamentStageRow(s: TournamentStage): TablesInsert<'tournament_stages'> {
  return { id: s.id || undefined, tournament_id: s.tournamentId, kind: s.kind, name: s.name, sort_order: s.sortOrder };
}

export function fromTournamentMatchRow(r: Tables<'tournament_matches'>): TournamentMatch {
  return {
    id: r.id,
    tournamentId: r.tournament_id,
    stageId: u(r.stage_id),
    bracket: (u(r.bracket) as BracketSide | undefined) ?? undefined,
    round: r.round,
    position: r.position,
    groupLabel: u(r.group_label),
    teamAId: u(r.team_a_id),
    teamBId: u(r.team_b_id),
    scoreA: u(r.score_a),
    scoreB: u(r.score_b),
    winnerId: u(r.winner_id),
    nextMatchId: u(r.next_match_id),
    nextSlot: (u(r.next_slot) as 'a' | 'b' | undefined) ?? undefined,
    loserMatchId: u(r.loser_match_id),
    loserSlot: (u(r.loser_slot) as 'a' | 'b' | undefined) ?? undefined,
    status: r.status as TournamentMatchStatus,
    scheduledAt: u(r.scheduled_at),
    streamUrl: u(r.stream_url),
  };
}
export function toTournamentMatchRow(m: TournamentMatch): TablesInsert<'tournament_matches'> {
  return {
    id: m.id || undefined,
    tournament_id: m.tournamentId,
    stage_id: m.stageId ?? null,
    bracket: m.bracket ?? null,
    round: m.round,
    position: m.position,
    group_label: m.groupLabel ?? null,
    team_a_id: m.teamAId ?? null,
    team_b_id: m.teamBId ?? null,
    score_a: m.scoreA ?? null,
    score_b: m.scoreB ?? null,
    winner_id: m.winnerId ?? null,
    next_match_id: m.nextMatchId ?? null,
    next_slot: m.nextSlot ?? null,
    loser_match_id: m.loserMatchId ?? null,
    loser_slot: m.loserSlot ?? null,
    status: m.status,
    scheduled_at: m.scheduledAt ?? null,
    stream_url: m.streamUrl ?? null,
  };
}

// ── Identité de marque ─────────────────────────────────────────────
export function fromBrandSettingsRow(r: Tables<'brand_settings'>): BrandSettings {
  return {
    name: r.name,
    shortName: r.short_name,
    logoUrl: u(r.logo_url),
    markUrl: u(r.mark_url),
    accent: r.accent,
    tagline: u(r.tagline),
    handle: u(r.handle),
  };
}
export function toBrandSettingsRow(b: BrandSettings): TablesInsert<'brand_settings'> {
  return {
    id: 'default', // ligne unique : l'upsert écrase toujours la même
    name: b.name,
    short_name: b.shortName,
    logo_url: b.logoUrl ?? null,
    mark_url: b.markUrl ?? null,
    accent: b.accent,
    tagline: b.tagline ?? null,
    handle: b.handle ?? null,
    updated_at: new Date().toISOString(),
  };
}

// ── Bot Twitch/Discord ─────────────────────────────────────────────
export function fromBotConfigRow(r: Tables<'bot_config'>): BotConfig {
  return {
    twitchChannel: u(r.twitch_channel),
    twitchBotUsername: u(r.twitch_bot_username),
    claimMessage: r.claim_message,
    claimMessageUnlinked: r.claim_message_unlinked,
    ticketsEnabled: r.tickets_enabled,
    clipsEnabled: r.clips_enabled,
    autoSetLive: r.auto_set_live,
    cartridgeName: r.cartridge_name,
    cooldownSec: r.cooldown_sec,
    features: (r.features as Partial<Record<BotFeatureKey, boolean>>) ?? {},
    discordInvite: u(r.discord_invite),
    pointsName: r.points_name,
    pointsPerMessage: r.points_per_message,
    pointsPerClaim: r.points_per_claim,
    discordGuildId: u(r.discord_guild_id),
    discordAnnounceChannelId: u(r.discord_announce_channel_id),
    discordSubRoleId: u(r.discord_sub_role_id),
    discordLiveMessage: r.discord_live_message,
    discordAnnounce: r.discord_announce,
    discordNotifications: r.discord_notifications,
    discordSubRole: r.discord_subrole,
    discordPrefix: r.discord_prefix,
    discordMessageContent: r.discord_message_content,
  };
}
export function toBotConfigRow(c: BotConfig): TablesInsert<'bot_config'> {
  return {
    id: true,
    twitch_channel: c.twitchChannel ?? null,
    twitch_bot_username: c.twitchBotUsername ?? null,
    claim_message: c.claimMessage,
    claim_message_unlinked: c.claimMessageUnlinked,
    tickets_enabled: c.ticketsEnabled,
    clips_enabled: c.clipsEnabled,
    auto_set_live: c.autoSetLive,
    cartridge_name: c.cartridgeName,
    cooldown_sec: c.cooldownSec,
    features: c.features as Json,
    discord_invite: c.discordInvite ?? null,
    points_name: c.pointsName,
    points_per_message: c.pointsPerMessage,
    points_per_claim: c.pointsPerClaim,
    discord_guild_id: c.discordGuildId ?? null,
    discord_announce_channel_id: c.discordAnnounceChannelId ?? null,
    discord_sub_role_id: c.discordSubRoleId ?? null,
    discord_live_message: c.discordLiveMessage,
    discord_announce: c.discordAnnounce,
    discord_notifications: c.discordNotifications,
    discord_subrole: c.discordSubRole,
    discord_prefix: c.discordPrefix,
    discord_message_content: c.discordMessageContent,
    updated_at: new Date().toISOString(),
  };
}
export function fromBotCommandRow(r: Tables<'bot_commands'>): BotCommand {
  return { id: r.id, trigger: r.trigger, response: r.response, enabled: r.enabled, minRole: r.min_role as BotCommandRole, cooldownSec: r.cooldown_sec };
}
export function toBotCommandRow(c: BotCommand): TablesInsert<'bot_commands'> {
  return { id: c.id || undefined, trigger: c.trigger, response: c.response, enabled: c.enabled, min_role: c.minRole, cooldown_sec: c.cooldownSec, updated_at: new Date().toISOString() };
}
export function fromBotEventRow(r: Tables<'bot_events'>): BotEvent {
  return { id: r.id, kind: r.kind, twitchUser: u(r.twitch_user), ownerId: u(r.owner_id), matchId: u(r.match_id), detail: r.detail ?? undefined, createdAt: r.created_at };
}
export function fromBotTimerRow(r: Tables<'bot_timers'>): BotTimer {
  return { id: r.id, label: r.label, message: r.message, intervalSec: r.interval_sec, enabled: r.enabled };
}
export function toBotTimerRow(t: BotTimer): TablesInsert<'bot_timers'> {
  return { id: t.id || undefined, label: t.label, message: t.message, interval_sec: t.intervalSec, enabled: t.enabled };
}
export function fromBotQuoteRow(r: Tables<'bot_quotes'>): BotQuote {
  return { id: r.id, text: r.text, addedBy: u(r.added_by), createdAt: r.created_at };
}
export function fromViewerPointsRow(r: Tables<'viewer_points'>): ViewerPoints {
  return { twitchLogin: r.twitch_login, ownerId: u(r.owner_id), points: r.points, watchMinutes: r.watch_minutes };
}
export function fromBotRewardRow(r: Tables<'bot_rewards'>): BotReward {
  return {
    id: r.id, name: r.name, description: u(r.description), cost: r.cost,
    kind: r.kind as BotRewardKind, payload: (r.payload as Record<string, unknown>) ?? {},
    stock: r.stock ?? undefined, enabled: r.enabled, sortOrder: r.sort_order,
  };
}
export function toBotRewardRow(b: BotReward): TablesInsert<'bot_rewards'> {
  return {
    id: b.id || undefined, name: b.name, description: b.description ?? null, cost: b.cost,
    kind: b.kind, payload: (b.payload ?? {}) as Json, stock: b.stock ?? null,
    enabled: b.enabled, sort_order: b.sortOrder,
  };
}
export function fromRewardRedemptionRow(r: Tables<'reward_redemptions'>): RewardRedemption {
  return {
    id: r.id, rewardId: u(r.reward_id), rewardName: r.reward_name, twitchLogin: r.twitch_login,
    ownerId: u(r.owner_id), cost: r.cost, status: r.status as RedemptionStatus, note: u(r.note),
    createdAt: r.created_at, decidedAt: u(r.decided_at),
  };
}
export function fromBotAlertRow(r: Tables<'bot_alerts'>): BotAlert {
  return { id: r.id, eventType: r.event_type as AlertEventType, enabled: r.enabled, message: r.message, rewardPoints: r.reward_points, minAmount: r.min_amount };
}
export function toBotAlertRow(a: BotAlert): TablesInsert<'bot_alerts'> {
  return { id: a.id || undefined, event_type: a.eventType, enabled: a.enabled, message: a.message, reward_points: a.rewardPoints, min_amount: a.minAmount, updated_at: new Date().toISOString() };
}
export function fromMatchPredictionRow(r: Tables<'match_predictions'>): MatchPrediction {
  return {
    id: r.id, matchId: u(r.match_id), question: r.question, options: (r.options as string[]) ?? [],
    status: r.status as PredictionStatus, winningOption: r.winning_option ?? undefined, createdAt: r.created_at,
  };
}
export function fromPredictionBetRow(r: Tables<'prediction_bets'>): PredictionBet {
  return { id: r.id, predictionId: r.prediction_id, twitchLogin: r.twitch_login, ownerId: u(r.owner_id), optionIndex: r.option_index, amount: r.amount };
}
export function fromBotNotificationRow(r: Tables<'bot_notifications'>): BotNotification {
  return { id: r.id, ownerId: u(r.owner_id), playerId: u(r.player_id), kind: r.kind, title: r.title, body: u(r.body), status: r.status as NotificationStatus, createdAt: r.created_at };
}
export function fromDiscordCommandRow(r: Tables<'discord_commands'>): DiscordCommand {
  return {
    id: r.id, trigger: r.trigger, kind: r.kind as DiscordCommandKind, response: r.response,
    description: r.description, enabled: r.enabled, allowedChannels: (r.allowed_channels as string[]) ?? [],
    minRoleId: u(r.min_role_id), cooldownSec: r.cooldown_sec,
  };
}
export function toDiscordCommandRow(c: DiscordCommand): TablesInsert<'discord_commands'> {
  return {
    id: c.id || undefined, trigger: c.trigger, kind: c.kind, response: c.response, description: c.description,
    enabled: c.enabled, allowed_channels: c.allowedChannels as Json, min_role_id: c.minRoleId ?? null,
    cooldown_sec: c.cooldownSec, updated_at: new Date().toISOString(),
  };
}
export function fromDiscordRouteRow(r: Tables<'discord_routes'>): DiscordRoute {
  return { kind: r.kind, mode: r.mode as DiscordRouteMode, channelId: u(r.channel_id) };
}
export function toDiscordRouteRow(d: DiscordRoute): TablesInsert<'discord_routes'> {
  return { kind: d.kind, mode: d.mode, channel_id: d.channelId ?? null, updated_at: new Date().toISOString() };
}
export function fromTicketTemplateRow(r: Tables<'ticket_templates'>): TicketTemplate {
  return { id: r.id, name: r.name, doc: r.doc as unknown as TicketTemplate['doc'], createdAt: r.created_at };
}

// ── Suivi sponsors (table privée manager) ──────────────────────────
export function fromSponsorTrackingRow(r: Tables<'sponsor_tracking'>): SponsorTracking {
  return {
    sponsorId: r.sponsor_id,
    contractStart: u(r.contract_start),
    contractEnd: u(r.contract_end),
    valueAnnual: u(r.value_annual),
    contactName: u(r.contact_name),
    contactEmail: u(r.contact_email),
    notes: u(r.notes),
  };
}
export function toSponsorTrackingRow(t: SponsorTracking): TablesInsert<'sponsor_tracking'> {
  return {
    sponsor_id: t.sponsorId,
    contract_start: t.contractStart ?? null,
    contract_end: t.contractEnd ?? null,
    value_annual: t.valueAnnual ?? null,
    contact_name: t.contactName ?? null,
    contact_email: t.contactEmail ?? null,
    notes: t.notes ?? null,
  };
}

// ── Demandes graphiques ────────────────────────────────────────────
export function fromDesignRequestRow(r: Tables<'design_requests'>): DesignRequest {
  return {
    id: r.id,
    title: r.title,
    brief: u(r.brief),
    kind: r.kind as DesignKind,
    status: r.status as DesignStatus,
    due: u(r.due),
    assetUrl: u(r.asset_url),
    createdAt: r.created_at,
  };
}
export function toDesignRequestRow(d: Partial<DesignRequest>): TablesInsert<'design_requests'> {
  return {
    id: d.id,
    title: d.title ?? '',
    brief: d.brief ?? null,
    kind: d.kind ?? 'autre',
    status: d.status ?? 'todo',
    due: d.due ?? null,
    asset_url: d.assetUrl ?? null,
  };
}

// ── Finance (admin uniquement) ─────────────────────────────────────
export function fromTransactionRow(r: Tables<'transactions'>): Transaction {
  return {
    id: r.id,
    kind: r.kind as TransactionKind,
    category: r.category,
    label: r.label,
    amount: Number(r.amount),
    date: r.tx_date,
    sponsorId: u(r.sponsor_id),
    notes: u(r.notes),
  };
}
export function toTransactionRow(t: Partial<Transaction>): TablesInsert<'transactions'> {
  return {
    id: t.id,
    kind: t.kind ?? 'depense',
    category: t.category ?? '',
    label: t.label ?? '',
    amount: t.amount ?? 0,
    tx_date: t.date ?? new Date().toISOString().slice(0, 10),
    sponsor_id: t.sponsorId ?? null,
    notes: t.notes ?? null,
  };
}

// ── Recrutement / tryouts ──────────────────────────────────────────
export function fromTryoutCampaignRow(r: Tables<'tryout_campaigns'>): TryoutCampaign {
  return {
    id: r.id,
    title: r.title,
    gameId: u(r.game_id),
    roleSought: u(r.role_sought),
    description: u(r.description),
    opensAt: u(r.opens_at),
    closesAt: u(r.closes_at),
    status: r.status as TryoutCampaignStatus,
    createdAt: r.created_at,
  };
}
export function toTryoutCampaignRow(c: Partial<TryoutCampaign>): TablesInsert<'tryout_campaigns'> {
  return {
    id: c.id ?? '',
    title: c.title ?? '',
    game_id: c.gameId ?? null,
    role_sought: c.roleSought ?? null,
    description: c.description ?? null,
    opens_at: c.opensAt ?? null,
    closes_at: c.closesAt ?? null,
    status: c.status ?? 'ouverte',
  };
}

export function fromCandidateRow(r: Tables<'candidates'>): Candidate {
  return {
    id: r.id,
    campaignId: r.campaign_id,
    pseudo: r.pseudo,
    firstName: u(r.first_name),
    lastName: u(r.last_name),
    discord: u(r.discord),
    email: u(r.email),
    roleApplied: u(r.role_applied),
    rankCurrent: u(r.rank_current),
    notes: u(r.notes),
    status: r.status as CandidateStatus,
    publicToken: r.public_token,
    createdAt: r.created_at,
    decidedAt: u(r.decided_at),
    decidedBy: u(r.decided_by),
    convertedPlayerId: u(r.converted_player_id),
  };
}
/** N'écrit jamais public_token (généré côté DB, jamais réassignable depuis le client). */
export function toCandidateRow(c: Partial<Candidate>): TablesInsert<'candidates'> {
  return {
    id: c.id ?? '',
    campaign_id: c.campaignId ?? '',
    pseudo: c.pseudo ?? '',
    first_name: c.firstName ?? null,
    last_name: c.lastName ?? null,
    discord: c.discord ?? null,
    email: c.email ?? null,
    role_applied: c.roleApplied ?? null,
    rank_current: c.rankCurrent ?? null,
    notes: c.notes ?? null,
    status: c.status ?? 'nouveau',
    decided_at: c.decidedAt ?? null,
    decided_by: c.decidedBy ?? null,
  };
}

export function fromCandidateEvaluationRow(r: Tables<'candidate_evaluations'>): CandidateEvaluation {
  return {
    id: r.id,
    candidateId: r.candidate_id,
    authorId: r.author_id,
    rating: r.rating,
    recommendation: r.recommendation as CandidateRecommendation,
    body: r.body,
    createdAt: r.created_at,
  };
}
export function toCandidateEvaluationRow(e: Partial<CandidateEvaluation>): TablesInsert<'candidate_evaluations'> {
  return {
    id: e.id ?? '',
    candidate_id: e.candidateId ?? '',
    author_id: e.authorId ?? '',
    rating: e.rating ?? 3,
    recommendation: e.recommendation ?? 'mitige',
    body: e.body ?? '',
  };
}

export function fromCandidateAvailabilityRow(r: Tables<'candidate_availability'>): CandidateAvailability {
  return {
    id: r.id,
    candidateId: r.candidate_id,
    day: r.day,
    startTime: hhmm(r.start_time) ?? '',
    endTime: hhmm(r.end_time) ?? '',
  };
}
/** Correction manuelle par le staff (le flux normal passe par le lien public / RPC). */
export function toCandidateAvailabilityRow(a: Partial<CandidateAvailability>): TablesInsert<'candidate_availability'> {
  return {
    id: a.id ?? '',
    candidate_id: a.candidateId ?? '',
    day: a.day ?? '',
    start_time: a.startTime ?? '00:00',
    end_time: a.endTime ?? '00:00',
  };
}

export function fromSessionCandidateRow(r: Tables<'session_candidates'>): SessionCandidate {
  return { sessionId: r.session_id, candidateId: r.candidate_id, status: r.status as CandidateSessionStatus };
}
export function toSessionCandidateRow(s: SessionCandidate): TablesInsert<'session_candidates'> {
  return { session_id: s.sessionId, candidate_id: s.candidateId, status: s.status };
}
