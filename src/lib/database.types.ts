export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
          subscription_tier: 'free' | 'premium' | 'professional'
          default_anonymity_preference: 'anonymous' | 'pseudonym' | 'semi_anonymous' | 'verified'
          persistent_pseudonym: string | null
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
          subscription_tier?: 'free' | 'premium' | 'professional'
          default_anonymity_preference?: 'anonymous' | 'pseudonym' | 'semi_anonymous' | 'verified'
          persistent_pseudonym?: string | null
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
          subscription_tier?: 'free' | 'premium' | 'professional'
          default_anonymity_preference?: 'anonymous' | 'pseudonym' | 'semi_anonymous' | 'verified'
          persistent_pseudonym?: string | null
        }
      }
      rooms: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string | null
          created_at: string
          created_by: string | null
          member_count: number
          message_count: number
          last_activity: string
          is_archived: boolean
          embedding: number[] | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          member_count?: number
          message_count?: number
          last_activity?: string
          is_archived?: boolean
          embedding?: number[] | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          member_count?: number
          message_count?: number
          last_activity?: string
          is_archived?: boolean
          embedding?: number[] | null
        }
      }
      room_memberships: {
        Row: {
          id: string
          user_id: string
          room_id: string
          joined_at: string
          left_at: string | null
          display_name: string
          anonymity_level: 'anonymous' | 'pseudonym' | 'semi_anonymous' | 'verified'
          role: 'member' | 'moderator' | 'admin'
        }
        Insert: {
          id?: string
          user_id: string
          room_id: string
          joined_at?: string
          left_at?: string | null
          display_name: string
          anonymity_level?: 'anonymous' | 'pseudonym' | 'semi_anonymous' | 'verified'
          role?: 'member' | 'moderator' | 'admin'
        }
        Update: {
          id?: string
          user_id?: string
          room_id?: string
          joined_at?: string
          left_at?: string | null
          display_name?: string
          anonymity_level?: 'anonymous' | 'pseudonym' | 'semi_anonymous' | 'verified'
          role?: 'member' | 'moderator' | 'admin'
        }
      }
      messages: {
        Row: {
          id: string
          room_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
          parent_message_id: string | null
          upvotes: number
          downvotes: number
          is_pinned: boolean
          is_deleted: boolean
          is_hidden: boolean
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
          parent_message_id?: string | null
          upvotes?: number
          downvotes?: number
          is_pinned?: boolean
          is_deleted?: boolean
          is_hidden?: boolean
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
          parent_message_id?: string | null
          upvotes?: number
          downvotes?: number
          is_pinned?: boolean
          is_deleted?: boolean
          is_hidden?: boolean
        }
      }
      votes: {
        Row: {
          id: string
          user_id: string
          message_id: string
          vote_type: 'up' | 'down'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message_id: string
          vote_type: 'up' | 'down'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message_id?: string
          vote_type?: 'up' | 'down'
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          message_id: string
          reporter_id: string
          reason: 'spam' | 'harassment' | 'misinformation' | 'self_harm' | 'other'
          details: string | null
          status: 'pending' | 'reviewed' | 'dismissed' | 'actioned'
          created_at: string
          reviewed_by: string | null
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          message_id: string
          reporter_id: string
          reason: 'spam' | 'harassment' | 'misinformation' | 'self_harm' | 'other'
          details?: string | null
          status?: 'pending' | 'reviewed' | 'dismissed' | 'actioned'
          created_at?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
        }
        Update: {
          id?: string
          message_id?: string
          reporter_id?: string
          reason?: 'spam' | 'harassment' | 'misinformation' | 'self_harm' | 'other'
          details?: string | null
          status?: 'pending' | 'reviewed' | 'dismissed' | 'actioned'
          created_at?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
        }
      }
      search_queries: {
        Row: {
          id: string
          query_text: string
          embedding: number[]
          search_count: number
          last_searched_at: string
          created_at: string
        }
        Insert: {
          id?: string
          query_text: string
          embedding: number[]
          search_count?: number
          last_searched_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          query_text?: string
          embedding?: number[]
          search_count?: number
          last_searched_at?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_rooms_semantic: {
        Args: {
          query_embedding: number[]
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          title: string
          description: string | null
          category: string | null
          member_count: number
          message_count: number
          last_activity: string
          similarity: number
        }[]
      }
      search_rooms_hybrid: {
        Args: {
          query_text: string
          query_embedding: number[]
          match_count?: number
        }
        Returns: {
          id: string
          title: string
          description: string | null
          category: string | null
          member_count: number
          message_count: number
          last_activity: string
          similarity: number
          match_type: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
