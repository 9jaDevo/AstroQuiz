# 🌟 AstroQuiz - Learn the Universe

A modern, interactive astronomy learning platform built with React, TypeScript, and Supabase. Test your knowledge of the cosmos through engaging quizzes, compete on leaderboards, and learn with an AI-powered astronomy tutor.

![AstroQuiz Banner](https://images.pexels.com/photos/1169754/pexels-photo-1169754.jpeg?auto=compress&cs=tinysrgb&w=1200&h=400&fit=crop)

## ✨ Features

### 🎯 Interactive Quiz System
- **Dynamic Questions**: Randomized astronomy questions with multiple difficulty levels
- **Real-time Scoring**: Instant feedback with streak tracking
- **Timed Challenges**: 30-second timer per question for added excitement
- **Visual Learning**: Image-based questions for enhanced engagement
- **Progress Tracking**: Detailed statistics and performance analytics

### 🌍 Multi-language Support
- **AI-Powered Translation**: Questions available in 10+ languages
- **Real-time Translation**: Instant question translation during quizzes
- **Fallback Support**: Multiple AI providers ensure reliable translation
- **Language Selection**: Easy language switching with flag indicators

### 🏆 Competitive Features
- **Live Leaderboards**: Real-time rankings with automatic updates
- **Achievement System**: Unlock badges and milestones
- **Streak Challenges**: Build impressive answer streaks
- **Performance Analytics**: Detailed accuracy and speed metrics

### 🤖 AI Astronomy Tutor
- **Interactive Chat**: Ask questions about astronomy and space science
- **Expert Knowledge**: Specialized in astronomy, planets, stars, and space missions
- **Conversation History**: Maintains context for natural conversations
- **Multiple AI Providers**: OpenAI, Hugging Face, and custom endpoints

### 🛡️ Integrity Detection
- **Automated Monitoring**: AI-powered cheating detection
- **Anomaly Analysis**: Speed and pattern analysis
- **Confidence Scoring**: Detailed suspicion assessment
- **Visual Indicators**: Subtle warnings on leaderboards

### 👨‍💼 Admin Panel
- **Question Management**: Create, edit, and organize quiz questions
- **AI Question Generation**: Bulk generate questions on any astronomy topic
- **User Management**: Monitor users and suspicious activities
- **Analytics Dashboard**: Comprehensive platform statistics

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Lucide React** for icons
- **Vite** for development and building

### Backend
- **Supabase** for database and authentication
- **PostgreSQL** with Row Level Security (RLS)
- **Supabase Edge Functions** for serverless computing
- **Real-time subscriptions** for live updates

### AI Integration
- **OpenAI GPT-3.5** for question generation and tutoring
- **Hugging Face** models as fallback
- **Custom AI endpoints** for additional reliability
- **Multi-provider architecture** for maximum uptime

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenAI API key (recommended)
- Hugging Face API key (optional fallback)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd astroquiz-learning-app
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# AI Provider Configuration
AI_PROVIDER=openai

# OpenAI API Configuration (recommended)
OPENAI_API_KEY=your_openai_api_key_here

# Hugging Face API Configuration (optional fallback)
HF_API_KEY=your_huggingface_api_key_here
```

### 3. Database Setup

#### Option A: Using Supabase Dashboard
1. Create a new Supabase project
2. Run the migration files in order from `supabase/migrations/`
3. Enable Row Level Security on all tables

#### Option B: Using Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize and link project
supabase init
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 4. Deploy Edge Functions
```bash
# Deploy all edge functions
supabase functions deploy ai-tutor-chat
supabase functions deploy generate-questions
supabase functions deploy translate-text
supabase functions deploy detect-cheating

# Set environment variables for functions
supabase secrets set OPENAI_API_KEY=your_openai_api_key
supabase secrets set HF_API_KEY=your_huggingface_api_key
supabase secrets set AI_PROVIDER=openai
```

### 5. Start Development Server
```bash
npm run dev
```

## 📊 Database Schema

### Core Tables

#### `user_profiles`
- User information and statistics
- Admin privileges and suspicion flags
- Performance metrics (total score, best streak, games played)

#### `questions`
- Quiz questions with multiple choice options
- Categories, difficulty levels, and images
- Creator tracking and timestamps

#### `quiz_sessions`
- Individual quiz attempt records
- Scoring, timing, and streak data
- Integrity flags and suspicion reasons

### Key Features
- **Row Level Security (RLS)** on all tables
- **Real-time subscriptions** for live updates
- **Automatic triggers** for data consistency
- **Performance indexes** for fast queries

## 🎮 Usage Guide

### For Students
1. **Sign Up**: Create an account with email and username
2. **Choose Language**: Select your preferred language for questions
3. **Take Quizzes**: Answer astronomy questions within the time limit
4. **Track Progress**: Monitor your scores, streaks, and achievements
5. **Ask the AI Tutor**: Get help with astronomy concepts
6. **Compete**: Climb the leaderboards and unlock achievements

### For Administrators
1. **Access Admin Panel**: Available to users with admin privileges
2. **Manage Questions**: Create, edit, and organize quiz content
3. **Generate Questions**: Use AI to bulk create questions on any topic
4. **Monitor Users**: Track user activity and suspicious behavior
5. **View Analytics**: Access platform-wide statistics and insights

## 🔧 Configuration

### AI Providers
The app supports multiple AI providers with automatic fallback:

1. **OpenAI** (Recommended)
   - Most reliable and accurate
   - Best for question generation and tutoring
   - Requires paid API key

2. **Hugging Face**
   - Free tier available
   - Good fallback option
   - May have occasional downtime

3. **Custom Endpoints**
   - Additional reliability
   - Configurable endpoints
   - Custom model support

### Environment Variables
```env
# AI Provider Selection
AI_PROVIDER=openai  # Options: openai, huggingface

# API Keys
OPENAI_API_KEY=sk-...
HF_API_KEY=hf_...

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## 🛡️ Security Features

### Authentication
- Supabase Auth with email/password
- Row Level Security (RLS) policies
- Secure session management
- Admin role protection

### Data Protection
- Encrypted data transmission
- Secure API endpoints
- Input validation and sanitization
- Rate limiting on AI endpoints

### Integrity Monitoring
- Automated cheating detection
- Anomaly analysis algorithms
- Confidence scoring system
- Non-intrusive monitoring

## 🚀 Deployment

### Frontend Deployment
The app can be deployed to any static hosting service:

```bash
# Build for production
npm run build

# Deploy to your preferred platform
# (Vercel, Netlify, GitHub Pages, etc.)
```

### Backend Deployment
Supabase handles all backend infrastructure:
- Database hosting and backups
- Edge Functions deployment
- Real-time subscriptions
- Authentication services

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Maintain component modularity
- Add proper error handling
- Include comprehensive logging

## 📝 API Documentation

### Edge Functions

#### `/functions/v1/ai-tutor-chat`
Chat with the AI astronomy tutor
```typescript
POST /functions/v1/ai-tutor-chat
{
  "message": "What is a black hole?",
  "conversation_history": [...]
}
```

#### `/functions/v1/generate-questions`
Generate quiz questions using AI
```typescript
POST /functions/v1/generate-questions
{
  "topic": "Solar System",
  "count": 5,
  "difficulty": "medium"
}
```

#### `/functions/v1/translate-text`
Translate text to different languages
```typescript
POST /functions/v1/translate-text
{
  "text": "What is the largest planet?",
  "targetLang": "es"
}
```

#### `/functions/v1/detect-cheating`
Analyze quiz sessions for suspicious behavior
```typescript
POST /functions/v1/detect-cheating
{
  "session_id": "uuid",
  "user_id": "uuid",
  "score": 8,
  "total_questions": 10,
  "time_taken": 45,
  "streak": 5
}
```

## 🐛 Troubleshooting

### Common Issues

#### CORS Errors
- Ensure Supabase Edge Functions are properly deployed
- Check environment variables are set correctly
- Verify API endpoints are accessible

#### Translation Not Working
- Confirm AI provider API keys are configured
- Check Edge Function logs in Supabase dashboard
- Verify language codes are supported

#### Database Connection Issues
- Verify Supabase URL and keys in `.env`
- Check RLS policies are properly configured
- Ensure migrations have been applied

#### Performance Issues
- Monitor database query performance
- Check for proper indexing
- Optimize real-time subscriptions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for the excellent backend-as-a-service platform
- **OpenAI** for powerful AI capabilities
- **Pexels** for beautiful astronomy images
- **Lucide** for the comprehensive icon library
- **Tailwind CSS** for the utility-first CSS framework

## 📞 Support

For support, please:
1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed information
4. Contact the development team

---

**Built with ❤️ for astronomy enthusiasts and learners everywhere**

*Explore the universe, one question at a time* 🌌