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
          updated_at: string
        }
        Insert: {
          owner_id: string
          discord_handle?: string | null
          twitch_handle?: string | null
          updated_at?: string
        }
        Update: {
          owner_id?: string
          discord_handle?: string | null
          twitch_handle?: string | null
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
