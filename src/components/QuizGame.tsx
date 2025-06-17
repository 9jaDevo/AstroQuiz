import React, { useState, useEffect } from 'react'
import { Clock, Star, Zap, ChevronRight, CheckCircle, XCircle, Languages, Globe, Loader2 } from 'lucide-react'
import { questionsAPI, quizAPI, userAPI, translationAPI, integrityAPI } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import type { Question } from '../services/api'

interface TranslatedQuestion {
  question_text: string
  options: string[]
}

export default function QuizGame() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [loading, setLoading] = useState(true)
  const [gameStarted, setGameStarted] = useState(false)
  const [isTranslationEnabled, setIsTranslationEnabled] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState('en')
  const [translatedQuestion, setTranslatedQuestion] = useState<TranslatedQuestion | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationError, setTranslationError] = useState<string | null>(null)

  const { user } = useAuth()

  // Available languages for translation
  const availableLanguages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
  ]

  useEffect(() => {
    fetchQuestions()
  }, [])

  useEffect(() => {
    if (isTranslationEnabled && currentLanguage !== 'en' && questions.length > 0) {
      translateCurrentQuestion()
    } else {
      setTranslatedQuestion(null)
    }
  }, [isTranslationEnabled, currentLanguage, currentQuestionIndex, questions])

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && !showResult) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !showResult) {
      handleAnswerSubmit()
    }
  }, [timeLeft, showResult, gameStarted])

  const fetchQuestions = async () => {
    try {
      const { data, error } = await questionsAPI.getRandomQuestions(10)
      if (error) throw error
      setQuestions(data)
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const startGame = () => {
    setGameStarted(true)
    setTimeLeft(30)
  }

  const handleAnswerSubmit = async () => {
    const currentQuestion = questions[currentQuestionIndex]
    const isCorrect = selectedAnswer === currentQuestion.correct_answer

    setShowResult(true)

    if (isCorrect) {
      setScore(score + 1)
      setStreak(streak + 1)
    } else {
      setStreak(0)
    }

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        setSelectedAnswer(null)
        setShowResult(false)
        setTimeLeft(30)
      } else {
        completeQuiz()
      }
    }, 2000)
  }

  const completeQuiz = async () => {
    setQuizCompleted(true)
    
    if (user) {
      try {
        // Save quiz session
        const { data: sessionData, error: sessionError } = await quizAPI.createSession({
          user_id: user.id,
          score,
          total_questions: questions.length,
          streak,
          time_taken: (questions.length * 30) - timeLeft,
        })

        if (sessionError) {
          console.error('Error saving quiz session:', sessionError)
        } else if (sessionData) {
          // Run cheat detection in background (non-blocking)
          integrityAPI.detectCheating({
            session_id: sessionData.id,
            user_id: user.id,
            score,
            total_questions: questions.length,
            time_taken: (questions.length * 30) - timeLeft,
            streak
          }).catch(error => {
            console.error('Cheat detection failed (non-critical):', error)
          })
        }

        // Update user profile stats
        const { data: profile } = await userAPI.getProfile(user.id)

        if (profile) {
          await userAPI.updateProfile(user.id, {
            total_score: profile.total_score + score,
            best_streak: Math.max(profile.best_streak, streak),
            games_played: profile.games_played + 1,
          })
        }
      } catch (error) {
        console.error('Error saving quiz results:', error)
      }
    }
  }

  const translateCurrentQuestion = async () => {
    if (!questions[currentQuestionIndex] || currentLanguage === 'en') return

    setIsTranslating(true)
    setTranslationError(null)

    try {
      const currentQ = questions[currentQuestionIndex]
      
      // Translate question text
      const { data: questionData, error: questionError } = await translationAPI.translateText(
        currentQ.question_text,
        currentLanguage
      )

      if (questionError) {
        throw new Error(questionError)
      }

      // Translate all options
      const translatedOptions: string[] = []
      for (const option of currentQ.options) {
        const { data: optionData, error: optionError } = await translationAPI.translateText(
          option,
          currentLanguage
        )

        if (optionError) {
          throw new Error(optionError)
        }

        translatedOptions.push(optionData.translatedText)
      }

      setTranslatedQuestion({
        question_text: questionData.translatedText,
        options: translatedOptions
      })
    } catch (error: any) {
      console.error('Translation error:', error)
      setTranslationError(error.message || 'Failed to translate question')
      setTranslatedQuestion(null)
    } finally {
      setIsTranslating(false)
    }
  }

  const handleLanguageChange = (langCode: string) => {
    setCurrentLanguage(langCode)
    if (langCode === 'en') {
      setIsTranslationEnabled(false)
    } else {
      setIsTranslationEnabled(true)
    }
  }

  const resetQuiz = () => {
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setScore(0)
    setStreak(0)
    setShowResult(false)
    setQuizCompleted(false)
    setTimeLeft(30)
    setGameStarted(false)
    setIsTranslationEnabled(false)
    setCurrentLanguage('en')
    setTranslatedQuestion(null)
    setIsTranslating(false)
    setTranslationError(null)
    fetchQuestions()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-white">
          <p className="text-xl">No questions available</p>
          <p className="text-gray-400 mt-2">Please check back later</p>
        </div>
      </div>
    )
  }

  if (!gameStarted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Language Selection */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Languages className="h-5 w-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Choose Your Language</h3>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">Translation powered by AI</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  currentLanguage === lang.code
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30'
                }`}
              >
                <div className="text-lg mb-1">{lang.flag}</div>
                <div className="text-sm font-medium">{lang.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
              <Star className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Ready to Explore the Universe?</h1>
            <p className="text-gray-300 text-lg mb-8">
              Test your astronomy knowledge with {questions.length} challenging questions!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/5 rounded-lg p-4">
              <Clock className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <h3 className="text-white font-semibold">30 Seconds</h3>
              <p className="text-gray-400 text-sm">Per Question</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <h3 className="text-white font-semibold">Build Streaks</h3>
              <p className="text-gray-400 text-sm">Consecutive Correct</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <Star className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <h3 className="text-white font-semibold">Earn Points</h3>
              <p className="text-gray-400 text-sm">Climb Leaderboard</p>
            </div>
          </div>

          <button
            onClick={startGame}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            Start Quiz
          </button>
        </div>
      </div>
    )
  }

  if (quizCompleted) {
    const percentage = Math.round((score / questions.length) * 100)
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full mb-4">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Quiz Completed!</h1>
            <p className="text-gray-300">Great job exploring the cosmos</p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-blue-400">{score}/{questions.length}</h3>
              <p className="text-gray-400">Score</p>
            </div>
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-purple-400">{percentage}%</h3>
              <p className="text-gray-400">Accuracy</p>
            </div>
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-yellow-400">{streak}</h3>
              <p className="text-gray-400">Best Streak</p>
            </div>
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-green-400">
                {percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : 'Keep Learning'}
              </h3>
              <p className="text-gray-400">Rating</p>
            </div>
          </div>

          <button
            onClick={resetQuiz}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            Play Again
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const displayQuestion = isTranslationEnabled && translatedQuestion ? translatedQuestion : currentQuestion

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-300 text-sm">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-yellow-400">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-semibold">{streak}</span>
            </div>
            <div className="flex items-center space-x-1 text-blue-400">
              <Star className="h-4 w-4" />
              <span className="text-sm font-semibold">{score}</span>
            </div>
          </div>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Language Controls */}
      <div className="flex justify-center mb-6">
        <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 p-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Languages className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-300">Language:</span>
            </div>
            
            <select
              value={currentLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={isTranslating}
              className="bg-white/10 border border-white/20 rounded px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {availableLanguages.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-slate-800">
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
            
            {isTranslating && (
              <div className="flex items-center space-x-2 text-blue-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Translating...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Translation Error */}
      {translationError && (
        <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-center">
          <p className="text-sm">Translation failed: {translationError}</p>
          <p className="text-xs mt-1">Showing original English version</p>
        </div>
      )}

      {/* Timer */}
      <div className="text-center mb-6">
        <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${
          timeLeft <= 10 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'
        }`}>
          <Clock className="h-4 w-4" />
          <span className="font-mono font-bold">{timeLeft}s</span>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 mb-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
              {currentQuestion.category}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              currentQuestion.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
              currentQuestion.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {currentQuestion.difficulty}
            </span>
          </div>
          
          {currentQuestion.image_url && (
            <div className="mb-6 rounded-lg overflow-hidden">
              <img
                src={currentQuestion.image_url}
                alt="Question"
                className="w-full h-64 object-cover"
              />
            </div>
          )}
          
          <h2 className="text-2xl font-bold text-white mb-6">
            {displayQuestion.question_text}
          </h2>
        </div>

        {/* Answer Options */}
        <div className="grid gap-4">
          {displayQuestion.options.map((option, index) => {
            let buttonClass = "w-full p-4 text-left rounded-lg border-2 transition-all duration-200 hover:scale-105 "
            
            if (showResult) {
              if (index === currentQuestion.correct_answer) {
                buttonClass += "bg-green-500/20 border-green-500 text-green-400"
              } else if (index === selectedAnswer && index !== currentQuestion.correct_answer) {
                buttonClass += "bg-red-500/20 border-red-500 text-red-400"
              } else {
                buttonClass += "bg-white/5 border-white/20 text-gray-400"
              }
            } else if (selectedAnswer === index) {
              buttonClass += "bg-blue-500/20 border-blue-500 text-blue-400"
            } else {
              buttonClass += "bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30"
            }

            return (
              <button
                key={index}
                onClick={() => setSelectedAnswer(index)}
                disabled={showResult}
                className={buttonClass}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option}</span>
                  {showResult && index === currentQuestion.correct_answer && (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  )}
                  {showResult && index === selectedAnswer && index !== currentQuestion.correct_answer && (
                    <XCircle className="h-5 w-5 text-red-400" />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Submit Button */}
        {!showResult && (
          <div className="mt-6 text-center">
            <button
              onClick={handleAnswerSubmit}
              disabled={selectedAnswer === null}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2 mx-auto"
            >
              <span>Submit Answer</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}