import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Telescope, 
  Star, 
  Users, 
  Trophy, 
  Zap, 
  ChevronRight,
  Play,
  Award,
  Target,
  Globe
} from 'lucide-react'
import VideoModal from './VideoModal'

export default function LandingPage() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)

  const features = [
    {
      icon: <Target className="h-8 w-8" />,
      title: "Interactive Quizzes",
      description: "Test your knowledge with image-based questions covering constellations, planets, and space missions."
    },
    {
      icon: <Trophy className="h-8 w-8" />,
      title: "Live Leaderboards",
      description: "Compete with fellow astronomers and climb the cosmic rankings in real-time."
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Streak Challenges",
      description: "Build impressive answer streaks and unlock achievements as you master the universe."
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Multiple Categories",
      description: "Explore diverse topics from stellar formation to space exploration history."
    }
  ]

  const stats = [
    { number: "1000+", label: "Questions" },
    { number: "50+", label: "Categories" },
    { number: "10K+", label: "Quiz Sessions" },
    { number: "500+", label: "Active Users" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="stars absolute inset-0 opacity-60"></div>
        <div className="stars2 absolute inset-0 opacity-40"></div>
        <div className="stars3 absolute inset-0 opacity-30"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/5 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img 
                  src="/logo.png" 
                  alt="AstroQuiz Logo"
                  className="h-10 w-10 rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
                <div className="hidden p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Telescope className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  AstroQuiz
                </h1>
                <p className="text-xs text-gray-400 -mt-1">Learn the Universe</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                to="/auth"
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-8 animate-pulse">
              <Telescope className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
              Explore the Universe
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Master astronomy through interactive quizzes, compete with fellow stargazers, 
              and unlock the mysteries of the cosmos one question at a time.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              to="/auth"
              className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
            >
              <Play className="h-5 w-5" />
              <span>Start Learning</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            <button 
              onClick={() => setIsVideoModalOpen(true)}
              className="group px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
            >
              <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                <Play className="h-3 w-3 text-white fill-current ml-0.5" />
              </div>
              <span>Watch Demo</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400 text-sm md:text-base">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Choose AstroQuiz?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Our platform combines cutting-edge technology with engaging content 
              to create the ultimate astronomy learning experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 hover:bg-white/15 transition-all duration-300 transform hover:scale-105"
              >
                <div className="text-blue-400 mb-4 group-hover:text-purple-400 transition-colors duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Get started in three simple steps and begin your cosmic journey today.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">1. Sign Up</h3>
              <p className="text-gray-300 leading-relaxed">
                Create your free account and join our community of astronomy enthusiasts 
                from around the world.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">2. Take Quizzes</h3>
              <p className="text-gray-300 leading-relaxed">
                Challenge yourself with our extensive collection of astronomy questions 
                across multiple categories and difficulty levels.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">3. Compete & Learn</h3>
              <p className="text-gray-300 leading-relaxed">
                Track your progress, compete on leaderboards, and unlock achievements 
                as you master the mysteries of space.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 backdrop-blur-md rounded-3xl border border-white/20 p-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Explore?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of astronomy enthusiasts who are already expanding 
              their cosmic knowledge with AstroQuiz.
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              <Telescope className="h-5 w-5" />
              <span>Start Your Journey</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-white/5 backdrop-blur-md border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="relative">
                <img 
                  src="/logo.png" 
                  alt="AstroQuiz Logo"
                  className="h-8 w-8 rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
                <div className="hidden p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Telescope className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  AstroQuiz
                </h3>
                <p className="text-xs text-gray-400 -mt-1">Learn the Universe</p>
              </div>
            </div>
            <div className="text-gray-400 text-sm">
              © 2025 AstroQuiz. Exploring the cosmos through knowledge.
            </div>
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoId="0t0AnnrSjck"
        title="AstroQuiz Demo - Learn Astronomy Through Interactive Quizzes"
      />
    </div>
  )
}