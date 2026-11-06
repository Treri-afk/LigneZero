// ⚠️ Généré par Supabase — NE PAS éditer à la main.
// Régénérer après toute migration :
//   npx supabase gen types typescript --project-id hwhpxmrfwqgzhhrjfurd > src/database.types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      sponsor_tracking: {
        Row: { sponsor_id: string; contract_start: string | null; contract_end: string | null; value_annual: number | null; contact_name: string | null; contact_email: string | null; notes: string | null; updated_at: string }
        Insert: { sponsor_id: string; contract_start?: string | null; contract_end?: string | null; value_annual?: number | null; contact_name?: string | null; contact_email?: string | null; notes?: string | null; updated_at?: string }
        Update: { sponsor_id?: string; contract_start?: string | null; contract_end?: string | null; value_annual?: number | null; contact_name?: string | null; contact_email?: string | null; notes?: string | null; updated_at?: string }
        Relationships: []
      }
      design_requests: {
        Row: { id: string; title: string; brief: string | null; kind: string; status: string; due: string | null; asset_url: string | null; requested_by: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; title: string; brief?: string | null; kind?: string; status?: string; due?: string | null; asset_url?: string | null; requested_by?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; title?: string; brief?: string | null; kind?: string; status?: string; due?: string | null; asset_url?: string | null; requested_by?: string | null; created_at?: string; updated_at?: string }
        Relationships: []
      }
      transactions: {
        Row: { id: string; kind: string; category: string; label: string; amount: number; tx_date: string; sponsor_id: string | null; notes: string | null; created_at: string }
        Insert: { id?: string; kind: string; category: string; label: string; amount: number; tx_date?: string; sponsor_id?: string | null; notes?: string | null; created_at?: string }
        Update: { id?: string; kind?: string; category?: string; label?: string; amount?: number; tx_date?: string; sponsor_id?: string | null; notes?: string | null; created_at?: string }
        Relationships: []
      }
      tournament_lobbies: {
        Row: { id: string; tournament_id: string; round: number; position: number; label: string | null; status: string; scheduled_at: string | null; stream_url: string | null; created_at: string }
        Insert: { id?: string; tournament_id: string; round?: number; position?: number; label?: string | null; status?: string; scheduled_at?: string | null; stream_url?: string | null; created_at?: string }
        Update: { id?: string; tournament_id?: string; round?: number; position?: number; label?: string | null; status?: string; scheduled_at?: string | null; stream_url?: string | null; created_at?: string }
        Relationships: []
      }
      tournament_lobby_entries: {
        Row: { id: string; lobby_id: string; team_id: string; placement: number | null; points: number; dnf: boolean; sort_order: number }
        Insert: { id?: string; lobby_id: string; team_id: string; placement?: number | null; points?: number; dnf?: boolean; sort_order?: number }
        Update: { id?: string; lobby_id?: string; team_id?: string; placement?: number | null; points?: number; dnf?: boolean; sort_order?: number }
        Relationships: []
      }
      tournaments: {
        Row: { id: string; slug: string; name: string; game_id: string | null; format: string; status: string; team_size: number; max_teams: number | null; group_count: number; qualifiers_per_group: number; playoff_format: string; group_rounds: number; teams_per_lobby: number; point_rules: Json; reseed_mode: string; prize: string | null; rules: string | null; description: string | null; cover_url: string | null; starts_at: string | null; ends_at: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; slug: string; name: string; game_id?: string | null; format?: string; status?: string; team_size?: number; max_teams?: number | null; group_count?: number; qualifiers_per_group?: number; playoff_format?: string; group_rounds?: number; teams_per_lobby?: number; point_rules?: Json; reseed_mode?: string; prize?: string | null; rules?: string | null; description?: string | null; cover_url?: string | null; starts_at?: string | null; ends_at?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; slug?: string; name?: string; game_id?: string | null; format?: string; status?: string; team_size?: number; max_teams?: number | null; group_count?: number; qualifiers_per_group?: number; playoff_format?: string; group_rounds?: number; teams_per_lobby?: number; point_rules?: Json; reseed_mode?: string; prize?: string | null; rules?: string | null; description?: string | null; cover_url?: string | null; starts_at?: string | null; ends_at?: string | null; created_at?: string; updated_at?: string }
        Relationships: []
      }
      tournament_teams: {
        Row: { id: string; tournament_id: string; name: string; tag: string | null; logo_url: string | null; color: string | null; seed: number | null; status: string; placement: number | null; disqualified: boolean; disqualified_reason: string | null; tiebreak_order: number; tiebreak_note: string | null; created_at: string }
        Insert: { id?: string; tournament_id: string; name: string; tag?: string | null; logo_url?: string | null; color?: string | null; seed?: number | null; status?: string; placement?: number | null; disqualified?: boolean; disqualified_reason?: string | null; tiebreak_order?: number; tiebreak_note?: string | null; created_at?: string }
        Update: { id?: string; tournament_id?: string; name?: string; tag?: string | null; logo_url?: string | null; color?: string | null; seed?: number | null; status?: string; placement?: number | null; disqualified?: boolean; disqualified_reason?: string | null; tiebreak_order?: number; tiebreak_note?: string | null; created_at?: string }
        Relationships: []
      }
      tournament_players: {
        Row: { id: string; team_id: string; pseudo: string; role: string | null; is_captain: boolean; sort_order: number }
        Insert: { id?: string; team_id: string; pseudo: string; role?: string | null; is_captain?: boolean; sort_order?: number }
        Update: { id?: string; team_id?: string; pseudo?: string; role?: string | null; is_captain?: boolean; sort_order?: number }
        Relationships: []
      }
      tournament_stages: {
        Row: { id: string; tournament_id: string; kind: string; name: string; sort_order: number }
        Insert: { id?: string; tournament_id: string; kind?: string; name: string; sort_order?: number }
        Update: { id?: string; tournament_id?: string; kind?: string; name?: string; sort_order?: number }
        Relationships: []
      }
      tournament_matches: {
        Row: { id: string; tournament_id: string; stage_id: string | null; bracket: string | null; round: number; position: number; group_label: string | null; team_a_id: string | null; team_b_id: string | null; score_a: number | null; score_b: number | null; winner_id: string | null; next_match_id: string | null; next_slot: string | null; loser_match_id: string | null; loser_slot: string | null; status: string; scheduled_at: string | null; stream_url: string | null }
        Insert: { id?: string; tournament_id: string; stage_id?: string | null; bracket?: string | null; round?: number; position?: number; group_label?: string | null; team_a_id?: string | null; team_b_id?: string | null; score_a?: number | null; score_b?: number | null; winner_id?: string | null; next_match_id?: string | null; next_slot?: string | null; loser_match_id?: string | null; loser_slot?: string | null; status?: string; scheduled_at?: string | null; stream_url?: string | null }
        Update: { id?: string; tournament_id?: string; stage_id?: string | null; bracket?: string | null; round?: number; position?: number; group_label?: string | null; team_a_id?: string | null; team_b_id?: string | null; score_a?: number | null; score_b?: number | null; winner_id?: string | null; next_match_id?: string | null; next_slot?: string | null; loser_match_id?: string | null; loser_slot?: string | null; status?: string; scheduled_at?: string | null; stream_url?: string | null }
        Relationships: []
      }
      brand_settings: {
        Row: { id: string; name: string; short_name: string; logo_url: string | null; mark_url: string | null; accent: string; tagline: string | null; handle: string | null; updated_at: string }
        Insert: { id?: string; name?: string; short_name?: string; logo_url?: string | null; mark_url?: string | null; accent?: string; tagline?: string | null; handle?: string | null; updated_at?: string }
        Update: { id?: string; name?: string; short_name?: string; logo_url?: string | null; mark_url?: string | null; accent?: string; tagline?: string | null; handle?: string | null; updated_at?: string }
        Relationships: []
      }
      bot_config: {
        Row: { id: boolean; twitch_channel: string | null; twitch_bot_username: string | null; claim_message: string; claim_message_unlinked: string; tickets_enabled: boolean; clips_enabled: boolean; auto_set_live: boolean; cartridge_name: string; cooldown_sec: number; features: Json; discord_invite: string | null; points_name: string; points_per_message: number; points_per_claim: number; discord_guild_id: string | null; discord_announce_channel_id: string | null; discord_sub_role_id: string | null; discord_live_message: string; discord_announce: boolean; discord_notifications: boolean; discord_subrole: boolean; discord_prefix: string; discord_message_content: boolean; updated_at: string }
        Insert: { id?: boolean; twitch_channel?: string | null; twitch_bot_username?: string | null; claim_message?: string; claim_message_unlinked?: string; tickets_enabled?: boolean; clips_enabled?: boolean; auto_set_live?: boolean; cartridge_name?: string; cooldown_sec?: number; features?: Json; discord_invite?: string | null; points_name?: string; points_per_message?: number; points_per_claim?: number; discord_guild_id?: string | null; discord_announce_channel_id?: string | null; discord_sub_role_id?: string | null; discord_live_message?: string; discord_announce?: boolean; discord_notifications?: boolean; discord_subrole?: boolean; discord_prefix?: string; discord_message_content?: boolean; updated_at?: string }
        Update: { id?: boolean; twitch_channel?: string | null; twitch_bot_username?: string | null; claim_message?: string; claim_message_unlinked?: string; tickets_enabled?: boolean; clips_enabled?: boolean; auto_set_live?: boolean; cartridge_name?: string; cooldown_sec?: number; features?: Json; discord_invite?: string | null; points_name?: string; points_per_message?: number; points_per_claim?: number; discord_guild_id?: string | null; discord_announce_channel_id?: string | null; discord_sub_role_id?: string | null; discord_live_message?: string; discord_announce?: boolean; discord_notifications?: boolean; discord_subrole?: boolean; discord_prefix?: string; discord_message_content?: boolean; updated_at?: string }
        Relationships: []
      }
      viewer_points: {
        Row: { twitch_login: string; owner_id: string | null; points: number; watch_minutes: number; updated_at: string }
        Insert: { twitch_login: string; owner_id?: string | null; points?: number; watch_minutes?: number; updated_at?: string }
        Update: { twitch_login?: string; owner_id?: string | null; points?: number; watch_minutes?: number; updated_at?: string }
        Relationships: []
      }
      bot_timers: {
        Row: { id: string; label: string; message: string; interval_sec: number; enabled: boolean; created_at: string }
        Insert: { id?: string; label: string; message: string; interval_sec?: number; enabled?: boolean; created_at?: string }
        Update: { id?: string; label?: string; message?: string; interval_sec?: number; enabled?: boolean; created_at?: string }
        Relationships: []
      }
      bot_quotes: {
        Row: { id: number; text: string; added_by: string | null; created_at: string }
        Insert: { id?: number; text: string; added_by?: string | null; created_at?: string }
        Update: { id?: number; text?: string; added_by?: string | null; created_at?: string }
        Relationships: []
      }
      bot_rewards: {
        Row: { id: string; name: string; description: string | null; cost: number; kind: string; payload: Json; stock: number | null; enabled: boolean; sort_order: number; created_at: string }
        Insert: { id?: string; name: string; description?: string | null; cost: number; kind?: string; payload?: Json; stock?: number | null; enabled?: boolean; sort_order?: number; created_at?: string }
        Update: { id?: string; name?: string; description?: string | null; cost?: number; kind?: string; payload?: Json; stock?: number | null; enabled?: boolean; sort_order?: number; created_at?: string }
        Relationships: []
      }
      reward_redemptions: {
        Row: { id: string; reward_id: string | null; reward_name: string; twitch_login: string; owner_id: string | null; cost: number; status: string; note: string | null; created_at: string; decided_at: string | null; decided_by: string | null }
        Insert: { id?: string; reward_id?: string | null; reward_name: string; twitch_login: string; owner_id?: string | null; cost: number; status?: string; note?: string | null; created_at?: string; decided_at?: string | null; decided_by?: string | null }
        Update: { id?: string; reward_id?: string | null; reward_name?: string; twitch_login?: string; owner_id?: string | null; cost?: number; status?: string; note?: string | null; created_at?: string; decided_at?: string | null; decided_by?: string | null }
        Relationships: []
      }
      bot_alerts: {
        Row: { id: string; event_type: string; enabled: boolean; message: string; reward_points: number; min_amount: number; updated_at: string }
        Insert: { id?: string; event_type: string; enabled?: boolean; message: string; reward_points?: number; min_amount?: number; updated_at?: string }
        Update: { id?: string; event_type?: string; enabled?: boolean; message?: string; reward_points?: number; min_amount?: number; updated_at?: string }
        Relationships: []
      }
      match_predictions: {
        Row: { id: string; match_id: string | null; question: string; options: Json; status: string; winning_option: number | null; created_at: string }
        Insert: { id?: string; match_id?: string | null; question: string; options: Json; status?: string; winning_option?: number | null; created_at?: string }
        Update: { id?: string; match_id?: string | null; question?: string; options?: Json; status?: string; winning_option?: number | null; created_at?: string }
        Relationships: []
      }
      prediction_bets: {
        Row: { id: string; prediction_id: string; twitch_login: string; owner_id: string | null; option_index: number; amount: number; created_at: string }
        Insert: { id?: string; prediction_id: string; twitch_login: string; owner_id?: string | null; option_index: number; amount: number; created_at?: string }
        Update: { id?: string; prediction_id?: string; twitch_login?: string; owner_id?: string | null; option_index?: number; amount?: number; created_at?: string }
        Relationships: []
      }
      bot_notifications: {
        Row: { id: string; owner_id: string | null; player_id: string | null; kind: string; title: string; body: string | null; status: string; created_at: string; delivered_at: string | null }
        Insert: { id?: string; owner_id?: string | null; player_id?: string | null; kind: string; title: string; body?: string | null; status?: string; created_at?: string; delivered_at?: string | null }
        Update: { id?: string; owner_id?: string | null; player_id?: string | null; kind?: string; title?: string; body?: string | null; status?: string; created_at?: string; delivered_at?: string | null }
        Relationships: []
      }
      discord_commands: {
        Row: { id: string; trigger: string; kind: string; response: string; description: string; enabled: boolean; allowed_channels: Json; min_role_id: string | null; cooldown_sec: number; created_at: string; updated_at: string }
        Insert: { id?: string; trigger: string; kind?: string; response: string; description?: string; enabled?: boolean; allowed_channels?: Json; min_role_id?: string | null; cooldown_sec?: number; created_at?: string; updated_at?: string }
        Update: { id?: string; trigger?: string; kind?: string; response?: string; description?: string; enabled?: boolean; allowed_channels?: Json; min_role_id?: string | null; cooldown_sec?: number; created_at?: string; updated_at?: string }
        Relationships: []
      }
      discord_routes: {
        Row: { kind: string; mode: string; channel_id: string | null; updated_at: string }
        Insert: { kind: string; mode?: string; channel_id?: string | null; updated_at?: string }
        Update: { kind?: string; mode?: string; channel_id?: string | null; updated_at?: string }
        Relationships: []
      }
      ticket_templates: {
        Row: { id: string; name: string; doc: Json; created_by: string | null; created_at: string }
        Insert: { id?: string; name: string; doc: Json; created_by?: string | null; created_at?: string }
        Update: { id?: string; name?: string; doc?: Json; created_by?: string | null; created_at?: string }
        Relationships: []
      }
      bot_commands: {
        Row: { id: string; trigger: string; response: string; enabled: boolean; min_role: string; cooldown_sec: number; created_at: string; updated_at: string }
        Insert: { id?: string; trigger: string; response: string; enabled?: boolean; min_role?: string; cooldown_sec?: number; created_at?: string; updated_at?: string }
        Update: { id?: string; trigger?: string; response?: string; enabled?: boolean; min_role?: string; cooldown_sec?: number; created_at?: string; updated_at?: string }
        Relationships: []
      }
      ticket_claims: {
        Row: { owner_id: string; match_id: string; source: string; claimed_at: string }
        Insert: { owner_id: string; match_id: string; source?: string; claimed_at?: string }
        Update: { owner_id?: string; match_id?: string; source?: string; claimed_at?: string }
        Relationships: []
      }
      bot_events: {
        Row: { id: number; kind: string; twitch_user: string | null; owner_id: string | null; match_id: string | null; detail: Json | null; created_at: string }
        Insert: { id?: number; kind: string; twitch_user?: string | null; owner_id?: string | null; match_id?: string | null; detail?: Json | null; created_at?: string }
        Update: { id?: number; kind?: string; twitch_user?: string | null; owner_id?: string | null; match_id?: string | null; detail?: Json | null; created_at?: string }
        Relationships: []
      }
      announcements: {
        Row: { id: string; title: string; body: string; audience: string; created_by: string | null; created_at: string }
        Insert: { id?: string; title: string; body: string; audience?: string; created_by?: string | null; created_at?: string }
        Update: { id?: string; title?: string; body?: string; audience?: string; created_by?: string | null; created_at?: string }
        Relationships: []
      }
      availability: {
        Row: { id: string; player_id: string; day: string; start_time: string | null; end_time: string | null; status: string; note: string | null; updated_at: string }
        Insert: { id?: string; player_id: string; day: string; start_time?: string | null; end_time?: string | null; status: string; note?: string | null; updated_at?: string }
        Update: { id?: string; player_id?: string; day?: string; start_time?: string | null; end_time?: string | null; status?: string; note?: string | null; updated_at?: string }
        Relationships: []
      }
      feedback: {
        Row: { id: string; player_id: string; author_id: string | null; match_id: string | null; body: string; acknowledged: boolean; reply: string | null; review_id: string | null; timestamp_sec: number | null; created_at: string }
        Insert: { id?: string; player_id: string; author_id?: string | null; match_id?: string | null; body: string; acknowledged?: boolean; reply?: string | null; review_id?: string | null; timestamp_sec?: number | null; created_at?: string }
        Update: { id?: string; player_id?: string; author_id?: string | null; match_id?: string | null; body?: string; acknowledged?: boolean; reply?: string | null; review_id?: string | null; timestamp_sec?: number | null; created_at?: string }
        Relationships: []
      }
      objectives: {
        Row: { id: string; scope: string; player_id: string | null; week: string | null; title: string; detail: string | null; status: string; created_by: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; scope: string; player_id?: string | null; week?: string | null; title: string; detail?: string | null; status?: string; created_by?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; scope?: string; player_id?: string | null; week?: string | null; title?: string; detail?: string | null; status?: string; created_by?: string | null; created_at?: string; updated_at?: string }
        Relationships: []
      }
      session_rsvp: {
        Row: { session_id: string; player_id: string; status: string; updated_at: string }
        Insert: { session_id: string; player_id: string; status: string; updated_at?: string }
        Update: { session_id?: string; player_id?: string; status?: string; updated_at?: string }
        Relationships: []
      }
      sessions: {
        Row: { id: string; kind: string; title: string; starts_at: string; duration_min: number | null; game_id: string | null; location: string | null; notes: string | null; created_by: string | null; created_at: string; campaign_id: string | null }
        Insert: { id?: string; kind: string; title: string; starts_at: string; duration_min?: number | null; game_id?: string | null; location?: string | null; notes?: string | null; created_by?: string | null; created_at?: string; campaign_id?: string | null }
        Update: { id?: string; kind?: string; title?: string; starts_at?: string; duration_min?: number | null; game_id?: string | null; location?: string | null; notes?: string | null; created_by?: string | null; created_at?: string; campaign_id?: string | null }
        Relationships: []
      }
      tryout_campaigns: {
        Row: { id: string; title: string; game_id: string | null; role_sought: string | null; description: string | null; opens_at: string | null; closes_at: string | null; status: string; created_at: string }
        Insert: { id: string; title: string; game_id?: string | null; role_sought?: string | null; description?: string | null; opens_at?: string | null; closes_at?: string | null; status?: string; created_at?: string }
        Update: { id?: string; title?: string; game_id?: string | null; role_sought?: string | null; description?: string | null; opens_at?: string | null; closes_at?: string | null; status?: string; created_at?: string }
        Relationships: []
      }
      candidates: {
        Row: { id: string; campaign_id: string; pseudo: string; first_name: string | null; last_name: string | null; discord: string | null; email: string | null; role_applied: string | null; rank_current: string | null; notes: string | null; status: string; public_token: string; created_at: string; decided_at: string | null; decided_by: string | null; converted_player_id: string | null }
        Insert: { id: string; campaign_id: string; pseudo: string; first_name?: string | null; last_name?: string | null; discord?: string | null; email?: string | null; role_applied?: string | null; rank_current?: string | null; notes?: string | null; status?: string; public_token?: string; created_at?: string; decided_at?: string | null; decided_by?: string | null; converted_player_id?: string | null }
        Update: { id?: string; campaign_id?: string; pseudo?: string; first_name?: string | null; last_name?: string | null; discord?: string | null; email?: string | null; role_applied?: string | null; rank_current?: string | null; notes?: string | null; status?: string; public_token?: string; created_at?: string; decided_at?: string | null; decided_by?: string | null; converted_player_id?: string | null }
        Relationships: []
      }
      candidate_evaluations: {
        Row: { id: string; candidate_id: string; author_id: string; rating: number; recommendation: string; body: string; created_at: string }
        Insert: { id: string; candidate_id: string; author_id: string; rating: number; recommendation: string; body?: string; created_at?: string }
        Update: { id?: string; candidate_id?: string; author_id?: string; rating?: number; recommendation?: string; body?: string; created_at?: string }
        Relationships: []
      }
      candidate_availability: {
        Row: { id: string; candidate_id: string; day: string; start_time: string; end_time: string; created_at: string }
        Insert: { id: string; candidate_id: string; day: string; start_time: string; end_time: string; created_at?: string }
        Update: { id?: string; candidate_id?: string; day?: string; start_time?: string; end_time?: string; created_at?: string }
        Relationships: []
      }
      session_candidates: {
        Row: { session_id: string; candidate_id: string; status: string }
        Insert: { session_id: string; candidate_id: string; status?: string }
        Update: { session_id?: string; candidate_id?: string; status?: string }
        Relationships: []
      }
      clips: {
        Row: {
          author: string
          created_at: string
          game: string | null
          id: string
          sort_order: number
          thumb: string | null
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          author: string
          created_at?: string
          game?: string | null
          id: string
          sort_order?: number
          thumb?: string | null
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          author?: string
          created_at?: string
          game?: string | null
          id?: string
          sort_order?: number
          thumb?: string | null
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      creators: {
        Row: {
          avatar: string | null
          created_at: string
          id: string
          live: boolean
          name: string
          platform: string
          role: string | null
          sort_order: number
          title: string | null
          updated_at: string
          url: string
          viewers: number | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          id: string
          live?: boolean
          name: string
          platform: string
          role?: string | null
          sort_order?: number
          title?: string | null
          updated_at?: string
          url: string
          viewers?: number | null
        }
        Update: {
          avatar?: string | null
          created_at?: string
          id?: string
          live?: boolean
          name?: string
          platform?: string
          role?: string | null
          sort_order?: number
          title?: string | null
          updated_at?: string
          url?: string
          viewers?: number | null
        }
        Relationships: []
      }
      games: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          palmares: string[]
          slug: string
          sort_order: number
          stats: Json
          tag: string
          updated_at: string
          visual: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          id: string
          name: string
          palmares?: string[]
          slug: string
          sort_order?: number
          stats?: Json
          tag: string
          updated_at?: string
          visual?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          palmares?: string[]
          slug?: string
          sort_order?: number
          stats?: Json
          tag?: string
          updated_at?: string
          visual?: string | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          competition: string
          created_at: string
          date_iso: string
          game_id: string
          id: string
          opponent: Json
          score: Json | null
          status: string
          stream_url: string | null
          ticket: Json | null
          updated_at: string
          vod_url: string | null
        }
        Insert: {
          competition: string
          created_at?: string
          date_iso: string
          game_id: string
          id: string
          opponent: Json
          score?: Json | null
          status: string
          stream_url?: string | null
          ticket?: Json | null
          updated_at?: string
          vod_url?: string | null
        }
        Update: {
          competition?: string
          created_at?: string
          date_iso?: string
          game_id?: string
          id?: string
          opponent?: Json
          score?: Json | null
          status?: string
          stream_url?: string | null
          ticket?: Json | null
          updated_at?: string
          vod_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          color: string | null
          country: string | null
          created_at: string
          first_name: string | null
          game_id: string
          id: string
          joined_year: number | null
          last_name: string | null
          palmares: string[]
          photo: string | null
          pseudo: string
          role: string
          setup: Json
          socials: Json
          sort_order: number
          stats: Json
          updated_at: string
        }
        Insert: {
          color?: string | null
          country?: string | null
          created_at?: string
          first_name?: string | null
          game_id: string
          id: string
          joined_year?: number | null
          last_name?: string | null
          palmares?: string[]
          photo?: string | null
          pseudo: string
          role: string
          setup?: Json
          socials?: Json
          sort_order?: number
          stats?: Json
          updated_at?: string
        }
        Update: {
          color?: string | null
          country?: string | null
          created_at?: string
          first_name?: string | null
          game_id?: string
          id?: string
          joined_year?: number | null
          last_name?: string | null
          palmares?: string[]
          photo?: string | null
          pseudo?: string
          role?: string
          setup?: Json
          socials?: Json
          sort_order?: number
          stats?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string
          id: string
          image: string | null
          name: string
          price: string | null
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id: string
          image?: string | null
          name: string
          price?: string | null
          sort_order?: number
          status: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          image?: string | null
          name?: string
          price?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          id: string
          owner_id: string
          kind: string
          name: string
          description: string | null
          image: string | null
          source: string | null
          link: string | null
          match_id: string | null
          obtained_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          kind: string
          name: string
          description?: string | null
          image?: string | null
          source?: string | null
          link?: string | null
          match_id?: string | null
          obtained_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          kind?: string
          name?: string
          description?: string | null
          image?: string | null
          source?: string | null
          link?: string | null
          match_id?: string | null
          obtained_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_matches: {
        Row: {
          owner_id: string
          match_id: string
          created_at: string
        }
        Insert: {
          owner_id: string
          match_id: string
          created_at?: string
        }
        Update: {
          owner_id?: string
          match_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_matches_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_matches_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      member_links: {
        Row: {
          owner_id: string
          discord_handle: string | null
          twitch_handle: string | null
          twitch_user_id: string | null
          discord_user_id: string | null
          updated_at: string
        }
        Insert: {
          owner_id: string
          discord_handle?: string | null
          twitch_handle?: string | null
          twitch_user_id?: string | null
          discord_user_id?: string | null
          updated_at?: string
        }
        Update: {
          owner_id?: string
          discord_handle?: string | null
          twitch_handle?: string | null
          twitch_user_id?: string | null
          discord_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_links_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          player_id: string | null
          role: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          player_id?: string | null
          role?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          player_id?: string | null
          role?: string
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          color: string | null
          contribution: string | null
          created_at: string
          description: string | null
          dossier: Json | null
          id: string
          logo: string | null
          name: string
          sector: string | null
          since: number | null
          sort_order: number
          tagline: string | null
          tier: string
          status: string
          updated_at: string
          url: string
        }
        Insert: {
          color?: string | null
          contribution?: string | null
          created_at?: string
          description?: string | null
          dossier?: Json | null
          id: string
          logo?: string | null
          name: string
          sector?: string | null
          since?: number | null
          sort_order?: number
          tagline?: string | null
          tier: string
          status?: string
          updated_at?: string
          url: string
        }
        Update: {
          color?: string | null
          contribution?: string | null
          created_at?: string
          description?: string | null
          dossier?: Json | null
          id?: string
          logo?: string | null
          name?: string
          sector?: string | null
          since?: number | null
          sort_order?: number
          tagline?: string | null
          tier?: string
          status?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      video_reviews: {
        Row: {
          created_at: string
          created_by: string | null
          game_id: string | null
          id: string
          match_id: string | null
          session_id: string | null
          title: string
          video_url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          game_id?: string | null
          id: string
          match_id?: string | null
          session_id?: string | null
          title: string
          video_url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          game_id?: string | null
          id?: string
          match_id?: string | null
          session_id?: string | null
          title?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_reviews_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_reviews_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_reviews_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_player_stats: {
        Row: {
          id: string
          match_id: string
          player_id: string
          stats: Json
          updated_at: string
        }
        Insert: {
          id?: string
          match_id: string
          player_id: string
          stats?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          player_id?: string
          stats?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_player_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      strats: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          game_id: string | null
          id: string
          map: string | null
          review_id: string | null
          tags: string[]
          timestamp_sec: number | null
          title: string
          board: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          game_id?: string | null
          id: string
          map?: string | null
          review_id?: string | null
          tags?: string[]
          timestamp_sec?: number | null
          title: string
          board?: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          game_id?: string | null
          id?: string
          map?: string | null
          review_id?: string | null
          tags?: string[]
          timestamp_sec?: number | null
          title?: string
          board?: Json
        }
        Relationships: [
          {
            foreignKeyName: "strats_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strats_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "video_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      video_annotations: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          player_id: string | null
          review_id: string
          tag: string
          timestamp_sec: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          player_id?: string | null
          review_id: string
          tag: string
          timestamp_sec: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          player_id?: string | null
          review_id?: string
          tag?: string
          timestamp_sec?: number
        }
        Relationships: [
          {
            foreignKeyName: "video_annotations_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "video_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_annotations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          bio: string | null
          clearance: string | null
          created_at: string
          division: string | null
          id: string
          matricule: string | null
          name: string
          photo: string | null
          role: string
          since: number | null
          socials: Json
          sort_order: number
          updated_at: string
        }
        Insert: {
          bio?: string | null
          clearance?: string | null
          created_at?: string
          division?: string | null
          id: string
          matricule?: string | null
          name: string
          photo?: string | null
          role: string
          since?: number | null
          socials?: Json
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bio?: string | null
          clearance?: string | null
          created_at?: string
          division?: string | null
          id?: string
          matricule?: string | null
          name?: string
          photo?: string | null
          role?: string
          since?: number | null
          socials?: Json
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      valorant_maps: {
        Row: { id: string; name: string; image: string | null; created_at: string }
        Insert: { id: string; name: string; image?: string | null; created_at?: string }
        Update: { id?: string; name?: string; image?: string | null; created_at?: string }
        Relationships: []
      }
      valorant_agents: {
        Row: { id: string; name: string; class: string; image: string | null; created_at: string }
        Insert: { id: string; name: string; class?: string; image?: string | null; created_at?: string }
        Update: { id?: string; name?: string; class?: string; image?: string | null; created_at?: string }
        Relationships: []
      }
      valorant_abilities: {
        Row: { id: string; agent_id: string; slot: string; name: string; category: string; shape: string; radius: number; width: number; length: number; image: string | null; created_at: string }
        Insert: { id: string; agent_id: string; slot: string; name: string; category?: string; shape?: string; radius?: number; width?: number; length?: number; image?: string | null; created_at?: string }
        Update: { id?: string; agent_id?: string; slot?: string; name?: string; category?: string; shape?: string; radius?: number; width?: number; length?: number; image?: string | null; created_at?: string }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      is_staff: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_manager: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_perf: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_content: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_design: { Args: Record<PropertyKey, never>; Returns: boolean }
      my_player: { Args: Record<PropertyKey, never>; Returns: string }
      is_evaluator: { Args: Record<PropertyKey, never>; Returns: boolean }
      award_points: { Args: { p_login: string; p_owner: string | null; p_amount: number }; Returns: number }
      redeem_reward: { Args: { p_login: string; p_reward_id: string }; Returns: Json }
      place_bet: { Args: { p_login: string; p_owner: string | null; p_prediction_id: string; p_option: number; p_amount: number }; Returns: Json }
      resolve_prediction: { Args: { p_prediction_id: string; p_winning: number }; Returns: Json }
      adjust_points: { Args: { p_login: string; p_owner: string | null; p_delta: number; p_allow_negative?: boolean }; Returns: Json }
      add_watchtime: { Args: { p_login: string; p_minutes: number }; Returns: number }
      prediction_tally: { Args: { p_prediction_id: string }; Returns: Json }
      broadcast_notification: { Args: { p_kind: string; p_title: string; p_body: string }; Returns: number }
      my_points: { Args: Record<PropertyKey, never>; Returns: Json }
      get_candidate_public: {
        Args: { p_token: string }
        Returns: { candidate_id: string; pseudo: string; campaign_title: string; role_sought: string | null; opens_at: string | null; closes_at: string | null; status: string }[]
      }
      get_candidate_availability: {
        Args: { p_token: string }
        Returns: { day: string; start_time: string; end_time: string }[]
      }
      set_candidate_availability: {
        Args: { p_token: string; p_slots: Json }
        Returns: undefined
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"]
