/**
 * Requêtes typées, retournant/acceptant des types domaine (@lignezero/types).
 * Lecture : listes triées par sort_order (contenu) ou date (matchs).
 * Écriture (manager) : upsert / remove. Les RLS imposent le rôle staff.
 */
import type {
  BrandSettings,
  Tournament,
  TournamentFull,
  TournamentTeam,
  TournamentPlayer,
  TournamentStage,
  TournamentMatch,
  TournamentLobby,
  LobbyEntry,
  Game,
  Player,
  Staff,
  Sponsor,
  Match,
  MatchTicket,
  Creator,
  Clip,
  Product,
  Profile,
  UserRole,
  Announcement,
  Objective,
  ObjectiveStatus,
  Feedback,
  Session,
  SessionRsvp,
  Availability,
  VideoReview,
  VideoAnnotation,
  MatchPlayerStat,
  Strat,
  InventoryItem,
  FavoriteMatch,
  MemberLinks,
  BotConfig,
  BotCommand,
  BotEvent,
  BotTimer,
  BotQuote,
  ViewerPoints,
  BotReward,
  RewardRedemption,
  RedemptionStatus,
  BotAlert,
  MatchPrediction,
  PredictionBet,
  PredictionStatus,
  PredictionTally,
  BotNotification,
  DiscordCommand,
  DiscordRoute,
  TicketTemplate,
  SponsorStatus,
  SponsorTracking,
  DesignRequest,
  DesignStatus,
  Transaction,
  TryoutCampaign,
  Candidate,
  CandidateStatus,
  CandidateEvaluation,
  CandidateAvailability,
  SessionCandidate,
  ValorantMap,
  ValorantAgent,
  ValorantAbility,
} from '@lignezero/types';
// Valeur (pas un type) : repli quand la table de marque n'est pas renseignée.
import { DEFAULT_BRAND } from '@lignezero/types';
import type { LigneZeroClient } from './client';
import {
  fromTournamentRow,
  toTournamentRow,
  fromTournamentTeamRow,
  toTournamentTeamRow,
  fromTournamentPlayerRow,
  toTournamentPlayerRow,
  fromTournamentStageRow,
  toTournamentStageRow,
  fromTournamentMatchRow,
  toTournamentMatchRow,
  fromLobbyRow,
  toLobbyRow,
  fromLobbyEntryRow,
  toLobbyEntryRow,
  fromBrandSettingsRow,
  toBrandSettingsRow,
  fromGameRow,
  fromPlayerRow,
  fromStaffRow,
  fromSponsorRow,
  fromMatchRow,
  fromCreatorRow,
  fromClipRow,
  fromProductRow,
  toGameRow,
  toPlayerRow,
  toStaffRow,
  toSponsorRow,
  toMatchRow,
  toCreatorRow,
  toClipRow,
  toProductRow,
  fromProfileRow,
  fromAnnouncementRow,
  toAnnouncementRow,
  fromObjectiveRow,
  toObjectiveRow,
  fromFeedbackRow,
  toFeedbackRow,
  fromSessionRow,
  toSessionRow,
  fromRsvpRow,
  toRsvpRow,
  fromAvailabilityRow,
  toAvailabilityRow,
  fromVideoReviewRow,
  toVideoReviewRow,
  fromVideoAnnotationRow,
  toVideoAnnotationRow,
  fromMatchPlayerStatRow,
  toMatchPlayerStatRow,
  fromStratRow,
  toStratRow,
  fromInventoryItemRow,
  fromFavoriteMatchRow,
  toFavoriteMatchRow,
  fromMemberLinksRow,
  toMemberLinksRow,
  fromBotConfigRow,
  toBotConfigRow,
  fromBotCommandRow,
  toBotCommandRow,
  fromBotEventRow,
  fromBotTimerRow,
  toBotTimerRow,
  fromBotQuoteRow,
  fromViewerPointsRow,
  fromBotRewardRow,
  toBotRewardRow,
  fromRewardRedemptionRow,
  fromBotAlertRow,
  toBotAlertRow,
  fromMatchPredictionRow,
  fromPredictionBetRow,
  fromBotNotificationRow,
  fromDiscordCommandRow,
  toDiscordCommandRow,
  fromDiscordRouteRow,
  toDiscordRouteRow,
  fromTicketTemplateRow,
  fromSponsorTrackingRow,
  toSponsorTrackingRow,
  fromDesignRequestRow,
  toDesignRequestRow,
  fromTransactionRow,
  toTransactionRow,
  fromTryoutCampaignRow,
  toTryoutCampaignRow,
  fromCandidateRow,
  toCandidateRow,
  fromCandidateEvaluationRow,
  toCandidateEvaluationRow,
  fromCandidateAvailabilityRow,
  toCandidateAvailabilityRow,
  fromSessionCandidateRow,
  toSessionCandidateRow,
  fromValorantMapRow,
  toValorantMapRow,
  fromValorantAgentRow,
  toValorantAgentRow,
  fromValorantAbilityRow,
  toValorantAbilityRow,
} from './mappers';

function unwrap<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(`[supabase] ${error.message}`);
  return data as T;
}

