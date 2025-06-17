import React, { useState, useEffect } from 'react'
import { User, Star, Zap, Trophy, Calendar, TrendingUp, Award } from 'lucide-react'
import { userAPI, quizAPI } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import type { UserProfile, QuizSession } from '../services/api'

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [recentSessions, setRecentSessions] = useState<QuizSession[]>([])
  const [loading, setLoading] = useState(true)
  const [rank, setRank] = useState<number>(0)

  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchProfileData()
    }
  }, [user])

  const fetchProfileData = async () => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await userAPI.getProfile(user!.id)
      if (profileError) throw profileError
      setProfile(profileData)

      // Fetch recent quiz sessions
      const { data: sessionsData, error: sessionsError } = await quizAPI.getUserSessions(user!.id, 10)
      if (sessionsError) throw sessionsError
      setRecentSessions(sessionsData)

      // Calculate user rank
      const { rank: userRank, error: rankError } = await userAPI.getUserRank(user!.id)
      if (rankError) throw rankError
      setRank(userRank)

    } catch (error) {
      console.error('Error fetching profile data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAccuracy = () => {
    if (recentSessions.length === 0) return 0
    const totalScore = recentSessions.reduce((sum, session) => sum + session.score, 0)
    const totalQuestions = recentSessions.reduce((sum, session) => sum + session.total_questions, 0)
    return totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0
  }

  const getAchievements = () => {
    if (!profile) return []
    
    const achievements = []
    
    if (profile.games_played >= 1) achievements.push({ name: 'First Steps', icon: '🚀', description: 'Complete your first quiz' })
    if (profile.games_played >= 10) achievements.push({ name: 'Explorer', icon: '🔭', description: 'Complete 10 quizzes' })
    if (profile.games_played >= 50) achievements.push({ name: 'Astronomer', icon: '⭐', description: 'Complete 50 quizzes' })
    if (profile.best_streak >= 5) achievements.push({ name: 'Streak Master', icon: '⚡', description: 'Get 5+ correct answers in a row' })
    if (profile.best_streak >= 10) achievements.push({ name: 'Perfect Vision', icon: '🌟', description: 'Get 10+ correct answers in a row' })
    if (profile.total_score >= 100) achievements.push({ name: 'Century Club', icon: '💯', description: 'Score 100+ total points' })
    if (rank <= 10) achievements.push({ name: 'Top 10', icon: '🏆', description: 'Reach top 10 on leaderboard' })
    
    return achievements
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-white">
          <p className="text-xl">Profile not found</p>
        </div>
      </div>
    )
  }

  const achievements = getAchievements()
  const accuracy = getAccuracy()

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-4xl font-bold text-white">
              {profile.username.charAt(0).toUpperCase()}
            </span>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-white mb-2">{profile.username}</h1>
            <p className="text-gray-300 mb-4">{profile.email}</p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-4">
              <div className="flex items-center space-x-2 text-yellow-400">
                <Trophy className="h-5 w-5" />
                <span className="font-semibold">Rank #{rank}</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-400">
                <Calendar className="h-5 w-5" />
                <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 text-center">
          <Star className="h-8 w-8 text-blue-400 mx-auto mb-2" />
          <h3 className="text-2xl font-bold text-white">{profile.total_score}</h3>
          <p className="text-gray-400">Total Score</p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 text-center">
          <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
          <h3 className="text-2xl font-bold text-white">{profile.best_streak}</h3>
          <p className="text-gray-400">Best Streak</p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 text-center">
          <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-2" />
          <h3 className="text-2xl font-bold text-white">{profile.games_played}</h3>
          <p className="text-gray-400">Games Played</p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 text-center">
          <Award className="h-8 w-8 text-purple-400 mx-auto mb-2" />
          <h3 className="text-2xl font-bold text-white">{accuracy}%</h3>
          <p className="text-gray-400">Accuracy</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Achievements */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Achievements</span>
          </h2>
          
          <div className="space-y-4">
            {achievements.map((achievement, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                <div className="text-2xl">{achievement.icon}</div>
                <div>
                  <h3 className="text-white font-semibold">{achievement.name}</h3>
                  <p className="text-gray-400 text-sm">{achievement.description}</p>
                </div>
              </div>
            ))}
            
            {achievements.length === 0 && (
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Complete more quizzes to unlock achievements!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Recent Activity</span>
          </h2>
          
          <div className="space-y-4">
            {recentSessions.map((session) => {
              const percentage = Math.round((session.score / session.total_questions) * 100)
              return (
                <div key={session.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-white font-semibold">
                        {session.score}/{session.total_questions}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        percentage >= 80 ? 'bg-green-500/20 text-green-400' :
                        percentage >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {percentage}%
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {new Date(session.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    <span className="text-yellow-400 font-semibold">{session.streak}</span>
                  </div>
                </div>
              )
            })}
            
            {recentSessions.length === 0 && (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No quiz sessions yet. Start your cosmic journey!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}