// API Service Layer - Abstraction for easy backend migration
// This layer provides a clean interface that can be easily switched from Supabase to Node.js

import { supabase } from '../lib/supabase'

// Types
export interface User {
  id: string
  email: string
  username?: string
  user_metadata?: any
}

export interface UserProfile {
  id: string
  email: string
  username: string
  avatar_url?: string
  total_score: number
  best_streak: number
  games_played: number
  is_admin: boolean
  created_at: string
}

export interface Question {
  id: string
  question_text: string
  image_url?: string
  options: string[]
  correct_answer: number
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  created_at: string
  created_by?: string
}

export interface QuizSession {
  id: string
  user_id: string
  score: number
  total_questions: number
  streak: number
  completed_at: string
  time_taken: number
  is_suspicious?: boolean
  suspicion_reason?: string
}

export interface AdminStats {
  totalQuestions: number
  totalUsers: number
  totalQuizSessions: number
  avgScore: number
}

export interface QuestionsFilter {
  search?: string
  category?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  sortBy?: 'created_at' | 'question_text' | 'category' | 'difficulty'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface GenerateQuestionsRequest {
  topic: string
  count: number
  difficulty?: 'easy' | 'medium' | 'hard'
}

export interface GenerateQuestionsResponse {
  success: boolean
  generated_count: number
  questions: Question[]
  error?: string
}

export interface CheatDetectionRequest {
  session_id: string
  user_id: string
  score: number
  total_questions: number
  time_taken: number
  streak: number
}

export interface CheatDetectionResponse {
  is_suspicious: boolean
  suspicion_reason?: string
  confidence_score: number
  analysis_details: {
    time_per_question: number
    accuracy_percentage: number
    speed_analysis: string
    pattern_analysis: string
  }
}

// Authentication API
export const authAPI = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  async signUp(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    })
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { data, error }
  },

  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// User Profile API
export const userAPI = {
  async getProfile(userId: string): Promise<{ data: UserProfile | null, error: any }> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    return { data, error }
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    return { data, error }
  },

  async getAllUsers(): Promise<{ data: UserProfile[], error: any }> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    return { data: data || [], error }
  },

  async deleteUser(userId: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId)
    
    return { error }
  },

  async getLeaderboard(limit: number = 50): Promise<{ data: UserProfile[], error: any }> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('total_score', { ascending: false })
      .limit(limit)
    
    return { data: data || [], error }
  },

  async getUserRank(userId: string): Promise<{ rank: number, error: any }> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('total_score')
      .order('total_score', { ascending: false })
    
    if (error) return { rank: 0, error }
    
    const userProfile = await this.getProfile(userId)
    if (userProfile.error || !userProfile.data) {
      return { rank: 0, error: userProfile.error }
    }
    
    const rank = data.findIndex(p => p.total_score <= userProfile.data!.total_score) + 1
    return { rank: rank || data.length + 1, error: null }
  }
}

// Questions API
export const questionsAPI = {
  async getRandomQuestions(limit: number = 10): Promise<{ data: Question[], error: any }> {
    // Get all questions first, then shuffle them client-side for random selection
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .limit(limit * 3) // Get more questions to have better randomization
    
    if (error) return { data: [], error }
    
    // Shuffle the questions client-side and take the requested limit
    const shuffled = data?.sort(() => Math.random() - 0.5).slice(0, limit) || []
    
    return { data: shuffled, error: null }
  },

  async getAllQuestions(filters: QuestionsFilter = {}): Promise<{ data: Question[], error: any, totalCount: number }> {
    let query = supabase.from('questions').select('*', { count: 'exact' })
    
    // Apply search filter
    if (filters.search) {
      query = query.ilike('question_text', `%${filters.search}%`)
    }
    
    // Apply category filter
    if (filters.category) {
      query = query.eq('category', filters.category)
    }
    
    // Apply difficulty filter
    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty)
    }
    
    // Apply sorting
    const sortBy = filters.sortBy || 'created_at'
    const sortOrder = filters.sortOrder || 'desc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    
    // Apply pagination
    if (filters.page && filters.limit) {
      const from = (filters.page - 1) * filters.limit
      const to = from + filters.limit - 1
      query = query.range(from, to)
    }
    
    const { data, error, count } = await query
    
    return { data: data || [], error, totalCount: count || 0 }
  },

  async getTotalQuestionsCount(filters: Omit<QuestionsFilter, 'page' | 'limit' | 'sortBy' | 'sortOrder'> = {}): Promise<{ count: number, error: any }> {
    let query = supabase.from('questions').select('*', { count: 'exact', head: true })
    
    // Apply search filter
    if (filters.search) {
      query = query.ilike('question_text', `%${filters.search}%`)
    }
    
    // Apply category filter
    if (filters.category) {
      query = query.eq('category', filters.category)
    }
    
    // Apply difficulty filter
    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty)
    }
    
    const { count, error } = await query
    
    return { count: count || 0, error }
  },

  async createQuestion(question: Omit<Question, 'id' | 'created_at'>): Promise<{ data: Question | null, error: any }> {
    const { data, error } = await supabase
      .from('questions')
      .insert(question)
      .select()
      .single()
    
    return { data, error }
  },

  async updateQuestion(id: string, updates: Partial<Question>): Promise<{ data: Question | null, error: any }> {
    const { data, error } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  },

  async deleteQuestion(id: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id)
    
    return { error }
  },

  async getQuestionsByCategory(category: string): Promise<{ data: Question[], error: any }> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false })
    
    return { data: data || [], error }
  },

  async getQuestionsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Promise<{ data: Question[], error: any }> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('difficulty', difficulty)
      .order('created_at', { ascending: false })
    
    return { data: data || [], error }
  },

  async getCategories(): Promise<{ data: string[], error: any }> {
    const { data, error } = await supabase
      .from('questions')
      .select('category')
      .order('category')
    
    if (error) return { data: [], error }
    
    // Get unique categories
    const categories = [...new Set(data.map(item => item.category))]
    
    return { data: categories, error: null }
  }
}

