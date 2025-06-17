import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      questions: {
        Row: {
          id: string
          question_text: string
          image_url: string | null
          options: string[]
          correct_answer: number
          category: string
          difficulty: 'easy' | 'medium' | 'hard'
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          question_text: string
          image_url?: string | null
          options: string[]
          correct_answer: number
          category: string
          difficulty: 'easy' | 'medium' | 'hard'
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          question_text?: string
          image_url?: string | null
          options?: string[]
          correct_answer?: number
          category?: string
          difficulty?: 'easy' | 'medium' | 'hard'
          created_at?: string
          created_by?: string
        }
      }
      quiz_sessions: {
        Row: {
          id: string
          user_id: string
          score: number
          total_questions: number
          streak: number
          completed_at: string
          time_taken: number
          is_suspicious: boolean
          suspicion_reason: string | null
        }
        Insert: {
          id?: string
          user_id: string
          score: number
          total_questions: number
          streak: number
          completed_at?: string
          time_taken: number
          is_suspicious?: boolean
          suspicion_reason?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          score?: number
          total_questions?: number
          streak?: number
          completed_at?: string
          time_taken?: number
          is_suspicious?: boolean
          suspicion_reason?: string | null
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          username: string
          avatar_url: string | null
          total_score: number
          best_streak: number
          games_played: number
          is_admin: boolean
          created_at: string
          has_suspicious_sessions: boolean
        }
        Insert: {
          id: string
          email: string
          username: string
          avatar_url?: string | null
          total_score?: number
          best_streak?: number
          games_played?: number
          is_admin?: boolean
          created_at?: string
          has_suspicious_sessions?: boolean
        }
        Update: {
          id?: string
          email?: string
          username?: string
          avatar_url?: string | null
          total_score?: number
          best_streak?: number
          games_played?: number
          is_admin?: boolean
          created_at?: string
          has_suspicious_sessions?: boolean
        }
      }
    }
  }
}