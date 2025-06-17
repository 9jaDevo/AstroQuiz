import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Users, 
  HelpCircle,
  BarChart3,
  Settings,
  Shield,
  ShieldOff,
  Calendar,
  Star,
  Zap,
  AlertTriangle,
  Search,
  Filter,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Brain,
  Loader
} from 'lucide-react'
import { questionsAPI, adminAPI, userAPI, realtimeAPI } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import type { Question, AdminStats, UserProfile, QuestionsFilter, GenerateQuestionsRequest } from '../services/api'

export default function AdminPanel() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'questions' | 'users' | 'stats' | 'ai-generator'>('questions')
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [formData, setFormData] = useState({
    question_text: '',
    image_url: '',
    options: ['', '', '', ''],
    correct_answer: 0,
    category: '',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard'
  })

  // AI Generator state
  const [aiGeneratorData, setAiGeneratorData] = useState({
    topic: '',
    count: 5,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard'
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationResult, setGenerationResult] = useState<string | null>(null)

  // Table state for questions
  const [questionsFilter, setQuestionsFilter] = useState<QuestionsFilter>({
    search: '',
    category: '',
    difficulty: undefined,
    sortBy: 'created_at',
    sortOrder: 'desc',
    page: 1,
    limit: 20
  })
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [availableCategories, setAvailableCategories] = useState<string[]>([])

  const { user } = useAuth()

  // Real-time subscription channels - store as refs to prevent re-subscriptions
  const [subscriptionChannels, setSubscriptionChannels] = useState<any[]>([])
  const [subscriptionsInitialized, setSubscriptionsInitialized] = useState(false)

  useEffect(() => {
    if (user) {
      fetchData()
      fetchCategories()
      
      // Only setup subscriptions once
      if (!subscriptionsInitialized) {
        setupRealtimeSubscriptions()
        setSubscriptionsInitialized(true)
      }
    }

    return () => {
      // Cleanup subscriptions on unmount
      cleanupSubscriptions()
    }
  }, [user])

  useEffect(() => {
    if (user && (activeTab === 'questions' || activeTab === 'users')) {
      fetchData()
    }
  }, [activeTab, questionsFilter])

  const setupRealtimeSubscriptions = () => {
    try {
      // Clean up any existing subscriptions first
      cleanupSubscriptions()

      // Subscribe to admin stats changes
      const adminStatsChannels = realtimeAPI.subscribeToAdminStats(() => {
        console.log('Admin stats changed, refreshing...')
        fetchStats()
      })

      // Subscribe to questions changes for questions tab
      const questionsChannel = realtimeAPI.subscribeToQuestions(() => {
        if (activeTab === 'questions') {
          console.log('Questions changed, refreshing...')
          fetchData()
          fetchCategories()
        }
      })

      // Subscribe to users changes for users tab
      const usersChannel = realtimeAPI.subscribeToUsers(() => {
        if (activeTab === 'users') {
          console.log('Users changed, refreshing...')
          fetchData()
        }
      })

      const allChannels = [...adminStatsChannels, questionsChannel, usersChannel]
      setSubscriptionChannels(allChannels)
    } catch (error) {
      console.error('Error setting up realtime subscriptions:', error)
    }
  }

  const cleanupSubscriptions = () => {
    try {
      subscriptionChannels.forEach(channel => {
        if (channel && realtimeAPI.unsubscribe) {
          realtimeAPI.unsubscribe(channel)
        }
      })
      setSubscriptionChannels([])
    } catch (error) {
      console.error('Error cleaning up subscriptions:', error)
    }
  }

  const fetchData = async () => {
    try {
      if (activeTab === 'questions') {
        // Fetch questions with filters
        const { data: questionsData, error, totalCount } = await questionsAPI.getAllQuestions(questionsFilter)
        if (error) throw error
        setQuestions(questionsData || [])
        setTotalQuestions(totalCount || 0)
      } else if (activeTab === 'users') {
        // Fetch users
        const { data: usersData } = await userAPI.getAllUsers()
        setUsers(usersData || [])
      }

      // Always fetch stats for the stats cards
      await fetchStats()
    } catch (error) {
      console.error('Error fetching admin data:', error)
      // Set default values on error
      if (activeTab === 'questions') {
        setQuestions([])
        setTotalQuestions(0)
      } else if (activeTab === 'users') {
        setUsers([])
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      setStatsLoading(true)
      const { data: statsData, error } = await adminAPI.getStats()
      if (error) {
        console.error('Error fetching stats:', error)
        // Set default stats on error
        setStats({
          totalQuestions: 0,
          totalUsers: 0,
          totalQuizSessions: 0,
          avgScore: 0
        })
        return
      }
      setStats(statsData || {
        totalQuestions: 0,
        totalUsers: 0,
        totalQuizSessions: 0,
        avgScore: 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
      // Set default stats on error
      setStats({
        totalQuestions: 0,
        totalUsers: 0,
        totalQuizSessions: 0,
        avgScore: 0
      })
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data: categories } = await questionsAPI.getCategories()
      setAvailableCategories(categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      setAvailableCategories([])
    }
  }

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const questionData = {
        ...formData,
        options: formData.options.filter(opt => opt.trim() !== ''),
        created_by: user?.id || ''
      }

      if (editingQuestion) {
        const { error } = await questionsAPI.updateQuestion(editingQuestion.id, questionData)
        if (error) throw error
      } else {
        const { error } = await questionsAPI.createQuestion(questionData)
        if (error) throw error
      }

      setShowQuestionForm(false)
      setEditingQuestion(null)
      resetForm()
      fetchData()
      fetchCategories() // Refresh categories in case a new one was added
    } catch (error) {
      console.error('Error saving question:', error)
    }
  }

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return

    try {
      const { error } = await questionsAPI.deleteQuestion(id)
      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error deleting question:', error)
    }
  }

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question)
    setFormData({
      question_text: question.question_text || '',
      image_url: question.image_url || '',
      options: question.options || ['', '', '', ''],
      correct_answer: question.correct_answer || 0,
      category: question.category || '',
      difficulty: question.difficulty || 'easy'
    })
    setShowQuestionForm(true)
  }

  const handleToggleAdmin = async (userId: string, currentAdminStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentAdminStatus ? 'remove admin privileges from' : 'grant admin privileges to'} this user?`)) return

    try {
      const { error } = await userAPI.updateProfile(userId, {
        is_admin: !currentAdminStatus
      })
      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error updating user admin status:', error)
    }
  }

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone and will remove all their quiz data.`)) return

    try {
      const { error } = await userAPI.deleteUser(userId)
      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  const handleGenerateQuestions = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!aiGeneratorData.topic.trim()) {
      setGenerationResult('Please enter a topic for question generation.')
      return
    }

    setIsGenerating(true)
    setGenerationResult(null)

    try {
      const request: GenerateQuestionsRequest = {
        topic: aiGeneratorData.topic.trim(),
        count: aiGeneratorData.count,
        difficulty: aiGeneratorData.difficulty
      }

      const response = await adminAPI.generateQuestions(request)

      if (response?.success) {
        setGenerationResult(`Successfully generated ${response.generated_count} questions about "${aiGeneratorData.topic}"!`)
        // Reset form
        setAiGeneratorData({
          topic: '',
          count: 5,
          difficulty: 'medium'
        })
        // Refresh questions list if we're on the questions tab
        if (activeTab === 'questions') {
          fetchData()
        }
        fetchCategories() // Refresh categories
      } else {
        setGenerationResult(`Error: ${response?.error || 'Failed to generate questions'}`)
      }
    } catch (error) {
      console.error('Error generating questions:', error)
      setGenerationResult('Network error occurred while generating questions.')
    } finally {
      setIsGenerating(false)
    }
  }

  const resetForm = () => {
    setFormData({
      question_text: '',
      image_url: '',
      options: ['', '', '', ''],
      correct_answer: 0,
      category: '',
      difficulty: 'easy'
    })
  }

  const handleSort = (column: string) => {
    const newSortOrder = questionsFilter.sortBy === column && questionsFilter.sortOrder === 'asc' ? 'desc' : 'asc'
    setQuestionsFilter({
      ...questionsFilter,
      sortBy: column as any,
      sortOrder: newSortOrder,
      page: 1 // Reset to first page when sorting
    })
  }

  const handleSearch = (searchTerm: string) => {
    setQuestionsFilter({
      ...questionsFilter,
      search: searchTerm,
      page: 1 // Reset to first page when searching
    })
  }

  const handleFilterChange = (filterType: 'category' | 'difficulty', value: string) => {
    setQuestionsFilter({
      ...questionsFilter,
      [filterType]: value || undefined,
      page: 1 // Reset to first page when filtering
    })
  }

  const handlePageChange = (newPage: number) => {
    setQuestionsFilter({
      ...questionsFilter,
      page: newPage
    })
  }

  const getSortIcon = (column: string) => {
    if (questionsFilter.sortBy !== column) return null
    return questionsFilter.sortOrder === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />
  }

  const totalPages = Math.ceil(totalQuestions / (questionsFilter.limit || 20))

  const categories = ['Constellations', 'Planets', 'Stars', 'Galaxies', 'Space Missions', 'Astronomy History', 'Space Technology', 'Science', 'History', 'Geography', 'Sports', 'Entertainment']

  // Early return if user is not available
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading user data...</p>
        </div>
      </div>
    )
  }

  // Early return if stats are not loaded yet
  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-gray-300">Manage AstroQuiz content and users</p>
          </div>
          <button
            onClick={fetchStats}
            disabled={statsLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-lg transition-all duration-200 disabled:opacity-50"
            title="Refresh statistics"
          >
            <RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh Stats</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 relative">
          {statsLoading && (
            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{(stats?.totalQuestions || 0).toLocaleString()}</h3>
              <p className="text-gray-400">Questions</p>
            </div>
            <HelpCircle className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 relative">
          {statsLoading && (
            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{(stats?.totalUsers || 0).toLocaleString()}</h3>
              <p className="text-gray-400">Users</p>
            </div>
            <Users className="h-8 w-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 relative">
          {statsLoading && (
            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{(stats?.totalQuizSessions || 0).toLocaleString()}</h3>
              <p className="text-gray-400">Quiz Sessions</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-400" />
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 relative">
          {statsLoading && (
            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{stats?.avgScore || 0}%</h3>
              <p className="text-gray-400">Avg Score</p>
            </div>
            <Settings className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-1 border border-white/20 inline-flex">
          {(['questions', 'users', 'stats', 'ai-generator'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 capitalize flex items-center space-x-2 ${
                activeTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab === 'ai-generator' && <Brain className="h-4 w-4" />}
              <span>{tab === 'ai-generator' ? 'AI Generator' : tab}</span>
            </button>
          ))}
        </div>
      </div>

      {/* AI Generator Tab */}
      {activeTab === 'ai-generator' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <Brain className="h-6 w-6 text-purple-400" />
                <span>AI Question Generator</span>
              </h2>
              <p className="text-gray-300 mt-1">Generate quiz questions automatically using AI</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8">
            <form onSubmit={handleGenerateQuestions} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Topic
                  </label>
                  <input
                    type="text"
                    value={aiGeneratorData.topic}
                    onChange={(e) => setAiGeneratorData({ ...aiGeneratorData, topic: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Solar System, Ancient History, Machine Learning..."
                    required
                    disabled={isGenerating}
                  />
                  <p className="text-gray-400 text-sm mt-1">
                    Enter any topic you'd like to generate questions about
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Number of Questions
                  </label>
                  <select
                    value={aiGeneratorData.count}
                    onChange={(e) => setAiGeneratorData({ ...aiGeneratorData, count: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isGenerating}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map(num => (
                      <option key={num} value={num} className="bg-gray-800">
                        {num} question{num !== 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                    <button
                      key={difficulty}
                      type="button"
                      onClick={() => setAiGeneratorData({ ...aiGeneratorData, difficulty })}
                      disabled={isGenerating}
                      className={`px-4 py-3 rounded-lg border-2 transition-all duration-200 capitalize font-medium ${
                        aiGeneratorData.difficulty === difficulty
                          ? difficulty === 'easy' ? 'bg-green-500/20 border-green-500 text-green-400'
                            : difficulty === 'medium' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                            : 'bg-red-500/20 border-red-500 text-red-400'
                          : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30'
                      } disabled:opacity-50`}
                    >
                      {difficulty}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-gray-400">
                  <p>• Questions will be automatically saved to your database</p>
                  <p>• Each question will have 4 multiple choice options</p>
                  <p>• Generation typically takes 10-30 seconds</p>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating || !aiGeneratorData.topic.trim()}
                  className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-400 hover:to-blue-500 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isGenerating ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      <span>Generate Questions</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Generation Result */}
            {generationResult && (
              <div className={`mt-6 p-4 rounded-lg border ${
                generationResult.includes('Successfully') 
                  ? 'bg-green-500/20 border-green-500/30 text-green-400'
                  : 'bg-red-500/20 border-red-500/30 text-red-400'
              }`}>
                <div className="flex items-center space-x-2">
                  {generationResult.includes('Successfully') ? (
                    <Sparkles className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                  <span>{generationResult}</span>
                </div>
              </div>
            )}

            {/* AI Generator Info */}
            <div className="mt-8 bg-gradient-to-r from-purple-500/10 to-blue-600/10 backdrop-blur-md rounded-xl border border-purple-500/20 p-6">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
                <Brain className="h-5 w-5 text-purple-400" />
                <span>How AI Generation Works</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                <div>
                  <h4 className="font-semibold text-white mb-2">✨ Smart Question Creation</h4>
                  <p>Our AI analyzes your topic and creates relevant, educational questions with proper difficulty scaling.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">🎯 Quality Assurance</h4>
                  <p>Each generated question is validated for format, accuracy, and educational value before being saved.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">📚 Diverse Topics</h4>
                  <p>Generate questions on any subject - from science and history to pop culture and current events.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">⚡ Instant Integration</h4>
                  <p>Generated questions are immediately available in your quiz pool and can be used in games right away.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <h2 className="text-2xl font-bold text-white">Questions Management</h2>
            <button
              onClick={() => setShowQuestionForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-semibold rounded-lg transition-all duration-300"
            >
              <Plus className="h-4 w-4" />
              <span>Add Question</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Search Questions
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={questionsFilter.search || ''}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search by question text..."
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={questionsFilter.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="" className="bg-gray-800">All Categories</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat} className="bg-gray-800">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Difficulty
                </label>
                <select
                  value={questionsFilter.difficulty || ''}
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="" className="bg-gray-800">All Difficulties</option>
                  <option value="easy" className="bg-gray-800">Easy</option>
                  <option value="medium" className="bg-gray-800">Medium</option>
                  <option value="hard" className="bg-gray-800">Hard</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
              <span>
                Showing {questions.length} of {totalQuestions} questions
              </span>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span>
                  {(questionsFilter.search || questionsFilter.category || questionsFilter.difficulty) ? 'Filtered' : 'All'} results
                </span>
              </div>
            </div>
          </div>

          {/* Questions Table */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white transition-colors duration-200"
                      onClick={() => handleSort('question_text')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Question</span>
                        {getSortIcon('question_text')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white transition-colors duration-200"
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Category</span>
                        {getSortIcon('category')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white transition-colors duration-200"
                      onClick={() => handleSort('difficulty')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Difficulty</span>
                        {getSortIcon('difficulty')}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Options
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Correct Answer
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white transition-colors duration-200"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Created</span>
                        {getSortIcon('created_at')}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {questions.map((question) => (
                    <tr key={question.id} className="hover:bg-white/5 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-white font-medium truncate" title={question.question_text || ''}>
                            {question.question_text || 'No question text'}
                          </p>
                          {question.image_url && (
                            <p className="text-gray-400 text-xs mt-1">Has image</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                          {question.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          question.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                          question.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {question.difficulty || 'medium'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-300 text-sm">
                          {(question.options || []).length} options
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white text-sm font-medium">
                          {(question.options || [])[question.correct_answer || 0] || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-400 text-sm">
                          {question.created_at ? new Date(question.created_at).toLocaleDateString() : 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditQuestion(question)}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors duration-200"
                            title="Edit question"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors duration-200"
                            title="Delete question"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white/5 px-6 py-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Page {questionsFilter.page} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange((questionsFilter.page || 1) - 1)}
                      disabled={questionsFilter.page === 1}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, (questionsFilter.page || 1) - 2)) + i
                      if (pageNum > totalPages) return null
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 rounded text-sm transition-colors duration-200 ${
                            pageNum === questionsFilter.page
                              ? 'bg-blue-500 text-white'
                              : 'text-gray-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    
                    <button
                      onClick={() => handlePageChange((questionsFilter.page || 1) + 1)}
                      disabled={questionsFilter.page === totalPages}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {questions.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {questionsFilter.search || questionsFilter.category || questionsFilter.difficulty 
                  ? 'No questions match your filters' 
                  : 'No questions found'
                }
              </h3>
              <p className="text-gray-400">
                {questionsFilter.search || questionsFilter.category || questionsFilter.difficulty 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Create your first question to get started!'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">User Management</h2>
            <div className="text-gray-300 text-sm">
              Total Users: {users.length}
            </div>
          </div>

          {/* Users List */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
            <div className="divide-y divide-white/10">
              {users.map((userProfile) => (
                <div key={userProfile.id} className="p-6 hover:bg-white/5 transition-colors duration-200">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {(userProfile.username || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="text-white font-semibold">{userProfile.username || 'Unknown User'}</h3>
                          {userProfile.is_admin && (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium flex items-center space-x-1">
                              <Shield className="h-3 w-3" />
                              <span>Admin</span>
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{userProfile.email || 'No email'}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3" />
                            <span>{userProfile.total_score || 0} points</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Zap className="h-3 w-3" />
                            <span>{userProfile.best_streak || 0} streak</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <BarChart3 className="h-3 w-3" />
                            <span>{userProfile.games_played || 0} games</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Joined {userProfile.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleToggleAdmin(userProfile.id, userProfile.is_admin || false)}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          userProfile.is_admin
                            ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10'
                            : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10'
                        }`}
                        title={userProfile.is_admin ? 'Remove admin privileges' : 'Grant admin privileges'}
                      >
                        {userProfile.is_admin ? <Shield className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                      </button>
                      
                      {userProfile.id !== user?.id && (
                        <button
                          onClick={() => handleDeleteUser(userProfile.id, userProfile.username || 'Unknown User')}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors duration-200"
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Users Found</h3>
              <p className="text-gray-400">Users will appear here once they sign up for the platform.</p>
            </div>
          )}
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Platform Statistics</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Live Updates</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 text-center relative">
              {statsLoading && (
                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              )}
              <HelpCircle className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-white mb-2">{(stats?.totalQuestions || 0).toLocaleString()}</h3>
              <p className="text-gray-400">Total Questions</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 text-center relative">
              {statsLoading && (
                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              )}
              <Users className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-white mb-2">{(stats?.totalUsers || 0).toLocaleString()}</h3>
              <p className="text-gray-400">Registered Users</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 text-center relative">
              {statsLoading && (
                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              )}
              <BarChart3 className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-white mb-2">{(stats?.totalQuizSessions || 0).toLocaleString()}</h3>
              <p className="text-gray-400">Quiz Sessions</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 text-center relative">
              {statsLoading && (
                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              )}
              <Star className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-3xl font-bold text-white mb-2">{stats?.avgScore || 0}%</h3>
              <p className="text-gray-400">Average Score</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <span>Platform Health</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 mb-1">
                  {(stats?.totalQuestions || 0) > 0 ? 'Active' : 'Inactive'}
                </div>
                <p className="text-gray-400 text-sm">Question Database</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  {(stats?.totalUsers || 0) > 0 ? 'Growing' : 'Empty'}
                </div>
                <p className="text-gray-400 text-sm">User Base</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400 mb-1">
                  {(stats?.totalQuizSessions || 0) > 0 ? 'Engaged' : 'Waiting'}
                </div>
                <p className="text-gray-400 text-sm">User Activity</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Real-time Features</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2 text-gray-300">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <span>Live statistics updates</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <span>Automatic data refresh</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <span>Question management sync</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-300">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <span>User activity monitoring</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Form Modal */}
      {showQuestionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </h2>
              <button
                onClick={() => {
                  setShowQuestionForm(false)
                  setEditingQuestion(null)
                  resetForm()
                }}
                className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleQuestionSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Question Text
                </label>
                <textarea
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Enter your question..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat} className="bg-gray-800">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="easy" className="bg-gray-800">Easy</option>
                    <option value="medium" className="bg-gray-800">Medium</option>
                    <option value="hard" className="bg-gray-800">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Answer Options
                </label>
                <div className="space-y-3">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="correct_answer"
                        checked={formData.correct_answer === index}
                        onChange={() => setFormData({ ...formData, correct_answer: index })}
                        className="text-blue-500"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...formData.options]
                          newOptions[index] = e.target.value
                          setFormData({ ...formData, options: newOptions })
                        }}
                        className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`Option ${index + 1}`}
                        required
                      />
                    </div>
                  ))}
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  Select the radio button next to the correct answer
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuestionForm(false)
                    setEditingQuestion(null)
                    resetForm()
                  }}
                  className="px-6 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-semibold rounded-lg transition-all duration-300"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingQuestion ? 'Update' : 'Create'} Question</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}