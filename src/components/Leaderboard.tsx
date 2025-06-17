import React, { useState, useEffect } from 'react'
import { Trophy, Medal, Star, Crown, Zap, TrendingUp, AlertTriangle } from 'lucide-react'
import { userAPI, realtimeAPI } from '../services/api'
import type { UserProfile } from '../services/api'

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFrame, setTimeFrame] = useState<'all' | 'month' | 'week'>('all')

  useEffect(() => {
    fetchLeaderboard()
    
    // Set up realtime subscription
    const channel = realtimeAPI.subscribeToLeaderboard(() => {
      fetchLeaderboard()
    })

    return () => {
      realtimeAPI.unsubscribe(channel)
    }
  }, [timeFrame])

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await userAPI.getLeaderboard(50)
      if (error) throw error
      setLeaders(data)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-400" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-300" />
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />
      default:
        return <span className="text-gray-400 font-bold">#{rank}</span>
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600'
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500'
      case 3:
        return 'bg-gradient-to-r from-amber-500 to-amber-700'
      default:
        return 'bg-white/10'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full mb-4">
          <Trophy className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Cosmic Leaderboard</h1>
        <p className="text-gray-300">See how you rank among fellow astronomers</p>
      </div>

      {/* Time Frame Selector */}
      <div className="flex justify-center mb-8">
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-1 border border-white/20">
          {(['all', 'month', 'week'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeFrame(period)}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                timeFrame === period
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {period === 'all' ? 'All Time' : period === 'month' ? 'This Month' : 'This Week'}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      {leaders.length >= 3 && (
        <div className="mb-12">
          <div className="flex justify-center items-end space-x-4 mb-8">
            {/* Second Place */}
            <div className="text-center">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{leaders[1].username}</h3>
                <div className="flex items-center justify-center space-x-2 text-gray-300">
                  <Star className="h-4 w-4" />
                  <span>{leaders[1].total_score}</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-gray-400 mt-1">
                  <Zap className="h-3 w-3" />
                  <span className="text-sm">{leaders[1].best_streak} streak</span>
                </div>
              </div>
            </div>

            {/* First Place */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 backdrop-blur-md rounded-2xl border border-yellow-400/30 p-8 mb-4 transform scale-110">
                <Crown className="h-8 w-8 text-yellow-400 mx-auto mb-4" />
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{leaders[0].username}</h3>
                <div className="flex items-center justify-center space-x-2 text-yellow-400 mb-1">
                  <Star className="h-5 w-5" />
                  <span className="text-lg font-bold">{leaders[0].total_score}</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-yellow-300">
                  <Zap className="h-4 w-4" />
                  <span>{leaders[0].best_streak} streak</span>
                </div>
              </div>
            </div>

            {/* Third Place */}
            <div className="text-center">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{leaders[2].username}</h3>
                <div className="flex items-center justify-center space-x-2 text-gray-300">
                  <Star className="h-4 w-4" />
                  <span>{leaders[2].total_score}</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-gray-400 mt-1">
                  <Zap className="h-3 w-3" />
                  <span className="text-sm">{leaders[2].best_streak} streak</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
        <div className="p-6 border-b border-white/20">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Complete Rankings</span>
          </h2>
        </div>
        
        <div className="divide-y divide-white/10">
          {leaders.map((leader, index) => (
            <div
              key={leader.id}
              className={`p-6 hover:bg-white/5 transition-all duration-200 ${
                index < 3 ? getRankBadge(index + 1) + ' bg-opacity-10' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12">
                    {getRankIcon(index + 1)}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {leader.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-white font-semibold">{leader.username}</h3>
                        {leader.has_suspicious_sessions && (
                          <div className="group relative">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                              Suspicious activity detected
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm">{leader.games_played} games played</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="flex items-center space-x-1 text-blue-400">
                      <Star className="h-4 w-4" />
                      <span className="text-lg font-bold">{leader.total_score}</span>
                    </div>
                    <p className="text-gray-400 text-xs">Score</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center space-x-1 text-yellow-400">
                      <Zap className="h-4 w-4" />
                      <span className="text-lg font-bold">{leader.best_streak}</span>
                    </div>
                    <p className="text-gray-400 text-xs">Best Streak</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {leaders.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Rankings Yet</h3>
          <p className="text-gray-400">Be the first to complete a quiz and claim the top spot!</p>
        </div>
      )}
    </div>
  )
}