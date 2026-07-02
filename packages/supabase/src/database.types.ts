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
        Row: { id: string; player_id: string; author_id: string | null; match_id: string | null; body: string; acknowledged: boolean; reply: string | null; created_at: string }
        Insert: { id?: string; player_id: string; author_id?: string | null; match_id?: string | null; body: string; acknowledged?: boolean; reply?: string | null; created_at?: string }
        Update: { id?: string; player_id?: string; author_id?: string | null; match_id?: string | null; body?: string; acknowledged?: boolean; reply?: string | null; created_at?: string }
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
        Row: { id: string; kind: string; title: string; starts_at: string; duration_min: number | null; game_id: string | null; location: string | null; notes: string | null; created_by: string | null; created_at: string }
        Insert: { id?: string; kind: string; title: string; starts_at: string; duration_min?: number | null; game_id?: string | null; location?: string | null; notes?: string | null; created_by?: string | null; created_at?: string }
        Update: { id?: string; kind?: string; title?: string; starts_at?: string; duration_min?: number | null; game_id?: string | null; location?: string | null; notes?: string | null; created_by?: string | null; created_at?: string }
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
          updated_at?: string
          url?: string
        }
        Relationships: []
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
    }
    Views: { [_ in never]: never }
    Functions: {
      is_staff: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_manager: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_perf: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_content: { Args: Record<PropertyKey, never>; Returns: boolean }
      my_player: { Args: Record<PropertyKey, never>; Returns: string }
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