// Quiz Sessions API
export const quizAPI = {
  async createSession(session: Omit<QuizSession, 'id' | 'completed_at'>): Promise<{ data: QuizSession | null, error: any }> {
    const { data, error } = await supabase
      .from('quiz_sessions')
      .insert(session)
      .select()
      .single()
    
    return { data, error }
  },

  async getUserSessions(userId: string, limit: number = 10): Promise<{ data: QuizSession[], error: any }> {
    const { data, error } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(limit)
    
    return { data: data || [], error }
  },

  async getAllSessions(): Promise<{ data: QuizSession[], error: any }> {
    const { data, error } = await supabase
      .from('quiz_sessions')
      .select('*')
      .order('completed_at', { ascending: false })
    
    return { data: data || [], error }
  },

  async getSessionStats(): Promise<{ data: { avgScore: number, totalSessions: number }, error: any }> {
    const { data, error } = await supabase
      .from('quiz_sessions')
      .select('score, total_questions')
    
    if (error) return { data: { avgScore: 0, totalSessions: 0 }, error }
    
    if (data.length === 0) {
      return { data: { avgScore: 0, totalSessions: 0 }, error: null }
    }
    
    // Calculate average score as percentage
    const totalPercentage = data.reduce((sum, session) => {
      const percentage = session.total_questions > 0 ? (session.score / session.total_questions) * 100 : 0
      return sum + percentage
    }, 0)
    
    const avgScore = Math.round(totalPercentage / data.length)
    
    return { 
      data: { avgScore, totalSessions: data.length }, 
      error: null 
    }
  }
}

