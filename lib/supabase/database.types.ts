// Generated from the live schema. Regenerate after any migration:
//   supabase gen types typescript --project-id vosxgtbaizimrbdoztir
// Do not edit by hand.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      dashboard_years: {
        Row: { created_at: string; user_id: string; year: number }
        Insert: { created_at?: string; user_id?: string; year: number }
        Update: { created_at?: string; user_id?: string; year?: number }
        Relationships: []
      }
      entries: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          id: string
          note: string | null
          occurred_at: string
          p2p_cash_amount: number | null
          p2p_cash_currency: string | null
          p2p_direction: string | null
          p2p_rate: number | null
          source_id: string | null
          tags: string[]
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          id?: string
          note?: string | null
          occurred_at: string
          p2p_cash_amount?: number | null
          p2p_cash_currency?: string | null
          p2p_direction?: string | null
          p2p_rate?: number | null
          source_id?: string | null
          tags?: string[]
          type: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          id?: string
          note?: string | null
          occurred_at?: string
          p2p_cash_amount?: number | null
          p2p_cash_currency?: string | null
          p2p_direction?: string | null
          p2p_rate?: number | null
          source_id?: string | null
          tags?: string[]
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entries_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      entry_attachments: {
        Row: {
          created_at: string
          entry_id: string
          id: string
          name: string
          storage_path: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_id: string
          id?: string
          name: string
          storage_path?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          entry_id?: string
          id?: string
          name?: string
          storage_path?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entry_attachments_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          color: string | null
          completed_at: string | null
          created_at: string
          currency: string
          current_amount: number
          end_date: string | null
          id: string
          show_on_dashboard: boolean
          start_date: string | null
          target_amount: number
          title: string
          track_category: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          current_amount?: number
          end_date?: string | null
          id?: string
          show_on_dashboard?: boolean
          start_date?: string | null
          target_amount: number
          title: string
          track_category?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          color?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          current_amount?: number
          end_date?: string | null
          id?: string
          show_on_dashboard?: boolean
          start_date?: string | null
          target_amount?: number
          title?: string
          track_category?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          emailed_at: string | null
          id: string
          reply_to: string
          source: string
          subject: string | null
          topic: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          emailed_at?: string | null
          id?: string
          reply_to: string
          source: string
          subject?: string | null
          topic: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          emailed_at?: string | null
          id?: string
          reply_to?: string
          source?: string
          subject?: string | null
          topic?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notification_reads: {
        Row: { notification_id: string; read_at: string; user_id: string }
        Insert: { notification_id: string; read_at?: string; user_id?: string }
        Update: { notification_id?: string; read_at?: string; user_id?: string }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_id: string | null
          avatar_path: string | null
          bio: string | null
          created_at: string
          email: string
          id: string
          location: string | null
          name: string
          timezone: string | null
          updated_at: string
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_id?: string | null
          avatar_path?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          id: string
          location?: string | null
          name?: string
          timezone?: string | null
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_id?: string | null
          avatar_path?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          id?: string
          location?: string | null
          name?: string
          timezone?: string | null
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          display_currency: string
          has_password: boolean
          language: string
          login_method: string
          notifications: Json
          privacy_mode: boolean
          time_format: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          display_currency?: string
          has_password?: boolean
          language?: string
          login_method?: string
          notifications?: Json
          privacy_mode?: boolean
          time_format?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          display_currency?: string
          has_password?: boolean
          language?: string
          login_method?: string
          notifications?: Json
          privacy_mode?: boolean
          time_format?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_links: {
        Row: {
          created_at: string
          id: string
          platform: string
          position: number
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          position?: number
          url: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          position?: number
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      sources: {
        Row: {
          campaign_url: string | null
          created_at: string
          id: string
          name: string
          platform_url: string | null
          social_handle: string | null
          user_id: string
        }
        Insert: {
          campaign_url?: string | null
          created_at?: string
          id?: string
          name: string
          platform_url?: string | null
          social_handle?: string | null
          user_id?: string
        }
        Update: {
          campaign_url?: string | null
          created_at?: string
          id?: string
          name?: string
          platform_url?: string | null
          social_handle?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      dispatch_notification_emails: {
        Args: { kind: string }
        Returns: undefined
      }
      notification_digest: {
        Args: { kind: string }
        Returns: {
          display_name: string
          email: string
          entry_count: number
          income: number
          net: number
          outgoings: number
          period_end: string
          period_start: string
          user_id: string
        }[]
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]
