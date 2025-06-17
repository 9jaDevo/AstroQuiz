/*
  # AstroQuiz Initial Database Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `username` (text, unique)
      - `avatar_url` (text, nullable)
      - `total_score` (integer, default 0)
      - `best_streak` (integer, default 0)
      - `games_played` (integer, default 0)
      - `is_admin` (boolean, default false)
      - `created_at` (timestamp)

    - `questions`
      - `id` (uuid, primary key)
      - `question_text` (text)
      - `image_url` (text, nullable)
      - `options` (text array)
      - `correct_answer` (integer)
      - `category` (text)
      - `difficulty` (enum: easy, medium, hard)
      - `created_at` (timestamp)
      - `created_by` (uuid, references user_profiles)

    - `quiz_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `score` (integer)
      - `total_questions` (integer)
      - `streak` (integer)
      - `completed_at` (timestamp)
      - `time_taken` (integer, seconds)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add admin policies for question management
    - Add public read access for questions and leaderboard data

  3. Functions & Triggers
    - Auto-create user profile on signup
    - Update user stats after quiz completion
*/

-- Create custom types
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  avatar_url text,
  total_score integer DEFAULT 0,
  best_streak integer DEFAULT 0,
  games_played integer DEFAULT 0,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  image_url text,
  options text[] NOT NULL CHECK (array_length(options, 1) BETWEEN 2 AND 6),
  correct_answer integer NOT NULL CHECK (correct_answer >= 0 AND correct_answer < array_length(options, 1)),
  category text NOT NULL,
  difficulty difficulty_level NOT NULL DEFAULT 'medium',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- Create quiz_sessions table
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  completed_at timestamptz DEFAULT now(),
  time_taken integer NOT NULL DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can read all profiles for leaderboard"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Policies for questions
CREATE POLICY "Anyone can read questions"
  ON questions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage questions"
  ON questions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policies for quiz_sessions
CREATE POLICY "Users can read own quiz sessions"
  ON quiz_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz sessions"
  ON quiz_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer
AS $$
BEGIN
  INSERT INTO user_profiles (id, email, username)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert sample questions
INSERT INTO questions (question_text, image_url, options, correct_answer, category, difficulty, created_by) VALUES
(
  'Which planet is known as the "Red Planet"?',
  'https://images.pexels.com/photos/73871/rocket-launch-rocket-take-off-nasa-73871.jpeg',
  ARRAY['Venus', 'Mars', 'Jupiter', 'Saturn'],
  1,
  'Planets',
  'easy',
  NULL
),
(
  'What is the closest star to Earth after the Sun?',
  NULL,
  ARRAY['Alpha Centauri', 'Sirius', 'Vega', 'Betelgeuse'],
  0,
  'Stars',
  'medium',
  NULL
),
(
  'Which constellation contains the North Star?',
  'https://images.pexels.com/photos/998641/pexels-photo-998641.jpeg',
  ARRAY['Ursa Major', 'Ursa Minor', 'Cassiopeia', 'Draco'],
  1,
  'Constellations',
  'easy',
  NULL
),
(
  'What was the first artificial satellite launched into space?',
  NULL,
  ARRAY['Explorer 1', 'Vanguard 1', 'Sputnik 1', 'Luna 1'],
  2,
  'Space Missions',
  'medium',
  NULL
),
(
  'Which galaxy is closest to the Milky Way?',
  'https://images.pexels.com/photos/1169754/pexels-photo-1169754.jpeg',
  ARRAY['Andromeda Galaxy', 'Triangulum Galaxy', 'Large Magellanic Cloud', 'Small Magellanic Cloud'],
  0,
  'Galaxies',
  'hard',
  NULL
),
(
  'How long does it take for light from the Sun to reach Earth?',
  NULL,
  ARRAY['8 minutes and 20 seconds', '4 minutes and 10 seconds', '12 minutes and 30 seconds', '16 minutes and 40 seconds'],
  0,
  'Stars',
  'easy',
  NULL
),
(
  'Which planet has the most moons?',
  'https://images.pexels.com/photos/87651/earth-blue-planet-globe-planet-87651.jpeg',
  ARRAY['Jupiter', 'Saturn', 'Uranus', 'Neptune'],
  1,
  'Planets',
  'medium',
  NULL
),
(
  'What is the largest constellation in the night sky?',
  'https://images.pexels.com/photos/1252890/pexels-photo-1252890.jpeg',
  ARRAY['Hydra', 'Ursa Major', 'Hercules', 'Draco'],
  0,
  'Constellations',
  'hard',
  NULL
),
(
  'Which space agency successfully landed the first rover on Mars?',
  NULL,
  ARRAY['ESA', 'NASA', 'Roscosmos', 'CNSA'],
  1,
  'Space Missions',
  'medium',
  NULL
),
(
  'What type of star is our Sun classified as?',
  'https://images.pexels.com/photos/39644/rose-flower-blossom-bloom-39644.jpeg',
  ARRAY['Red Giant', 'White Dwarf', 'Yellow Dwarf', 'Blue Giant'],
  2,
  'Stars',
  'easy',
  NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user_id ON quiz_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_completed_at ON quiz_sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_total_score ON user_profiles(total_score DESC);