export function createQueries(sb: LigneZeroClient) {
  return {
    // ── Games ──
    async listGames(): Promise<Game[]> {
      const { data, error } = await sb.from('games').select('*').order('sort_order');
      return unwrap(data, error).map(fromGameRow);
    },
    async upsertGame(g: Game, sortOrder?: number): Promise<void> {
      const { error } = await sb.from('games').upsert(toGameRow(g, sortOrder ?? 0));
      unwrap(null, error);
    },
    async removeGame(id: string): Promise<void> {
      const { error } = await sb.from('games').delete().eq('id', id);
      unwrap(null, error);
    },

    // ── Players ──
    async listPlayers(): Promise<Player[]> {
      const { data, error } = await sb.from('players').select('*').order('sort_order');
      return unwrap(data, error).map(fromPlayerRow);
    },
    async listPlayersByGame(gameId: string): Promise<Player[]> {
      const { data, error } = await sb
        .from('players')
        .select('*')
        .eq('game_id', gameId)
        .order('sort_order');
      return unwrap(data, error).map(fromPlayerRow);
    },
    async upsertPlayer(p: Player, sortOrder?: number): Promise<void> {
      const { error } = await sb.from('players').upsert(toPlayerRow(p, sortOrder ?? 0));
      unwrap(null, error);
    },
    async removePlayer(id: string): Promise<void> {
      const { error } = await sb.from('players').delete().eq('id', id);
      unwrap(null, error);
    },
    /** MAJ profil joueur (sous-ensemble éditable par le joueur lui-même). */
    async updatePlayerProfile(
      id: string,
      f: {
        pseudo: string;
        firstName?: string;
        lastName?: string;
        country?: string;
        color?: string;
        photo?: string;
        socials: Player['socials'];
        setup: Player['setup'];
      },
    ): Promise<void> {
      const { error } = await sb
        .from('players')
        .update({
          pseudo: f.pseudo,
          first_name: f.firstName ?? null,
          last_name: f.lastName ?? null,
          country: f.country ?? null,
          color: f.color ?? null,
          photo: f.photo ?? null,
          socials: (f.socials ?? []) as unknown as import('./database.types').TablesInsert<'players'>['socials'],
          setup: (f.setup ?? []) as unknown as import('./database.types').TablesInsert<'players'>['setup'],
        })
        .eq('id', id);
      unwrap(null, error);
    },

    // ── Staff ──
    async listStaff(): Promise<Staff[]> {
      const { data, error } = await sb.from('staff').select('*').order('sort_order');
      return unwrap(data, error).map(fromStaffRow);
    },
    async upsertStaff(s: Staff, sortOrder?: number): Promise<void> {
      const { error } = await sb.from('staff').upsert(toStaffRow(s, sortOrder ?? 0));
      unwrap(null, error);
    },
    async removeStaff(id: string): Promise<void> {
      const { error } = await sb.from('staff').delete().eq('id', id);
      unwrap(null, error);
    },

    // ── Sponsors ──
    async listSponsors(): Promise<Sponsor[]> {
      const { data, error } = await sb.from('sponsors').select('*').order('sort_order');
      return unwrap(data, error).map(fromSponsorRow);
    },
    async upsertSponsor(s: Sponsor, sortOrder?: number): Promise<void> {
      const { error } = await sb.from('sponsors').upsert(toSponsorRow(s, sortOrder ?? 0));
      unwrap(null, error);
    },
    async removeSponsor(id: string): Promise<void> {
      const { error } = await sb.from('sponsors').delete().eq('id', id);
      unwrap(null, error);
    },

    // ── Matches ──
    async listMatches(): Promise<Match[]> {
      const { data, error } = await sb.from('matches').select('*').order('date_iso');
      return unwrap(data, error).map(fromMatchRow);
    },
    async upsertMatch(m: Match): Promise<void> {
      const { error } = await sb.from('matches').upsert(toMatchRow(m));
      unwrap(null, error);
    },
    async removeMatch(id: string): Promise<void> {
      const { error } = await sb.from('matches').delete().eq('id', id);
      unwrap(null, error);
    },
    /** Enregistre les paramètres du ticket d'un match (Studio Match). */
    async setMatchTicket(id: string, ticket: MatchTicket): Promise<void> {
      const { error } = await sb
        .from('matches')
        .update({ ticket: ticket as unknown as import('./database.types').TablesInsert<'matches'>['ticket'] })
        .eq('id', id);
      unwrap(null, error);
    },

    // ── Creators ──
    async listCreators(): Promise<Creator[]> {
      const { data, error } = await sb.from('creators').select('*').order('sort_order');
      return unwrap(data, error).map(fromCreatorRow);
    },
    async upsertCreator(c: Creator, sortOrder?: number): Promise<void> {
      const { error } = await sb.from('creators').upsert(toCreatorRow(c, sortOrder ?? 0));
      unwrap(null, error);
    },
    async removeCreator(id: string): Promise<void> {
      const { error } = await sb.from('creators').delete().eq('id', id);
      unwrap(null, error);
    },

    // ── Clips ──
    async listClips(): Promise<Clip[]> {
      const { data, error } = await sb.from('clips').select('*').order('sort_order');
      return unwrap(data, error).map(fromClipRow);
    },
    async upsertClip(c: Clip, sortOrder?: number): Promise<void> {
      const { error } = await sb.from('clips').upsert(toClipRow(c, sortOrder ?? 0));
      unwrap(null, error);
    },
    async removeClip(id: string): Promise<void> {
      const { error } = await sb.from('clips').delete().eq('id', id);
      unwrap(null, error);
    },

    // ── Products ──
    async listProducts(): Promise<Product[]> {
      const { data, error } = await sb.from('products').select('*').order('sort_order');
      return unwrap(data, error).map(fromProductRow);
    },
    async upsertProduct(p: Product, sortOrder?: number): Promise<void> {
      const { error } = await sb.from('products').upsert(toProductRow(p, sortOrder ?? 0));
      unwrap(null, error);
    },
    async removeProduct(id: string): Promise<void> {
      const { error } = await sb.from('products').delete().eq('id', id);
      unwrap(null, error);
    },

    // ── Profiles / rôles ──
    async myProfile(): Promise<Profile | null> {
      const { data } = await sb.auth.getUser();
      const uid = data.user?.id;
      if (!uid) return null;
      const { data: row } = await sb.from('profiles').select('*').eq('id', uid).single();
      return row ? fromProfileRow(row) : null;
    },
    async listProfiles(): Promise<Profile[]> {
      const { data, error } = await sb.from('profiles').select('*').order('created_at');
      return unwrap(data, error).map(fromProfileRow);
    },
    async setRole(id: string, role: UserRole): Promise<void> {
      const { error } = await sb.from('profiles').update({ role }).eq('id', id);
      unwrap(null, error);
    },
    async linkPlayer(id: string, playerId: string | null): Promise<void> {
      const { error } = await sb.from('profiles').update({ player_id: playerId }).eq('id', id);
      unwrap(null, error);
    },

    // ── Announcements ──
    async listAnnouncements(): Promise<Announcement[]> {
      const { data, error } = await sb.from('announcements').select('*').order('created_at', { ascending: false });
      return unwrap(data, error).map(fromAnnouncementRow);
    },
    async upsertAnnouncement(a: Partial<Announcement>): Promise<void> {
      const { error } = await sb.from('announcements').upsert(toAnnouncementRow(a));
      unwrap(null, error);
    },
    async removeAnnouncement(id: string): Promise<void> {
      const { error } = await sb.from('announcements').delete().eq('id', id);
      unwrap(null, error);
    },

    // ── Objectives ──
    async listObjectives(): Promise<Objective[]> {
      const { data, error } = await sb.from('objectives').select('*').order('created_at', { ascending: false });
      return unwrap(data, error).map(fromObjectiveRow);
    },
    async upsertObjective(o: Partial<Objective>): Promise<void> {
      const { error } = await sb.from('objectives').upsert(toObjectiveRow(o));
      unwrap(null, error);
    },
    async setObjectiveStatus(id: string, status: ObjectiveStatus): Promise<void> {
      const { error } = await sb.from('objectives').update({ status }).eq('id', id);
      unwrap(null, error);
    },
    async removeObjective(id: string): Promise<void> {
      const { error } = await sb.from('objectives').delete().eq('id', id);
      unwrap(null, error);
    },

    // ── Feedback ──
    async listFeedback(): Promise<Feedback[]> {
      const { data, error } = await sb.from('feedback').select('*').order('created_at', { ascending: false });
      return unwrap(data, error).map(fromFeedbackRow);
    },
    async upsertFeedback(f: Partial<Feedback>): Promise<void> {
      const { error } = await sb.from('feedback').upsert(toFeedbackRow(f));
      unwrap(null, error);
    },
    async ackFeedback(id: string, reply?: string): Promise<void> {
      const { error } = await sb.from('feedback').update({ acknowledged: true, reply: reply ?? null }).eq('id', id);
      unwrap(null, error);
    },
    async removeFeedback(id: string): Promise<void> {
      const { error } = await sb.from('feedback').delete().eq('id', id);
      unwrap(null, error);
    },

    // ── Sessions ──
    async listSessions(): Promise<Session[]> {
      const { data, error } = await sb.from('sessions').select('*').order('starts_at');
      return unwrap(data, error).map(fromSessionRow);
    },
    async upsertSession(s: Partial<Session>): Promise<void> {
      const { error } = await sb.from('sessions').upsert(toSessionRow(s));
      unwrap(null, error);
    },
    async removeSession(id: string): Promise<void> {
      const { error } = await sb.from('sessions').delete().eq('id', id);
      unwrap(null, error);
    },

    // ── RSVP ──
    async listRsvp(): Promise<SessionRsvp[]> {
      const { data, error } = await sb.from('session_rsvp').select('*');
      return unwrap(data, error).map(fromRsvpRow);
    },
    async setRsvp(r: SessionRsvp): Promise<void> {
      const { error } = await sb.from('session_rsvp').upsert(toRsvpRow(r));
      unwrap(null, error);
    },

    // ── Availability ──
    async listAvailability(): Promise<Availability[]> {
      const { data, error } = await sb.from('availability').select('*').order('day');
      return unwrap(data, error).map(fromAvailabilityRow);
    },
    /** Ajoute un créneau (ou met à jour si un id est fourni). */
    async upsertAvailability(a: Partial<Availability>): Promise<void> {
      const { error } = await sb.from('availability').upsert(toAvailabilityRow(a));
      unwrap(null, error);
    },
    async removeAvailability(id: string): Promise<void> {
      const { error } = await sb.from('availability').delete().eq('id', id);
      unwrap(null, error);
    },

    // ── Revue vidéo ──
    async listVideoReviews(): Promise<VideoReview[]> {
      const { data, error } = await sb.from('video_reviews').select('*').order('created_at', { ascending: false });
      return unwrap(data, error).map(fromVideoReviewRow);
    },
    async upsertVideoReview(v: Partial<VideoReview>): Promise<void> {
      const { error } = await sb.from('video_reviews').upsert(toVideoReviewRow(v));
      unwrap(null, error);
    },
    async removeVideoReview(id: string): Promise<void> {
      const { error } = await sb.from('video_reviews').delete().eq('id', id);
      unwrap(null, error);
    },
    async listVideoAnnotations(reviewId?: string): Promise<VideoAnnotation[]> {
      let q = sb.from('video_annotations').select('*').order('timestamp_sec');
      if (reviewId) q = q.eq('review_id', reviewId);
      const { data, error } = await q;
      return unwrap(data, error).map(fromVideoAnnotationRow);
    },
    async upsertVideoAnnotation(a: Partial<VideoAnnotation>): Promise<void> {
      const { error } = await sb.from('video_annotations').upsert(toVideoAnnotationRow(a));
      unwrap(null, error);
    },
    async removeVideoAnnotation(id: string): Promise<void> {
      const { error } = await sb.from('video_annotations').delete().eq('id', id);
      unwrap(null, error);
    },

    // ── Stats par match ──
    async listMatchStats(matchId?: string): Promise<MatchPlayerStat[]> {
      let q = sb.from('match_player_stats').select('*');
      if (matchId) q = q.eq('match_id', matchId);
      const { data, error } = await q;
      return unwrap(data, error).map(fromMatchPlayerStatRow);
    },
    async upsertMatchStat(s: Partial<MatchPlayerStat>): Promise<void> {
      const { error } = await sb.from('match_player_stats').upsert(toMatchPlayerStatRow(s), { onConflict: 'match_id,player_id' });
      unwrap(null, error);
    },
    async removeMatchStat(id: string): Promise<void> {
      const { error } = await sb.from('match_player_stats').delete().eq('id', id);
      unwrap(null, error);
    },

    // ── Strats ──
    async listStrats(): Promise<Strat[]> {
      const { data, error } = await sb.from('strats').select('*').order('created_at', { ascending: false });
      return unwrap(data, error).map(fromStratRow);
    },
    async upsertStrat(s: Strat): Promise<void> {
      const { error } = await sb.from('strats').upsert(toStratRow(s));
      unwrap(null, error);
    },
    async removeStrat(id: string): Promise<void> {
      const { error } = await sb.from('strats').delete().eq('id', id);
      unwrap(null, error);
    },

    // ── Compte membre (site) ──
    /** RLS filtre déjà sur le propriétaire — pas besoin de connaître son uid ici. */
    async listMyInventory(): Promise<InventoryItem[]> {
      const { data, error } = await sb.from('inventory_items').select('*').order('obtained_at', { ascending: false });
      return unwrap(data, error).map(fromInventoryItemRow);
    },
    async listMyFavorites(): Promise<FavoriteMatch[]> {
      const { data, error } = await sb.from('favorite_matches').select('*');
      return unwrap(data, error).map(fromFavoriteMatchRow);
    },
    async addFavorite(matchId: string): Promise<void> {
      const { data: u } = await sb.auth.getUser();
      const uid = u.user?.id;
      if (!uid) throw new Error('[supabase] Non connecté.');
      const { error } = await sb.from('favorite_matches').insert(toFavoriteMatchRow({ ownerId: uid, matchId }));
      unwrap(null, error);
    },
    async removeFavorite(matchId: string): Promise<void> {
      const { data: u } = await sb.auth.getUser();
      const uid = u.user?.id;
      if (!uid) throw new Error('[supabase] Non connecté.');
      const { error } = await sb.from('favorite_matches').delete().eq('owner_id', uid).eq('match_id', matchId);
      unwrap(null, error);
    },
    async getMyLinks(): Promise<MemberLinks | null> {
      const { data: u } = await sb.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return null;
      const { data, error } = await sb.from('member_links').select('*').eq('owner_id', uid).maybeSingle();
      if (error) throw new Error(`[supabase] ${error.message}`);
      return data ? fromMemberLinksRow(data) : null;
    },
    async upsertMyLinks(links: Omit<MemberLinks, 'ownerId'>): Promise<void> {
      const { data: u } = await sb.auth.getUser();
      const uid = u.user?.id;
      if (!uid) throw new Error('[supabase] Non connecté.');
      const { error } = await sb.from('member_links').upsert(toMemberLinksRow({ ownerId: uid, ...links }));
      unwrap(null, error);
    },
    /**
     * Synchronise member_links depuis les identités OAuth liées (Twitch/Discord).
     * Appelé après un linkIdentity : renseigne handle + user_id fiables pour le bot.
     */
    async syncMyLinksFromIdentities(): Promise<MemberLinks | null> {
      const { data: u } = await sb.auth.getUser();
      const uid = u.user?.id;
      if (!uid) throw new Error('[supabase] Non connecté.');
      const identities = u.user?.identities ?? [];
      const pick = (provider: string) => identities.find((i) => i.provider === provider);
      const idData = (i?: { identity_data?: Record<string, unknown> | null }) => (i?.identity_data ?? {}) as Record<string, unknown>;
      const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);
      const tw = pick('twitch');
      const dc = pick('discord');
      const twd = idData(tw);
      const dcd = idData(dc);
      const { data: exRow } = await sb.from('member_links').select('*').eq('owner_id', uid).maybeSingle();
      const existing = exRow ? fromMemberLinksRow(exRow) : null;
      const next: MemberLinks = {
        ownerId: uid,
        twitchHandle: str(twd.preferred_username) ?? str(twd.nickname) ?? str(twd.name) ?? existing?.twitchHandle,
        twitchUserId: tw?.id ?? str(twd.sub) ?? existing?.twitchUserId,
        discordHandle: str(dcd.preferred_username) ?? str(dcd.full_name) ?? str(dcd.name) ?? existing?.discordHandle,
        discordUserId: dc?.id ?? str(dcd.sub) ?? str(dcd.provider_id) ?? existing?.discordUserId,
      };
      const { error } = await sb.from('member_links').upsert(toMemberLinksRow(next));
      unwrap(null, error);
      return next;
    },

    // ── Prédictions côté vitrine (widget live) ──
    async getOpenPrediction(): Promise<MatchPrediction | null> {
      const { data, error } = await sb.from('match_predictions').select('*').in('status', ['open', 'locked']).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data ? fromMatchPredictionRow(data) : null;
    },
    async predictionTally(id: string): Promise<PredictionTally | null> {
      const { data, error } = await sb.rpc('prediction_tally', { p_prediction_id: id });
      if (error) throw error;
      return (data as unknown as PredictionTally) ?? null;
    },
    /** Solde de points du membre connecté (via son login Twitch lié). */
    async getMyPoints(): Promise<{ linked: boolean; login?: string; points: number; watchMinutes: number }> {
      const { data, error } = await sb.rpc('my_points');
      if (error) throw error;
      const r = (data ?? { linked: false }) as { linked: boolean; login?: string; points?: number; watch_minutes?: number };
      return { linked: r.linked, login: r.login, points: r.points ?? 0, watchMinutes: r.watch_minutes ?? 0 };
    },
    /** Place une mise depuis la vitrine (nécessite un compte Twitch lié). */
    async placeMyBet(predictionId: string, optionIndex: number, amount: number): Promise<{ ok: boolean; reason?: string; remaining?: number }> {
      const { data: u } = await sb.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return { ok: false, reason: 'not_signed_in' };
      const { data: lk } = await sb.from('member_links').select('twitch_handle').eq('owner_id', uid).maybeSingle();
      const login = lk?.twitch_handle;
      if (!login) return { ok: false, reason: 'not_linked' };
      const { data, error } = await sb.rpc('place_bet', { p_login: login.toLowerCase(), p_owner: uid, p_prediction_id: predictionId, p_option: optionIndex, p_amount: amount });
      if (error) throw error;
      return (data ?? { ok: false }) as unknown as { ok: boolean; reason?: string; remaining?: number };
    },

    // ── Tournois organisés (lecture publique hors brouillons) ──
    async listTournaments(): Promise<Tournament[]> {
      const { data, error } = await sb.from('tournaments').select('*').order('starts_at', { ascending: false });
      return unwrap(data, error).map(fromTournamentRow);
    },
    /** Tournoi + équipes + joueurs + phases + matchs, en une passe. */
    async getTournament(slug: string): Promise<TournamentFull | null> {
      const { data: t, error } = await sb.from('tournaments').select('*').eq('slug', slug).maybeSingle();
      if (error) throw error;
      if (!t) return null;
      const [teams, stages, matches, lobbies] = await Promise.all([
        sb.from('tournament_teams').select('*').eq('tournament_id', t.id).order('seed', { nullsFirst: false }),
        sb.from('tournament_stages').select('*').eq('tournament_id', t.id).order('sort_order'),
        sb.from('tournament_matches').select('*').eq('tournament_id', t.id).order('round').order('position'),
        sb.from('tournament_lobbies').select('*').eq('tournament_id', t.id).order('round').order('position'),
      ]);
      const teamRows = unwrap(teams.data, teams.error).map(fromTournamentTeamRow);
      // Les joueurs arrivent en une requête puis sont répartis dans leur équipe,
      // pour éviter une requête par équipe.
      if (teamRows.length) {
        const { data: pl, error: plErr } = await sb
          .from('tournament_players')
          .select('*')
          .in('team_id', teamRows.map((x) => x.id))
          .order('sort_order');
        const players = unwrap(pl, plErr).map(fromTournamentPlayerRow);
        for (const team of teamRows) team.players = players.filter((x) => x.teamId === team.id);
      }
      // Les participations arrivent en une requête puis sont réparties dans
      // leur lobby — même logique que les joueurs, pour éviter N requêtes.
      const lobbyRows = unwrap(lobbies.data, lobbies.error).map(fromLobbyRow);
      if (lobbyRows.length) {
        const { data: en, error: enErr } = await sb
          .from('tournament_lobby_entries')
          .select('*')
          .in('lobby_id', lobbyRows.map((x) => x.id))
          .order('sort_order');
        const entries = unwrap(en, enErr).map(fromLobbyEntryRow);
        for (const lob of lobbyRows) lob.entries = entries.filter((e) => e.lobbyId === lob.id);
      }

      return {
        ...fromTournamentRow(t),
        teams: teamRows,
        stages: unwrap(stages.data, stages.error).map(fromTournamentStageRow),
        matches: unwrap(matches.data, matches.error).map(fromTournamentMatchRow),
        lobbies: lobbyRows,
      };
    },
    async upsertTournament(t: Tournament): Promise<void> {
      const { error } = await sb.from('tournaments').upsert(toTournamentRow(t));
      unwrap(null, error);
    },
    async deleteTournament(id: string): Promise<void> {
      const { error } = await sb.from('tournaments').delete().eq('id', id);
      unwrap(null, error);
    },
    async upsertTournamentTeam(t: TournamentTeam): Promise<void> {
      const { error } = await sb.from('tournament_teams').upsert(toTournamentTeamRow(t));
      unwrap(null, error);
    },
    async deleteTournamentTeam(id: string): Promise<void> {
      const { error } = await sb.from('tournament_teams').delete().eq('id', id);
      unwrap(null, error);
    },
    async upsertTournamentPlayer(p: TournamentPlayer): Promise<void> {
      const { error } = await sb.from('tournament_players').upsert(toTournamentPlayerRow(p));
      unwrap(null, error);
    },
    async deleteTournamentPlayer(id: string): Promise<void> {
      const { error } = await sb.from('tournament_players').delete().eq('id', id);
      unwrap(null, error);
    },
    async upsertTournamentStage(st: TournamentStage): Promise<void> {
      const { error } = await sb.from('tournament_stages').upsert(toTournamentStageRow(st));
      unwrap(null, error);
    },
    /** Écriture en lot : génération d'un arbre complet en une requête. */
    async upsertTournamentMatches(list: TournamentMatch[]): Promise<void> {
      if (!list.length) return;
      const { error } = await sb.from('tournament_matches').upsert(list.map(toTournamentMatchRow));
      unwrap(null, error);
    },
    async upsertTournamentLobbies(list: TournamentLobby[]): Promise<void> {
      if (!list.length) return;
      const { error } = await sb.from('tournament_lobbies').upsert(list.map(toLobbyRow));
      unwrap(null, error);
    },
    async upsertLobbyEntries(list: LobbyEntry[]): Promise<void> {
      if (!list.length) return;
      const { error } = await sb.from('tournament_lobby_entries').upsert(list.map(toLobbyEntryRow));
      unwrap(null, error);
    },
    /** Supprime les lobbies d'un round (ou tous si `round` est omis). */
    async deleteTournamentLobbies(tournamentId: string, round?: number): Promise<void> {
      let q = sb.from('tournament_lobbies').delete().eq('tournament_id', tournamentId);
      if (round != null) q = q.eq('round', round);
      const { error } = await q;
      unwrap(null, error);
    },
    async deleteTournamentMatches(tournamentId: string): Promise<void> {
      const { error } = await sb.from('tournament_matches').delete().eq('tournament_id', tournamentId);
      unwrap(null, error);
    },

    // ── Identité de marque (lecture publique, écriture admin) ──
    /** Ligne unique. Renvoie les valeurs par défaut si elle manque, pour que la
     *  vitrine reste affichable même sans configuration. */
    async getBrandSettings(): Promise<BrandSettings> {
      const { data, error } = await sb.from('brand_settings').select('*').eq('id', 'default').maybeSingle();
      if (error) throw error;
      return data ? fromBrandSettingsRow(data) : DEFAULT_BRAND;
    },
    async setBrandSettings(b: BrandSettings): Promise<void> {
      const { error } = await sb.from('brand_settings').upsert(toBrandSettingsRow(b));
      unwrap(null, error);
    },

    // ── Bot Twitch (admin/manager) ──
    async getBotConfig(): Promise<BotConfig | null> {
      const { data, error } = await sb.from('bot_config').select('*').eq('id', true).maybeSingle();
      if (error) throw error;
      return data ? fromBotConfigRow(data) : null;
    },
    async setBotConfig(cfg: BotConfig): Promise<void> {
      const { error } = await sb.from('bot_config').upsert(toBotConfigRow(cfg));
      unwrap(null, error);
    },
    async listBotCommands(): Promise<BotCommand[]> {
      const { data, error } = await sb.from('bot_commands').select('*').order('trigger');
      return unwrap(data, error).map(fromBotCommandRow);
    },
    async upsertBotCommand(c: BotCommand): Promise<void> {
      const { error } = await sb.from('bot_commands').upsert(toBotCommandRow(c));
      unwrap(null, error);
    },
    async removeBotCommand(id: string): Promise<void> {
      const { error } = await sb.from('bot_commands').delete().eq('id', id);
      unwrap(null, error);
    },
    async listBotEvents(limit = 100): Promise<BotEvent[]> {
      const { data, error } = await sb.from('bot_events').select('*').order('created_at', { ascending: false }).limit(limit);
      return unwrap(data, error).map(fromBotEventRow);
    },
    async listBotTimers(): Promise<BotTimer[]> {
      const { data, error } = await sb.from('bot_timers').select('*').order('created_at');
      return unwrap(data, error).map(fromBotTimerRow);
    },
    async upsertBotTimer(t: BotTimer): Promise<void> {
      const { error } = await sb.from('bot_timers').upsert(toBotTimerRow(t));
      unwrap(null, error);
    },
    async removeBotTimer(id: string): Promise<void> {
      const { error } = await sb.from('bot_timers').delete().eq('id', id);
      unwrap(null, error);
    },
    async listBotQuotes(): Promise<BotQuote[]> {
      const { data, error } = await sb.from('bot_quotes').select('*').order('id', { ascending: false });
      return unwrap(data, error).map(fromBotQuoteRow);
    },
    async addBotQuote(text: string, addedBy?: string): Promise<void> {
      const { error } = await sb.from('bot_quotes').insert({ text, added_by: addedBy ?? null });
      unwrap(null, error);
    },
    async removeBotQuote(id: number): Promise<void> {
      const { error } = await sb.from('bot_quotes').delete().eq('id', id);
      unwrap(null, error);
    },
    async listViewerPoints(limit = 20): Promise<ViewerPoints[]> {
      const { data, error } = await sb.from('viewer_points').select('*').order('points', { ascending: false }).limit(limit);
      return unwrap(data, error).map(fromViewerPointsRow);
    },
    /** Ajuste manuellement les points d'un viewer (staff). Renvoie le nouveau solde. */
    async adjustViewerPoints(login: string, delta: number): Promise<number> {
      const { data, error } = await sb.rpc('adjust_points', { p_login: login.trim().toLowerCase(), p_owner: null, p_delta: delta, p_allow_negative: true });
      if (error) throw error;
      const res = (data ?? {}) as { remaining?: number };
      return res.remaining ?? 0;
    },
    /** Diffuse une notification à tous les membres liés Discord. Renvoie le nb de destinataires. */
    async broadcastNotification(kind: string, title: string, body?: string): Promise<number> {
      const { data, error } = await sb.rpc('broadcast_notification', { p_kind: kind, p_title: title, p_body: body ?? '' });
      if (error) throw error;
      return (data as number) ?? 0;
    },

    // ── Boutique de points ──
    async listBotRewards(): Promise<BotReward[]> {
      const { data, error } = await sb.from('bot_rewards').select('*').order('sort_order');
      return unwrap(data, error).map(fromBotRewardRow);
    },
    async upsertBotReward(r: BotReward): Promise<void> {
      const { error } = await sb.from('bot_rewards').upsert(toBotRewardRow(r));
      unwrap(null, error);
    },
    async removeBotReward(id: string): Promise<void> {
      const { error } = await sb.from('bot_rewards').delete().eq('id', id);
      unwrap(null, error);
    },
    async listRedemptions(status?: RedemptionStatus): Promise<RewardRedemption[]> {
      let q = sb.from('reward_redemptions').select('*').order('created_at', { ascending: false }).limit(100);
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      return unwrap(data, error).map(fromRewardRedemptionRow);
    },
    async setRedemptionStatus(id: string, status: RedemptionStatus, note?: string): Promise<void> {
      const { error } = await sb.from('reward_redemptions').update({ status, note: note ?? null, decided_at: new Date().toISOString() }).eq('id', id);
      unwrap(null, error);
    },

    // ── Alertes ──
    async listBotAlerts(): Promise<BotAlert[]> {
      const { data, error } = await sb.from('bot_alerts').select('*').order('event_type');
      return unwrap(data, error).map(fromBotAlertRow);
    },
    async upsertBotAlert(a: BotAlert): Promise<void> {
      const { error } = await sb.from('bot_alerts').upsert(toBotAlertRow(a), { onConflict: 'event_type' });
      unwrap(null, error);
    },

    // ── Prédictions ──
    async listPredictions(): Promise<MatchPrediction[]> {
      const { data, error } = await sb.from('match_predictions').select('*').order('created_at', { ascending: false }).limit(50);
      return unwrap(data, error).map(fromMatchPredictionRow);
    },
    async createPrediction(question: string, options: string[], matchId?: string): Promise<void> {
      const { error } = await sb.from('match_predictions').insert({ question, options, match_id: matchId ?? null, status: 'open' });
      unwrap(null, error);
    },
    async setPredictionStatus(id: string, status: PredictionStatus): Promise<void> {
      const { error } = await sb.from('match_predictions').update({ status }).eq('id', id);
      unwrap(null, error);
    },
    async resolvePrediction(id: string, winningOption: number): Promise<void> {
      const { error } = await sb.rpc('resolve_prediction', { p_prediction_id: id, p_winning: winningOption });
      unwrap(null, error);
    },
    async listPredictionBets(predictionId: string): Promise<PredictionBet[]> {
      const { data, error } = await sb.from('prediction_bets').select('*').eq('prediction_id', predictionId);
      return unwrap(data, error).map(fromPredictionBetRow);
    },

    // ── Notifications (file livrée par le bot Discord) ──
    async queueNotification(n: { ownerId?: string; playerId?: string; kind: string; title: string; body?: string }): Promise<void> {
      const { error } = await sb.from('bot_notifications').insert({
        owner_id: n.ownerId ?? null, player_id: n.playerId ?? null, kind: n.kind, title: n.title, body: n.body ?? null,
      });
      unwrap(null, error);
    },
    async listNotifications(limit = 50): Promise<BotNotification[]> {
      const { data, error } = await sb.from('bot_notifications').select('*').order('created_at', { ascending: false }).limit(limit);
      return unwrap(data, error).map(fromBotNotificationRow);
    },

    // ── Bot Discord : commandes custom + routage ──
    async listDiscordCommands(): Promise<DiscordCommand[]> {
      const { data, error } = await sb.from('discord_commands').select('*').order('trigger');
      return unwrap(data, error).map(fromDiscordCommandRow);
    },
    async upsertDiscordCommand(c: DiscordCommand): Promise<void> {
      const { error } = await sb.from('discord_commands').upsert(toDiscordCommandRow(c));
      unwrap(null, error);
    },
    async removeDiscordCommand(id: string): Promise<void> {
      const { error } = await sb.from('discord_commands').delete().eq('id', id);
      unwrap(null, error);
    },
    async listDiscordRoutes(): Promise<DiscordRoute[]> {
      const { data, error } = await sb.from('discord_routes').select('*').order('kind');
      return unwrap(data, error).map(fromDiscordRouteRow);
    },
    async upsertDiscordRoute(r: DiscordRoute): Promise<void> {
      const { error } = await sb.from('discord_routes').upsert(toDiscordRouteRow(r), { onConflict: 'kind' });
      unwrap(null, error);
    },

    // ── Templates de tickets (Studio Match) ──
    async listTicketTemplates(): Promise<TicketTemplate[]> {
      const { data, error } = await sb.from('ticket_templates').select('*').order('created_at', { ascending: false });
      return unwrap(data, error).map(fromTicketTemplateRow);
    },
    async saveTicketTemplate(name: string, doc: TicketTemplate['doc']): Promise<void> {
      const { error } = await sb.from('ticket_templates').insert({ name, doc: doc as unknown as import('./database.types').Json });
      unwrap(null, error);
    },
    async removeTicketTemplate(id: string): Promise<void> {
      const { error } = await sb.from('ticket_templates').delete().eq('id', id);
      unwrap(null, error);
    },
    /** Notifie un joueur (résout le compte depuis la fiche joueur). Best-effort, n'échoue jamais. */
    async notifyPlayer(playerId: string, kind: string, title: string, body?: string): Promise<void> {
      try {
        const { data } = await sb.from('profiles').select('id').eq('player_id', playerId).maybeSingle();
        await sb.from('bot_notifications').insert({ owner_id: data?.id ?? null, player_id: playerId, kind, title, body: body ?? null });
      } catch {
        /* la notification Discord est un bonus : ne bloque jamais l'action principale */
      }
    },

    // ── Suivi sponsors (privé manager) ──
    async setSponsorStatus(id: string, status: SponsorStatus): Promise<void> {
      const { error } = await sb.from('sponsors').update({ status }).eq('id', id);
      unwrap(null, error);
    },
    async listSponsorTracking(): Promise<SponsorTracking[]> {
      const { data, error } = await sb.from('sponsor_tracking').select('*');
      return unwrap(data, error).map(fromSponsorTrackingRow);
    },
    async upsertSponsorTracking(t: SponsorTracking): Promise<void> {
      const { error } = await sb.from('sponsor_tracking').upsert(toSponsorTrackingRow(t));
      unwrap(null, error);
    },

    // ── Demandes graphiques ──
    async listDesignRequests(): Promise<DesignRequest[]> {
      const { data, error } = await sb.from('design_requests').select('*').order('created_at', { ascending: false });
      return unwrap(data, error).map(fromDesignRequestRow);
    },
    async upsertDesignRequest(d: Partial<DesignRequest>): Promise<void> {
      const { error } = await sb.from('design_requests').upsert(toDesignRequestRow(d));
      unwrap(null, error);
    },
    async setDesignStatus(id: string, status: DesignStatus): Promise<void> {
      const { error } = await sb.from('design_requests').update({ status }).eq('id', id);
      unwrap(null, error);
    },
    async removeDesignRequest(id: string): Promise<void> {
      const { error } = await sb.from('design_requests').delete().eq('id', id);
      unwrap(null, error);
    },

    // ── Finance (RLS : admin/CEO uniquement) ──
    async listTransactions(): Promise<Transaction[]> {
      const { data, error } = await sb.from('transactions').select('*').order('tx_date', { ascending: false });
      return unwrap(data, error).map(fromTransactionRow);
    },
    async upsertTransaction(t: Partial<Transaction>): Promise<void> {
      const { error } = await sb.from('transactions').upsert(toTransactionRow(t));
      unwrap(null, error);
    },
    async removeTransaction(id: string): Promise<void> {
      const { error } = await sb.from('transactions').delete().eq('id', id);
      unwrap(null, error);
    },

    // ── Tryouts / recrutement (staff) ──
    async listTryoutCampaigns(): Promise<TryoutCampaign[]> {
      const { data, error } = await sb.from('tryout_campaigns').select('*').order('created_at', { ascending: false });
      return unwrap(data, error).map(fromTryoutCampaignRow);
    },
    async upsertTryoutCampaign(c: Partial<TryoutCampaign>): Promise<void> {
      const { error } = await sb.from('tryout_campaigns').upsert(toTryoutCampaignRow(c));
      unwrap(null, error);
    },
    async removeTryoutCampaign(id: string): Promise<void> {
      const { error } = await sb.from('tryout_campaigns').delete().eq('id', id);
      unwrap(null, error);
    },

    async listCandidates(campaignId?: string): Promise<Candidate[]> {
      let q = sb.from('candidates').select('*').order('created_at', { ascending: false });
      if (campaignId) q = q.eq('campaign_id', campaignId);
      const { data, error } = await q;
      return unwrap(data, error).map(fromCandidateRow);
    },
    async upsertCandidate(c: Partial<Candidate>): Promise<void> {
      const { error } = await sb.from('candidates').upsert(toCandidateRow(c));
      unwrap(null, error);
    },
    /**
     * Change le statut d'un candidat. Si le nouveau statut est 'accepte' et
     * que le candidat n'a pas déjà une fiche joueur liée, en crée une
     * automatiquement (id `p-<candidateId>`, à partir de pseudo/nom/poste/jeu
     * de campagne). Le compte auth/profil reste manuel (le candidat n'a pas
     * de session tant qu'il ne s'inscrit pas lui-même) — seule la fiche
     * roster est auto-créée, à lier plus tard depuis Comptes & rôles.
     */
    async setCandidateStatus(
      candidate: Candidate,
      status: CandidateStatus,
      opts: { decidedBy?: string; gameId?: string } = {},
    ): Promise<{ playerId?: string; warning?: string }> {
      const isFinal = status === 'accepte' || status === 'refuse';
      const { error } = await sb
        .from('candidates')
        .update({ status, decided_at: isFinal ? new Date().toISOString() : null, decided_by: isFinal ? (opts.decidedBy ?? null) : null })
        .eq('id', candidate.id);
      unwrap(null, error);

      if (status !== 'accepte' || candidate.convertedPlayerId) return {};

      if (!opts.gameId) {
        return { warning: "Candidat accepté, mais aucune fiche joueur créée automatiquement : la campagne n'a pas de jeu associé. Ajoute-en un à la campagne, ou crée la fiche joueur à la main." };
      }

      const playerId = `p-${candidate.id}`;
      const player: Player = {
        id: playerId,
        pseudo: candidate.pseudo,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        role: candidate.roleApplied ?? '',
        gameId: opts.gameId,
        socials: [],
        stats: [],
        palmares: [],
        setup: [],
      };
      const { error: playerError } = await sb.from('players').upsert(toPlayerRow(player));
      unwrap(null, playerError);
      const { error: linkError } = await sb.from('candidates').update({ converted_player_id: playerId }).eq('id', candidate.id);
      unwrap(null, linkError);
      return { playerId };
    },
    async removeCandidate(id: string): Promise<void> {
      const { error } = await sb.from('candidates').delete().eq('id', id);
      unwrap(null, error);
    },

    async listCandidateEvaluations(candidateId?: string): Promise<CandidateEvaluation[]> {
      let q = sb.from('candidate_evaluations').select('*').order('created_at', { ascending: false });
      if (candidateId) q = q.eq('candidate_id', candidateId);
      const { data, error } = await q;
      return unwrap(data, error).map(fromCandidateEvaluationRow);
    },
    /** Un avis par (candidat, auteur) — upsert sur ce couple pour permettre la correction. */
    async upsertCandidateEvaluation(e: Partial<CandidateEvaluation>): Promise<void> {
      const { error } = await sb.from('candidate_evaluations').upsert(toCandidateEvaluationRow(e), { onConflict: 'candidate_id,author_id' });
      unwrap(null, error);
    },
    async removeCandidateEvaluation(id: string): Promise<void> {
      const { error } = await sb.from('candidate_evaluations').delete().eq('id', id);
      unwrap(null, error);
    },

    /**
     * Dispos candidats — lecture staff (le flux normal d'écriture passe par les
     * RPC publiques ci-dessous). Filtre par `candidateIds` (pas de jointure
     * serveur sur campaign_id : le caller croise avec `listCandidates` côté client,
     * comme partout ailleurs dans ce fichier).
     */
    async listCandidateAvailability(candidateIds?: string[]): Promise<CandidateAvailability[]> {
      let q = sb.from('candidate_availability').select('*').order('day');
      if (candidateIds) q = q.in('candidate_id', candidateIds);
      const { data, error } = await q;
      return unwrap(data, error).map(fromCandidateAvailabilityRow);
    },
    /** Correction manuelle par le staff d'un créneau candidat. */
    async upsertCandidateAvailability(a: Partial<CandidateAvailability>): Promise<void> {
      const { error } = await sb.from('candidate_availability').upsert(toCandidateAvailabilityRow(a));
      unwrap(null, error);
    },
    async removeCandidateAvailability(id: string): Promise<void> {
      const { error } = await sb.from('candidate_availability').delete().eq('id', id);
      unwrap(null, error);
    },

    async listSessionCandidates(sessionId?: string): Promise<SessionCandidate[]> {
      let q = sb.from('session_candidates').select('*');
      if (sessionId) q = q.eq('session_id', sessionId);
      const { data, error } = await q;
      return unwrap(data, error).map(fromSessionCandidateRow);
    },
    async setSessionCandidate(s: SessionCandidate): Promise<void> {
      const { error } = await sb.from('session_candidates').upsert(toSessionCandidateRow(s));
      unwrap(null, error);
    },
    async removeSessionCandidate(sessionId: string, candidateId: string): Promise<void> {
      const { error } = await sb.from('session_candidates').delete().eq('session_id', sessionId).eq('candidate_id', candidateId);
      unwrap(null, error);
    },

    // ── Tryouts / recrutement — RPC publiques (lien /tryout/:token, sans auth) ──
    async getCandidateByToken(token: string) {
      const { data, error } = await sb.rpc('get_candidate_public', { p_token: token });
      unwrap(data, error);
      const row = data?.[0];
      if (!row) return null;
      return {
        candidateId: row.candidate_id,
        pseudo: row.pseudo,
        campaignTitle: row.campaign_title,
        roleSought: row.role_sought ?? undefined,
        opensAt: row.opens_at ?? undefined,
        closesAt: row.closes_at ?? undefined,
        status: row.status as CandidateStatus,
      };
    },
    async getCandidateAvailabilityByToken(token: string): Promise<Pick<CandidateAvailability, 'day' | 'startTime' | 'endTime'>[]> {
      const { data, error } = await sb.rpc('get_candidate_availability', { p_token: token });
      const rows = unwrap(data, error);
      return rows.map((r) => ({ day: r.day, startTime: r.start_time.slice(0, 5), endTime: r.end_time.slice(0, 5) }));
    },
    /** Remplace entièrement les créneaux du candidat identifié par son jeton public. */
    async setCandidateAvailabilityByToken(
      token: string,
      slots: { day: string; startTime: string; endTime: string }[],
    ): Promise<void> {
      const { error } = await sb.rpc('set_candidate_availability', { p_token: token, p_slots: slots });
      unwrap(null, error);
    },

    // ── Valoplant (paramètres : maps, agents, compétences) ──
    async listValorantMaps(): Promise<ValorantMap[]> {
      const { data, error } = await sb.from('valorant_maps').select('*').order('name');
      return unwrap(data, error).map(fromValorantMapRow);
    },
    async upsertValorantMap(m: Partial<ValorantMap>): Promise<void> {
      const { error } = await sb.from('valorant_maps').upsert(toValorantMapRow(m));
      unwrap(null, error);
    },
    async removeValorantMap(id: string): Promise<void> {
      const { error } = await sb.from('valorant_maps').delete().eq('id', id);
      unwrap(null, error);
    },

    async listValorantAgents(): Promise<ValorantAgent[]> {
      const { data, error } = await sb.from('valorant_agents').select('*').order('name');
      return unwrap(data, error).map(fromValorantAgentRow);
    },
    async upsertValorantAgent(a: Partial<ValorantAgent>): Promise<void> {
      const { error } = await sb.from('valorant_agents').upsert(toValorantAgentRow(a));
      unwrap(null, error);
    },
    async removeValorantAgent(id: string): Promise<void> {
      const { error } = await sb.from('valorant_agents').delete().eq('id', id);
      unwrap(null, error);
    },

    async listValorantAbilities(): Promise<ValorantAbility[]> {
      const { data, error } = await sb.from('valorant_abilities').select('*').order('agent_id').order('slot');
      return unwrap(data, error).map(fromValorantAbilityRow);
    },
    async upsertValorantAbility(a: Partial<ValorantAbility>): Promise<void> {
      const { error } = await sb.from('valorant_abilities').upsert(toValorantAbilityRow(a));
      unwrap(null, error);
    },
    async removeValorantAbility(id: string): Promise<void> {
      const { error } = await sb.from('valorant_abilities').delete().eq('id', id);
      unwrap(null, error);
    },
  };
}

export type Queries = ReturnType<typeof createQueries>;
