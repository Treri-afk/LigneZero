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