// Admin API
export const adminAPI = {
  async getStats(): Promise<{ data: AdminStats, error: any }> {
    try {
      const [
        { count: questionsCount, error: questionsError },
        { count: usersCount, error: usersError },
        { count: sessionsCount, error: sessionsError },
        { data: sessionStats, error: statsError }
      ] = await Promise.all([
        supabase.from('questions').select('*', { count: 'exact', head: true }),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('quiz_sessions').select('*', { count: 'exact', head: true }),
        quizAPI.getSessionStats()
      ])

      // Check for any errors
      if (questionsError || usersError || sessionsError || statsError) {
        const error = questionsError || usersError || sessionsError || statsError
        console.error('Error fetching admin stats:', error)
        return { 
          data: { totalQuestions: 0, totalUsers: 0, totalQuizSessions: 0, avgScore: 0 }, 
          error 
        }
      }

      const stats: AdminStats = {
        totalQuestions: questionsCount || 0,
        totalUsers: usersCount || 0,
        totalQuizSessions: sessionsCount || 0,
        avgScore: sessionStats?.avgScore || 0
      }

      return { data: stats, error: null }
    } catch (error) {
      console.error('Error in getStats:', error)
      return { 
        data: { totalQuestions: 0, totalUsers: 0, totalQuizSessions: 0, avgScore: 0 }, 
        error 
      }
    }
  },

  async isUserAdmin(userId: string): Promise<{ isAdmin: boolean, error: any }> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()
    
    return { isAdmin: data?.is_admin || false, error }
  },

  async generateQuestions(request: GenerateQuestionsRequest): Promise<GenerateQuestionsResponse> {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-questions`
      
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          generated_count: 0,
          questions: [],
          error: data.error || 'Failed to generate questions'
        }
      }

      return data
    } catch (error) {
      console.error('Error calling generate-questions function:', error)
      return {
        success: false,
        generated_count: 0,
        questions: [],
        error: 'Network error while generating questions'
      }
    }
  }
}

// Enhanced Realtime subscriptions
export const realtimeAPI = {
  subscribeToLeaderboard(callback: () => void) {
    return supabase
      .channel('leaderboard')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'user_profiles' },
        callback
      )
      .subscribe()
  },

  subscribeToQuestions(callback: () => void) {
    return supabase
      .channel('questions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'questions' },
        callback
      )
      .subscribe()
  },

  subscribeToUsers(callback: () => void) {
    return supabase
      .channel('users')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'user_profiles' },
        callback
      )
      .subscribe()
  },

  subscribeToQuizSessions(callback: () => void) {
    return supabase
      .channel('quiz_sessions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'quiz_sessions' },
        callback
      )
      .subscribe()
  },

  // Subscribe to all tables that affect admin statistics
  subscribeToAdminStats(callback: () => void) {
    const channels = []
    
    // Subscribe to questions table
    const questionsChannel = supabase
      .channel('admin_questions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'questions' },
        callback
      )
      .subscribe()
    
    // Subscribe to user_profiles table
    const usersChannel = supabase
      .channel('admin_users')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'user_profiles' },
        callback
      )
      .subscribe()
    
    // Subscribe to quiz_sessions table
    const sessionsChannel = supabase
      .channel('admin_sessions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'quiz_sessions' },
        callback
      )
      .subscribe()
    
    channels.push(questionsChannel, usersChannel, sessionsChannel)
    
    return channels
  },

  unsubscribe(channel: any) {
    if (Array.isArray(channel)) {
      // Handle multiple channels
      channel.forEach(ch => supabase.removeChannel(ch))
    } else {
      // Handle single channel
      return supabase.removeChannel(channel)
    }
  }
}

// AI Tutor API
export const aiTutorAPI = {
  async sendMessage(message: string, conversationHistory: Array<{role: string, content: string}> = []): Promise<{ data: { response: string, provider_used: string, fallback_used: boolean }, error: any }> {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor-chat`
      
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message,
          conversation_history: conversationHistory
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          data: { response: '', provider_used: '', fallback_used: false },
          error: data.error || 'Failed to get response from AI tutor'
        }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error calling ai-tutor-chat function:', error)
      return {
        data: { response: '', provider_used: '', fallback_used: false },
        error: 'Network error while contacting AI tutor'
      }
    }
  }
}

// Translation API
export const translationAPI = {
  async translateText(text: string, targetLang: string): Promise<{ data: { translatedText: string, provider_used: string, fallback_used: boolean }, error: any }> {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-text`
      
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text,
          targetLang
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          data: { translatedText: '', provider_used: '', fallback_used: false },
          error: data.error || 'Failed to translate text'
        }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error calling translate-text function:', error)
      return {
        data: { translatedText: '', provider_used: '', fallback_used: false },
        error: 'Network error while translating text'
      }
    }
  }
}

// Integrity Detection API
export const integrityAPI = {
  async detectCheating(request: CheatDetectionRequest): Promise<{ data: CheatDetectionResponse | null, error: any }> {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-cheating`
      
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          data: null,
          error: data.error || 'Failed to analyze quiz session for cheating'
        }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error calling detect-cheating function:', error)
      return {
        data: null,
        error: 'Network error while analyzing quiz session'
      }
    }
  }
}

// Utility functions for easy migration
export const apiUtils = {
  // Helper to handle API responses consistently
  handleResponse<T>(response: { data: T, error: any }): { data: T | null, error: string | null } {
    if (response.error) {
      return { data: null, error: response.error.message || 'An error occurred' }
    }
    return { data: response.data, error: null }
  },

  // Helper to format errors consistently
  formatError(error: any): string {
    if (typeof error === 'string') return error
    if (error?.message) return error.message
    return 'An unexpected error occurred'
  },

  // Helper to validate required fields
  validateRequired(data: Record<string, any>, requiredFields: string[]): string | null {
    for (const field of requiredFields) {
      if (!data[field]) {
        return `${field} is required`
      }
    }
    return null
  }
}