/**
 * Requêtes typées, retournant/acceptant des types domaine (@lignezero/types).
 * Lecture : listes triées par sort_order (contenu) ou date (matchs).
 * Écriture (manager) : upsert / remove. Les RLS imposent le rôle staff.
 */
import type {
  Game,
  Player,
  Staff,
  Sponsor,
  Match,
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
import type { LigneZeroClient } from './client';
import {
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
