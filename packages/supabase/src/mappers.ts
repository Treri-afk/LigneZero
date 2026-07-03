/**
 * Conversion entre les lignes DB (snake_case, jsonb) et les types domaine
 * (camelCase) de @lignezero/types. Un couple « from… / to… » par entité :
 *   from<Entity>Row  : Row  → domaine (lecture, vitrine)
 *   to<Entity>Row    : domaine → Insert (écriture, manager)
 * Les objets imbriqués sont stockés en jsonb → cast au passage.
 */
import type {
  Game,
  Player,
  Staff,
  Sponsor,
  SponsorDossier,
  Match,
  MatchOpponent,
  MatchScore,
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
import type { Tables, TablesInsert } from './database.types';

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
  return { ownerId: r.owner_id, discordHandle: u(r.discord_handle), twitchHandle: u(r.twitch_handle) };
}
export function toMemberLinksRow(m: MemberLinks): TablesInsert<'member_links'> {
  return { owner_id: m.ownerId, discord_handle: m.discordHandle ?? null, twitch_handle: m.twitchHandle ?? null };
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
